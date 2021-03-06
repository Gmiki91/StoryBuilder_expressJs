const Story = require('../models/story');
const catchAsync = require('../utils/catchAsync');
const { stringToNum, numToString, getTextByCode } = require('../utils/levelMapping');
const { getLanguageObject } = require('../utils/languageMapping');
const AppError = require('../utils/appError');
const wilson = require('wilson-score-interval');
const saveVote = require('../utils/vote');

exports.createStory = catchAsync(async (req, res, next) => {
    const { title, description, language, level, user, pageId, word1, word2, word3 } = req.body;
    if (user.confirmed && user.frogcoins < 3) return next(new AppError('You need 3 accepted page to create a new story.', 400));
    const story = await Story.create({
        title: title,
        description: description,
        language: language,
        levels: [{ userId: user._id, rate: stringToNum(level) }],
        authorId: user._id,
        authorName: user.name,
        ratings: [],
        upVotes: 0,
        ratingAvg: 0,
        updatedAt: Date.now(),
        pageIds: [pageId],
        pendingPageIds: [],
        word1: word1,
        word2: word2,
        word3: word3
    });
    if (!user.confirmed) {
        user.confirmed = true
    } else {
        user.frogcoins -= 3;
    }
    user.save();
    res.status(201).json({
        status: 'success',
        storyId: story._id
    })
})

exports.getStory = catchAsync(async (req, res, next) => {
    const story = await Story.findById(req.params.id);
    res.status(200).json({
        status: 'success',
        story: mappedStory(story)
    })
})

exports.getTributeData = catchAsync(async (req, res, next) => {
    const { user } = req.body;
    const oneDay = 24 * 60 * 60 * 1000;
    const millisecondsLeft = oneDay - ((Date.now() - user.signedUpAt) % oneDay);
    const minutesLeft = millisecondsLeft / 1000 / 60;
    const hoursLeft = millisecondsLeft / 1000 / 60 / 60;
    const timesUp = user.markedStoryAt + oneDay < Date.now();
    if (user.dailyCompleted && !timesUp) {
        return res.status(200).json({
            status: 'success',
            minutesLeft,
            hoursLeft
        });
    }
    let storyId = user.markedStoryId;

    if (!storyId || timesUp) {
        const { langInfo } = req.body;
        const { level, language } = langInfo[Math.floor(Math.random() * langInfo.length)];

        const stories = await Story.find({ language, open: true, authorId: { $ne: user._id } });

        const mappedStories = stories.map(story => {
            const { levels, _id } = story.toObject();
            return ({
                _id,
                level: levels.reduce((sum, level) => sum + level.rate, 0) / levels.length
            });
        })

        // Look for level && language match
        const filterStories = () => mappedStories.filter(story => story.level < level + count && story.level > level - count);
        let count = 0.5;
        let filteredStories = [];
        while (filteredStories.length === 0 && count < 6) {
            filteredStories = filterStories();
            count++;
        }

        // Look for language && level match, exclude previous daily story
        filteredStories = filteredStories.filter(story => story._id !== user.markedStoryId);
        // look for language match, exclude previous daily story
        if (filteredStories.length === 0)
            filteredStories = await Story.find({ language, open: true, _id: { $ne: user.markedStoryId } });
        // look for language match
        if (filteredStories.length === 0) filteredStories = await Story.find({ language, open: true });
        // look for anything
        if (filteredStories.length === 0) filteredStories = await Story.find({ open: true });
        if (filteredStories.length === 0) return next(new AppError('Something went wrong, no stories found for the daily.', 500));
        storyId = filteredStories[Math.floor(Math.random() * filteredStories.length)]._id;

        user.markedStoryId = storyId;
        user.markedStoryAt = user.signedUpAt + (Math.floor((Date.now() - user.signedUpAt) / oneDay) * oneDay);
        user.dailyCompleted = false;
        user.save();
    }
    const story = await Story.findById(storyId);

    res.status(201).json({
        status: 'success',
        story: mappedStory(story),
        minutesLeft,
        hoursLeft
    })
})

exports.getStories = catchAsync(async (req, res, next) => {
    const { sortBy, sortDirection, storyName, languages, levels, open, from, user } = req.body;
    const query = {};
    const sortObject = {};
    if (from === 'own') query['authorId'] = user._id
    else if (from === 'favorite') query['_id'] = { $in: user.favoriteStoryIdList };
    if (storyName.length > 2) query['title'] = { $regex: new RegExp(`${storyName}`, 'i') };
    if (languages.length > 0) query['language'] = languages;
    if (open !== 'both') query['open'] = open;
    sortObject[sortBy] = sortDirection;
    const result = await Story
        .find(query)
        .sort(sortObject);

    let mappedResult = result.map(story => ({ ...mappedStory(story), key: story._id }));
    if (levels.length > 0) mappedResult = mappedResult.filter(story => levels.indexOf(story.level.code) !== -1);

    res.status(200).json({
        status: 'success',
        stories: mappedResult
    })
})

exports.editStory = catchAsync(async (req, res, next) => {
    const { description, title, story } = req.body;
    story.description = description;
    story.title = title;
    story.save();
    res.status(201).json({
        status: 'success',
        story: mappedStory(story)
    })
})

exports.openStory = catchAsync(async (req, res, next) => {
    const story = await Story.findOneAndUpdate(
        { _id: req.params.id },
        { open: req.body.open },
        { returnOriginal: false}
    )
    res.status(201).json({
        status: 'success',
        story: mappedStory(story)
    })
})

exports.rateStory = catchAsync(async (req, res, next) => {
    const { user, storyId, vote } = req.body;
    const story = await Story.findById(storyId);
    const updatedStory = await saveVote(user._id.toString(), vote, story);
    updateRateValues(story);
    updatedStory.save();
    res.status(201).json({
        status: 'success'
    })
})

exports.levelChange = catchAsync(async (req, res, next) => {
    const story = await Story.findById(req.body.storyId);
    if (!story) return next(new AppError(`No story found with ID ${req.body.storyId}`, 404))
    const rate = stringToNum(req.body.rate);
    const vote = story.levels.find(level => level.userId === req.body.user._id.toString());
    vote ? vote.rate = rate : story.levels.push({ userId: req.body.user._id, rate: rate });
    await story.save();
    res.status(201).json({
        status: 'success',
        story: mappedStory(story)
    })
})


exports.addPage = catchAsync(async (req, res, next) => {
    const { story, pageId, pageRatings } = req.body;
    story.pendingPageIds = []; //removing all pending pages;
    story.word1 = null;
    story.word2 = null;
    story.word3 = null;
    story.pageIds.push(pageId);

    if (pageRatings.length > 0) {
        story.ratings.push(pageRatings);
        updateRateValues(story);
    }

    story.updatedAt = Date.now();

    await story.save();
    res.status(200).json({
        status: 'success',
        story: mappedStory(story),
    })
})

exports.addPendingPage = catchAsync(async (req, res, next) => {
    const story = await Story.findById(req.body.storyId);
    story.pendingPageIds.push(req.body.pageId);
    story.updatedAt = Date.now();
    await story.save();
    res.status(200).json({
        status: 'success',
        story: mappedStory(story),
    })
})

exports.addWords = catchAsync(async (req, res, next) => {
    const story = await Story.findById(req.body.storyId);
    story.word1 = req.body.word1;
    story.word2 = req.body.word2;
    story.word3 = req.body.word3;

    await story.save();
    res.status(200).json({
        status: 'success',
        story: mappedStory(story)
    });
})

exports.removePendingPage = catchAsync(async (req, res, next) => {
    const { story } = req.body;
    const index = story.pendingPageIds.indexOf(req.body.pageId);
    story.pendingPageIds.splice(index, 1);
    await story.save();
    res.status(200).json({
        status: 'success',
        story: mappedStory(story)
    })
})

exports.getStoryDataByAuthor = catchAsync(async (req, res, next) => {
    const { authorId } = req.params;
    const stories = await Story.find({ authorId });
    //const textRating = getAverageRateInText(stories.reduce((sum,story)=>sum+story.ratingAvg,0))
    const totalVotes = stories.reduce((sum, story) => sum + story.ratings.length, 0);
    const upVotes = stories.reduce((sum, story) => sum + story.upVotes, 0);
    res.status(200).json({
        status: 'success',
        size: stories.length,
        upVotes,
        totalVotes
        // textRating
    })
})

exports.closeStoriesByAuthor = catchAsync(async (req, res, next) => {
    const { user } = req.body;
    const stories = await Story.find({ authorId: user._id });
    stories.forEach(story => {
        if (story.open) {
            story.open = false;
            try {
                story.save();
            } catch (err) { return next(new AppError('Something went wrong', 500)); }
        }
    })
    res.status(201).json({
        status: 'success',
    })
})

const updateRateValues = (story) => {
    story.upVotes = story.ratings
        .filter(rating => rating.rate === 1)
        .reduce((sum, rating) => sum + rating.rate, 0)
    const totalVotes = story.ratings.length;
    const { left, right } = wilson(story.upVotes, totalVotes);
    story.ratingAvg = left;
}

const mappedStory = story => {
    const { ratings, levels, language, ...props } = story.toObject();
    const code = numToString(levels.reduce((sum, level) => sum + level.rate, 0) / levels.length);
    return ({
        ...props,
        rating: {
            positive: story.upVotes,
            total: story.ratings.length,
            average: getAverageRateInText(story.ratingAvg)
        },
        level: {
            code: code,
            text: getTextByCode(code)
        },
        language: getLanguageObject(language)
    });
}

const getAverageRateInText = (rate) => {
    if (rate >= 0.80) return 'Excellent';
    if (rate < 0.80 && rate >= 0.60) return 'Good';
    if (rate < 0.60 && rate >= 0.40) return 'Mixed';
    if (rate < 0.40 && rate >= 0.20) return 'Bad';
    if (rate < 0.20) return 'Terrible';
}