const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const authCheck = require('../middleware/authCheck');
const langInfo = require('../middleware/langInfo');
const ownStoryCheck = require('../middleware/ownStoryCheck');
const publicRoute = require('../middleware/publicRoute');

router.post('/', authCheck, pageController.createPage);

router.route('/:id')
    .get(pageController.getPage)
    .patch(authCheck,ownStoryCheck, pageController.deletePage)
    
router.route('/many/:ids')
    .get(pageController.getPages)
    .patch(authCheck,ownStoryCheck, pageController.deletePages)

router.put('/rateText', authCheck, pageController.rateText);
router.get('/all/:authorId', publicRoute,langInfo, pageController.getPageDataByAuthor);


module.exports = router;