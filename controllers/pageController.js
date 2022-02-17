const Page = require('../models/page');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const saveVote = require('../utils/vote');
const { stringToNum, numToString, getTextByCode } = require('../utils/levelMapping');

exports.getPage = catchAsync(async (req, res, next) => {
    const page = await Page.findById(req.params.id);
    if (!page) return next(new AppError(`No page found with ID ${req.params.id}`, 404))
    res.status(200).json({
        status: 'success',
        page: mappedPage(page)
    })
})

exports.getPages = catchAsync(async (req, res, next) => {
    const ids = req.params.ids.split(',');
    const pages = await Page.find({ _id: { $in: ids } });

    if (pages.length === 0) return next(new AppError(`No page found with ID ${req.params.id}`, 404))

    const mappedPages = pages.map(page => ({ ...mappedPage(page), key: page._id }))
    res.status(200).json({
        status: 'success',
        pages: mappedPages
    })
})

exports.getPageDataByAuthor = catchAsync(async (req, res, next) => {
    const { authorId } = req.params;
    const pages = await Page.find({ authorId });
    const totalVotes = pages.reduce((sum, page) => sum + page.ratings.length, 0);
    let upVotes = 0;
    pages.forEach(page =>
        page.ratings.forEach(rat => { if (rat.rate === 1) upVotes++; })
    );

    const langInfo = req.body.langInfo.map(element => ({ ...element, level: getTextByCode(numToString(element.level)) }))
    res.status(200).json({
        status: 'success',
        size: pages.length,
        langInfo,
        upVotes,
        totalVotes
    })
})


exports.createPage = catchAsync(async (req, res, next) => {
    const page = await Page.create({
        text: req.body.text,
        levels: [{ userId: req.body.user._id, rate: stringToNum(req.body.level) }],
        language: req.body.language,
        authorId: req.body.user._id,
        authorName: req.body.user.name,
        storyId: req.body.storyId,
        ratings: req.body.rating
    });
    res.status(201).json({
        status: 'success',
        pageId: page._id
    })
})

exports.rateText = catchAsync(async (req, res, next) => {
    const { user, pageId, vote } = req.body;
    const page = await Page.findById(pageId);
    if (!page) return next(new AppError(`No page found with ID ${pageId}`, 404))

    const updatedPage = await saveVote(user._id.toString(), vote, page);
    res.status(201).json({
        status: 'success',
        newPage: mappedPage(updatedPage)
    })
})

exports.rateLevel = catchAsync(async (req, res, next) => {
    const page = await Page.findById(req.body.pageId);

    if (!page) return next(new AppError(`No page found with ID ${req.body.pageId}`, 404))

    const rate = stringToNum(req.body.rate);
    const vote = page.levels.find(level => level.userId === req.body.user._id.toString());
    vote ? vote.rate = rate : page.levels.push({ userId: req.body.user._id, rate: rate });
    await page.save();
    res.status(201).json({
        status: 'success',
        updatedPage: mappedPage(page)
    });
})

exports.deletePage = catchAsync(async (req, res, next) => {
    const page = await Page.findById(req.params.id);
    if (!page) return next(new AppError(`No page found with ID ${req.params.id}.`, 404));
    if (req.body.user._id.toString() !== page.authorId) return next(new AppError('You can only delete pages from your own story.', 401));

    // await Page.findByIdAndDelete(req.params.id);
    page.archived = true;
    await page.save();
    res.status(204).json({
        status: 'success',
        data: null
    });
})


exports.deletePages = catchAsync(async (req, res, next) => {
    const ids = req.params.ids.split(',');
    const pages = await Page.find({ _id: { $in: ids } });
    const otherPage = pages.find(page => req.body.user._id.toString() !== page.authorId);

    if (otherPage) return next(new AppError(`Page ${otherPage._id} is not yours to delete.`));
    pages.forEach(page =>{
        page.archived=true;
        page.save();
    });

    //await Page.deleteMany({ _id: { $in: ids } });
    res.status(204).json({
        status: 'success',
        data: null
    });
})


const mappedPage = page => {
    const code = numToString(page.levels.reduce((sum, level) => sum + level.rate, 0) / page.levels.length);
    const { levels, ...props } = page.toObject();
    return {
        ...props,
        level: {
            code: code,
            text: getTextByCode(code)
        }
    }
};

