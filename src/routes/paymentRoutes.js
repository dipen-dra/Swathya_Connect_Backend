const express = require('express');
const router = express.Router();
const { initiateEsewaPayment, verifyEsewaPayment, initiateEsewaMedicine, verifyEsewaMedicine } = require('../controllers/esewaController');
const { verifyKhaltiPayment, verifyKhaltiMedicine } = require('../controllers/khaltiController');
const { protect } = require('../middleware/auth');

// eSewa routes - Consultations
router.post('/esewa/initiate', protect, initiateEsewaPayment);
router.get('/esewa/verify', verifyEsewaPayment); // GET request from eSewa redirect, no auth needed

// eSewa routes - Medicine Orders
router.post('/esewa/initiate-medicine', protect, initiateEsewaMedicine);
router.get('/esewa/verify-medicine', verifyEsewaMedicine); // GET request from eSewa redirect, no auth needed

// Khalti routes - Consultations
router.post('/khalti/verify', protect, verifyKhaltiPayment);

// Khalti routes - Medicine Orders
router.post('/khalti/verify-medicine', protect, verifyKhaltiMedicine);

module.exports = router;
