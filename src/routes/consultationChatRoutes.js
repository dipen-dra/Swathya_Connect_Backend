const express = require('express');
const router = express.Router();
const {
    startConsultation,
    joinConsultation,
    getConsultationChat,
    getMessages,
    markMessagesAsRead,
    endConsultation
} = require('../controllers/consultationChatController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Start consultation (Doctor only)
router.post('/:id/start', startConsultation);

// Join consultation
router.post('/:id/join', joinConsultation);

// Get consultation chat details
router.get('/:id/chat', getConsultationChat);

// Get messages
router.get('/:id/messages', getMessages);

// Mark messages as read
router.put('/:id/messages/read', markMessagesAsRead);

// End consultation (Doctor only)
router.post('/:id/end', endConsultation);

module.exports = router;
