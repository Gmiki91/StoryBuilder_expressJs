const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const authCheck = require('../middleware/authCheck');
const langInfo = require('../middleware/langInfo');

router.post('/', authCheck, pageController.createPage);

router.route('/:id')
    .get(pageController.getPage)
    .delete(authCheck, pageController.deletePage)
    
router.route('/many/:ids')
    .get(pageController.getPages)
    .delete(authCheck, pageController.deletePages)

router.put('/rateText', authCheck, pageController.rateText);
router.get('/all/:authorId', authCheck,langInfo, pageController.getPageDataByAuthor);


module.exports = router;