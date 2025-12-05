const express = require('express');
const router = express.Router();
const { initiateEsewaPayment, verifyEsewaPayment } = require('../controllers/esewaController');
const { verifyKhaltiPayment } = require('../controllers/khaltiController');
const { protect } = require('../middleware/auth');

// eSewa routes
router.post('/esewa/initiate', protect, initiateEsewaPayment);
router.post('/esewa/verify', protect, verifyEsewaPayment);

// Khalti routes
router.post('/khalti/verify', protect, verifyKhaltiPayment);

module.exports = router;
