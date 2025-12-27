const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPatientTransactions, deleteTransaction, downloadTransactionInvoice } = require('../controllers/transactionController');

// All routes are protected
router.use(protect);

router.get('/patient', getPatientTransactions);
router.delete('/:id', deleteTransaction);
router.get('/:id/invoice', downloadTransactionInvoice);

module.exports = router;
