const express = require('express');
const router = express.Router();
const {
    getConsultations,
    getConsultation,
    bookConsultation,
    updateConsultation,
    cancelConsultation,
    rateConsultation,
    approveConsultation,
    rejectConsultation,
    reRequestConsultation
} = require('../controllers/consultationController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getConsultations)
    .post(protect, bookConsultation);

router.put('/:id/cancel', protect, cancelConsultation);

router.route('/:id')
    .get(protect, getConsultation)
    .put(protect, updateConsultation)
    .delete(protect, cancelConsultation);

router.route('/:id/rate')
    .post(protect, rateConsultation);

router.route('/:id/approve')
    .put(protect, approveConsultation);

router.route('/:id/reject')
    .put(protect, rejectConsultation);

router.route('/:id/re-request')
    .post(protect, reRequestConsultation);

module.exports = router;
