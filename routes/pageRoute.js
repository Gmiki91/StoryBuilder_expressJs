const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const authCheck = require('../middleware/authCheck');

router.post('/', authCheck, pageController.createPage);

router.route('/:id')
    .get(pageController.getPage)
    .delete(authCheck, pageController.deletePage)
router.route('/many/:ids')
    .get(pageController.getPages)
    .delete(authCheck, pageController.deletePages)

router.put('/rateLevel', authCheck, pageController.rateLevel);
router.put('/rateText', authCheck, pageController.rateText);
router.get('/all/:authorId', authCheck, pageController.getPageDataByAuthor);


module.exports = router;