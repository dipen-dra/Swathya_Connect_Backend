const express = require('express');
const router = express.Router();
const {
    startConsultation,
    joinConsultation,
    getConsultationChat,
    getMessages,
    markMessagesAsRead,
    endConsultation,
    uploadFile,
    generateAgoraToken,
    startCallTimer,
    clearChatHistory
} = require('../controllers/consultationChatController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// All routes require authentication
router.use(protect);

// File upload route - must be before /:id routes
router.post('/upload', upload.single('file'), uploadFile);

// Get consultation chat details - matches frontend: /api/consultation-chat/:id
router.get('/:id', getConsultationChat);

// Get messages - matches frontend: /api/consultation-chat/:id/messages
router.get('/:id/messages', getMessages);

// Mark messages as read - matches frontend: /api/consultation-chat/:id/read
router.put('/:id/read', markMessagesAsRead);

// Clear chat history
router.put('/:id/clear', clearChatHistory);

// Start consultation (Doctor only)
router.post('/:id/start', startConsultation);

// Join consultation
router.post('/:id/join', joinConsultation);

// End consultation (Doctor only)
router.post('/:id/end', endConsultation);

// Generate Agora token for audio/video call
router.post('/:id/agora-token', generateAgoraToken);

// Start call timer when both users are connected
router.post('/:id/start-timer', startCallTimer);

module.exports = router;
