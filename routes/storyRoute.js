const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const authCheck = require('../middleware/authCheck');
const langInfo = require('../middleware/langInfo');
const ownStoryCheck = require('../middleware/ownStoryCheck');
const publicRoute = require('../middleware/publicRoute');
const confirmedPage = require('../middleware/confirmedPage');

router.route('/')
    .post(authCheck, storyController.createStory)
    .put(authCheck, storyController.addWords);

router.route('/one/:id')
    .get(storyController.getStory)
    .put(authCheck, ownStoryCheck, storyController.editStory)
    .delete(authCheck, storyController.deleteStory);
router.route('/many/:authorId')
    .get(storyController.getStoryDataByAuthor)

router.route('/pendingPage')
    .post(authCheck, storyController.addPendingPage)
    .put(authCheck, ownStoryCheck, storyController.removePendingPage);

router.get('/tribute/data', authCheck, langInfo, storyController.getTributeData);
router.route('/all')
    .post(publicRoute, storyController.getStories)
    .delete(authCheck, storyController.closeStoriesByAuthor);
router.put('/rate', authCheck, storyController.rateStory);
router.put('/level', authCheck, storyController.levelChange);
router.put('/page', authCheck, ownStoryCheck,confirmedPage, storyController.addPage);

module.exports = router;