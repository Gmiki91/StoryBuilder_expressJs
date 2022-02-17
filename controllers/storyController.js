const Story = require('../models/story');
const catchAsync = require('../utils/catchAsync');
const { stringToNum, numToString } = require('../utils/levelMapping');
const AppError = require('../utils/appError');
const wilson = require('wilson-score-interval');
const saveVote = require('../utils/vote');

exports.createStory = catchAsync(async (req, res, next) => {
    const { title, description, language, level, user, pageId, word1, word2, word3 } = req.body;
    const story = await Story.create({
        title: title,
        description: description,
        language: language,
        level: stringToNum(level),
        authorId: user._id,
        authorName: user.name,
        ratings: [],
        upVotes: 0,
        ratingAvg: 0,
        updatedAt: new Date(),
        pageIds: [pageId],
        pendingPageIds: [],
        word1: word1,
        word2: word2,
        word3: word3
    });
    if (!user.confirmed) {
        user.confirmed = true
        user.save();
    };
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
    const timesUp = user.markedStoryAt + 24 * 60 * 60 * 1000 < Date.now();
    if (user.dailyCompleted && !timesUp) {
        return res.status(200).json({
            status: 'success',
            markedStoryAt: user.markedStoryAt
        });
    }
    let story = await Story.findById(user.markedStoryId);
    if (!story || timesUp) {
        const { langInfo } = req.body;
        const { level, language } = langInfo[Math.floor(Math.random() * langInfo.length)];

        const stories = await Story.find({ language, authorId: { $ne: user._id } });

        const filterStories = () => stories.filter(story => story.level < level + count && story.level > level - count);
        let count = 0.5;
        let filteredStories = [];

        while (filteredStories.length === 0 && count < 6) {
            filteredStories = filterStories();
            count++;
        }

        if (!filteredStories) filteredStories = await Story.find({ language });
        if (!filteredStories) filteredStories = await Story.find();
        if (!filteredStories) return next(new AppError('Something went wrong, no stories found at all.', 500));

        story = filteredStories[Math.floor(Math.random() * filteredStories.length)];
        user.markedStoryId = story._id;
        user.markedStoryAt = Date.now();
        user.dailyCompleted = false;
        await user.save();
    }

    res.status(200).json({
        status: 'success',
        story: mappedStory(story),
        markedStoryAt: user.markedStoryAt
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
    if (levels.length > 0) query['level'] = levels;
    if (open !== 'both') query['open'] = open;
    sortObject[sortBy] = sortDirection;
    const result = await Story
        .find(query)
        .sort(sortObject);

    const mappedResult = result.map(story => ({ ...mappedStory(story), key: story._id }))
    res.status(200).json({
        status: 'success',
        stories: mappedResult
    })
})
exports.editStory =catchAsync(async (req, res, next) => {
    const story = await Story.findById(req.params.id);
    story.description = req.body.description;
    story.save();
    res.status(201).json({
        status: 'success',
    })
})

exports.deleteStory = catchAsync(async (req, res, next) => {
    await Story.findByIdAndDelete(req.params.id);
    res.status(204).json({
        status: 'success',
        data: null
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
    story.level = req.body.lvlAvg;
    await story.save();
    res.status(201).json({
        status: 'success'
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
    story.level = req.body.lvlAvg;

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
        tributeCompleted: req.body.tributeCompleted
    })
})

exports.addWords = catchAsync(async (req, res, next) => {
    const story = await Story.findById(req.body.storyId);
    story.word1 = req.body.word1;
    story.word2 = req.body.word2;
    story.word3 = req.body.word3;

    await story.save();
    res.status(201).json({
        status: 'success'
    });
})

exports.removePendingPage = catchAsync(async (req, res, next) => {
    const {story} = req.body;
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
    const { authorId } = req.params;
    const stories = await Story.find({ authorId });
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

exports.ownStoryCheck = catchAsync(async (req, res, next) => {
    const story = await Story.findById(req.body.storyId);
    if (story.authorId !== req.body.user._id.toString()) return next(new AppError('You can only edit your own story.', 401));
    req.body.story = story;
    next();
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
    const { ratings, ...props } = story.toObject();
    return ({
        ...props,
        rating: {
            positive: story.upVotes,
            total: story.ratings.length,
            average: getAverageRateInText(story.ratingAvg)
        },
        level: numToString(story.level)
    });
}

const getAverageRateInText = (rate) => {
    if (rate >= 0.80) return 'Excellent';
    if (rate < 0.80 && rate >= 0.60) return 'Good';
    if (rate < 0.60 && rate >= 0.40) return 'Mixed';
    if (rate < 0.40 && rate >= 0.20) return 'Bad';
    if (rate < 0.20) return 'Terrible';
}