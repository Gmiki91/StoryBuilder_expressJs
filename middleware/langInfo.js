const catchAsync = require('../utils/catchAsync');
const Page = require('../models/page');
const Stories = require('../models/story');


module.exports = catchAsync(async (req, res, next) => {

    const authorId = req.params.authorId || req.body.user._id; //first case is Stats, second is Tribute route
    const pages = await Page.find({ authorId, archived:false });
    const pageIds = pages.map(page => page._id);
    const stories = await Stories.find({ $or: [{ pageIds: { $in: pageIds } }, { pendingPageIds: { $in: pageIds } }] });
    const lvlPages = pages.map(page => {
        const fromStory =  stories.find(story => story.pageIds.indexOf(page._id) !== -1 || story.pendingPageIds.indexOf(page._id) !== -1);
        return {
            ...page.toObject(),
            levels: fromStory.levels
        }
    });

    const languageData = lvlPages.reduce((groups, page) => {
        let count = groups[page.language]?.count || 0;
        count += 1;
        let lvl = groups[page.language]?.lvl || 0;
        const avg = page.levels.reduce((sum, level) => sum + level.rate, 0) / page.levels.length;
        lvl += avg;
        groups[page.language] = { count, lvl }
        return groups;
    }, {});
    const langInfo = [];
    Object.keys(languageData).forEach(lang => {

        langInfo.push({
            language: lang,
            level: languageData[lang].lvl / languageData[lang].count,
            ratio: (languageData[lang].count / pages.length * 100).toFixed()
        })
    });
    req.body.langInfo = langInfo;
    next();
});