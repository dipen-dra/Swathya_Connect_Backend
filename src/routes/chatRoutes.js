const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');
const {
    getChats,
    getChatMessages,
    createChat,
    markAsRead,
    uploadFile
} = require('../controllers/chatController');

// All routes require authentication
router.use(protect);

// Chat routes
router.get('/', authorize('patient', 'pharmacy'), getChats);
router.post('/', authorize('patient'), createChat);
router.get('/:chatId/messages', authorize('patient', 'pharmacy'), getChatMessages);
router.put('/:chatId/read', authorize('patient', 'pharmacy'), markAsRead);

// File upload route
router.post('/upload', authorize('patient', 'pharmacy'), upload.single('file'), uploadFile);

module.exports = router;
