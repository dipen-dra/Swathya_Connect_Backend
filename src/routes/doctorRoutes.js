const express = require('express');
const router = express.Router();
const {
    getDoctors,
    getDoctor,
    createDoctor,
    updateDoctor,
    getSpecialties
} = require('../controllers/doctorController');

// Public routes
router.route('/')
    .get(getDoctors)
    .post(createDoctor);

router.get('/specialties', getSpecialties);

router.route('/:id')
    .get(getDoctor)
    .put(updateDoctor);

module.exports = router;
