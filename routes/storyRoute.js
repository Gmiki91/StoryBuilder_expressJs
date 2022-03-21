const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const authCheck = require('../middleware/authCheck');
const tributeComplete = require('../middleware/tributeComplete');
const langInfo = require('../middleware/langInfo');
const ownStoryCheck = require('../middleware/ownStoryCheck');
const publicRoute = require('../middleware/publicRoute');

router.route('/')
    .post(authCheck, storyController.createStory)
    .get(authCheck, storyController.getStoriesWithPendingPages)
    .put(authCheck, storyController.addWords);

router.route('/one/:id')
    .get(storyController.getStory)
    .put(authCheck, storyController.editStory)
    .delete(authCheck, storyController.deleteStory);
router.route('/many/:authorId')
    .get(storyController.getStoryDataByAuthor)

router.route('/pendingPage')
    .post(authCheck, tributeComplete, storyController.addPendingPage)
    .put(authCheck, ownStoryCheck, storyController.removePendingPage);



router.get('/tribute/data', authCheck, langInfo, storyController.getTributeData);
router.route('/all')
    .post(publicRoute, storyController.getStories)
    .delete(authCheck, storyController.closeStoriesByAuthor);
router.put('/rate', authCheck, storyController.rateStory);
router.put('/level', authCheck, storyController.levelChange);
router.put('/page', authCheck, ownStoryCheck, storyController.addPage);





module.exports = router;