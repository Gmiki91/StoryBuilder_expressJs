const Page = require('../models/page');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const saveVote = require('../utils/vote');
const { getLanguageObject } = require('../utils/languageMapping');
const { numToString, getTextByCode } = require('../utils/levelMapping');

exports.getPage = catchAsync(async (req, res, next) => {
    const page = await Page.findById(req.params.id);
    if (!page) return next(new AppError(`No page found with ID ${req.params.id}`, 404))
    res.status(200).json({
        status: 'success',
        page: page
    })
})

exports.getPages = catchAsync(async (req, res, next) => {
    const ids = req.params.ids.split(',');
    const pages = await Page.find({ _id: { $in: ids } });

    if (pages.length === 0) return next(new AppError(`No page found with ID ${req.params.id}`, 404))

    const mappedPages = pages.map(page => ({ ...page.toObject(), key: page._id }))
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

    const langInfo = req.body.langInfo.map(element =>
    ({
        ...element,
        level: getTextByCode(numToString(element.level)),
        language: getLanguageObject(element.language)
    }))
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
        language: req.body.language,
        authorId: req.body.user._id,
        authorName: req.body.user.name,
        ratings: []
    });
    res.status(201).json({
        status: 'success',
        pageId: page._id,
        tributeCompleted: req.body.tributeCompleted
    })
})

exports.rateText = catchAsync(async (req, res, next) => {
    const { user, pageId, vote } = req.body;
    const page = await Page.findById(pageId);
    if (!page) return next(new AppError(`No page found with ID ${pageId}`, 404))

    const updatedPage = await saveVote(user._id.toString(), vote, page);
    res.status(201).json({
        status: 'success',
        newPage: updatedPage
    })
})

exports.addCorrection = catchAsync(async (req, res, next) => {
    const { user, error, correction } = req.body;
    const correctionObj = {
        by: user._id,
        error,
        correction,
    };
    await Page.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { corrections: correctionObj } }
    );

    res.status(201).json({
        status: 'success',
        correction: correctionObj,
    })
})

exports.deletePage = catchAsync(async (req, res, next) => {
    const page = await Page.findById(req.params.id);
    if (!page) return next(new AppError(`No page found with ID ${req.params.id}.`, 404));

    page.archived = true;
    await page.save();
    res.status(200).json({
        status: 'success',
        authorId: page.authorId
    });
})


exports.deletePages = catchAsync(async (req, res, next) => {
    const ids = req.params.ids.split(',');
    const pages = await Page.find({ _id: { $in: ids } });
    pages.forEach(page => {
        page.archived = true;
        page.save();
    });
    const authorIds = pages.map(page => page.authorId)

    res.status(200).json({
        status: 'success',
        authorIds
    });
})




