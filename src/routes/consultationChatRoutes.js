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

// Get consultation chat details - matches frontend: /api/consultation-chat/:id
router.get('/:id', getConsultationChat);

// Get messages - matches frontend: /api/consultation-chat/:id/messages
router.get('/:id/messages', getMessages);

// Mark messages as read - matches frontend: /api/consultation-chat/:id/read
router.put('/:id/read', markMessagesAsRead);

// Start consultation (Doctor only)
router.post('/:id/start', startConsultation);

// Join consultation
router.post('/:id/join', joinConsultation);

// End consultation (Doctor only)
router.post('/:id/end', endConsultation);

module.exports = router;
