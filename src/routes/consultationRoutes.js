const express = require('express');
const router = express.Router();
const {
    getConsultations,
    getConsultation,
    bookConsultation,
    updateConsultation,
    cancelConsultation,
    rateConsultation
} = require('../controllers/consultationController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getConsultations)
    .post(protect, bookConsultation);

router.route('/:id')
    .get(protect, getConsultation)
    .put(protect, updateConsultation)
    .delete(protect, cancelConsultation);

router.route('/:id/rate')
    .post(protect, rateConsultation);

module.exports = router;
