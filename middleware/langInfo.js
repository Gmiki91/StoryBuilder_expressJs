const catchAsync = require('../utils/catchAsync');
const Page = require('../models/page');

module.exports = catchAsync(async (req, res, next) => {
    
    const authorId =  req.params.authorId || req.body.user._id; //first case is Stats, second is Tribute route
    console.log(authorId);
    const pages = await Page.find({ authorId });
    const languageData = pages.reduce((groups, page) => {
        let count = groups[page.language]?.count || 0;
        count += 1;
        let lvl = groups[page.language]?.lvl || 0;
        const avg = page.levels.reduce((sum, level) => sum + level.rate, 0) / page.levels.length;
        lvl += avg;
        groups[page.language] = { count, lvl }
        return groups;
    }, {});

    console.log("languageData ",languageData)
    const langInfo = [];
    Object.keys(languageData).forEach(lang => {
    
        langInfo.push({
            language: lang,
            level: languageData[lang].lvl / languageData[lang].count,
            ratio: (languageData[lang].count / pages.length * 100).toFixed()
        })
    });
    console.log("langinfo ",langInfo)
    req.body.langInfo = langInfo;
    next();
});