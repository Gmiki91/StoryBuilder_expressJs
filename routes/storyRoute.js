const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const authCheck = require('../middleware/authCheck');
const tributeComplete = require('../middleware/tributeComplete');
const storyLevel = require('../middleware/storyLevel');
const langInfo = require('../middleware/langInfo');

router.route('/')
    .post(authCheck, storyController.createStory)
    .put(authCheck, storyController.addWords);

router.route('/:id')
    .get(storyController.getStory)
    .delete(authCheck, storyController.deleteStory);

router.route('/pendingPage')
    .post(authCheck, tributeComplete, storyController.addPendingPage)
    .put(authCheck, storyController.ownStoryCheck, storyController.removePendingPage);

router.route('/all/:authorId')
    .get(authCheck, storyController.getStoryDataByAuthor)
    .patch(authCheck, storyController.closeStoriesByAuthor);

router.get('/tribute/data', authCheck, langInfo, storyController.getTributeData);
router.post('/all', authCheck, storyController.getStories);
router.put('/rate', authCheck,  storyController.rateStory);
router.put('/level', authCheck, storyLevel,storyController.levelChange);
router.put('/page',
    authCheck,
    storyLevel,
    storyController.ownStoryCheck,
    storyController.addPage);





module.exports = router;