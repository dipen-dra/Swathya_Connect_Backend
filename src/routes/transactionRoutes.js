const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPatientTransactions } = require('../controllers/transactionController');

// All routes are protected
router.use(protect);

router.get('/patient', getPatientTransactions);

module.exports = router;
