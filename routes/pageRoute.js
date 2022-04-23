const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const authCheck = require('../middleware/authCheck');
const langInfo = require('../middleware/langInfo');
const ownStoryCheck = require('../middleware/ownStoryCheck');
const publicRoute = require('../middleware/publicRoute');
const tributeComplete = require('../middleware/tributeComplete');

router.post('/', authCheck,tributeComplete, pageController.createPage);

router.route('/one/:id')
    .get(pageController.getPage)
    .post(authCheck, pageController.addCorrection)
    .patch(authCheck,ownStoryCheck, pageController.deletePage)
    
router.route('/many/:ids')
    .get(pageController.getPages)
    .patch(authCheck,ownStoryCheck, pageController.deletePages)

router.get('/data/:authorId', publicRoute,langInfo, pageController.getPageDataByAuthor);
router.put('/rateText', authCheck, pageController.rateText);


module.exports = router;