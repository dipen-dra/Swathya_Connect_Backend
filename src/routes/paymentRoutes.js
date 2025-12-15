const express = require('express');
const router = express.Router();
const { initiateEsewaPayment, verifyEsewaPayment } = require('../controllers/esewaController');
const { verifyKhaltiPayment } = require('../controllers/khaltiController');
const { protect } = require('../middleware/auth');

// eSewa routes
router.post('/esewa/initiate', protect, initiateEsewaPayment);
router.get('/esewa/verify', verifyEsewaPayment); // GET request from eSewa redirect, no auth needed

// Khalti routes
router.post('/khalti/verify', protect, verifyKhaltiPayment);

module.exports = router;
