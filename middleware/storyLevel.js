const catchAsync = require('../utils/catchAsync');
const Page = require('../models/page');
module.exports = catchAsync(async (req, res, next) => {
    const { pageIds } = req.body;
    const pages = await Page.find({ _id:{$in:pageIds}});
    const lvlAvg = pages.reduce((sum, page)=>
      sum+ page.levels.reduce((sum, level) => sum + level.rate, 0) / page.levels.length,0)/pages.length;
    req.body.lvlAvg = lvlAvg;
    next();
});