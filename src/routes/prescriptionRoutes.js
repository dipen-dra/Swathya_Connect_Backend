const express = require('express');
const router = express.Router();
const {
    createPrescription,
    getPrescriptionByConsultation,
    updatePrescription,
    generatePrescriptionPDF
} = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');

// Doctor routes
router.post('/create', protect, authorize('doctor'), createPrescription);
router.put('/:id', protect, authorize('doctor'), updatePrescription);

// Shared routes (doctor and patient)
router.get('/consultation/:consultationId', protect, getPrescriptionByConsultation);
router.get('/:id/pdf', protect, generatePrescriptionPDF);

module.exports = router;
