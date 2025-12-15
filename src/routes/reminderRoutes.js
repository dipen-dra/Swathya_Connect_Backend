const express = require('express');
const router = express.Router();
const {
    getReminders,
    getReminder,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleReminderStatus
} = require('../controllers/reminderController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getReminders)
    .post(protect, createReminder);

router.put('/:id/toggle', protect, toggleReminderStatus);

router.route('/:id')
    .get(protect, getReminder)
    .put(protect, updateReminder)
    .delete(protect, deleteReminder);

module.exports = router;
