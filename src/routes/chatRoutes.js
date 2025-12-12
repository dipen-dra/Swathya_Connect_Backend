const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getChats,
    getChatMessages,
    createChat,
    markAsRead
} = require('../controllers/chatController');

// All routes require authentication
router.use(protect);

// Chat routes
router.get('/', authorize('patient', 'pharmacy'), getChats);
router.post('/', authorize('patient'), createChat);
router.get('/:chatId/messages', authorize('patient', 'pharmacy'), getChatMessages);
router.put('/:chatId/read', authorize('patient', 'pharmacy'), markAsRead);

module.exports = router;
