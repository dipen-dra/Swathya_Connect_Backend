const express = require('express');
const router = express.Router();
const {
    getPharmacies,
    getPharmacy,
    createPharmacy,
    updatePharmacy
} = require('../controllers/pharmacyController');

router.route('/')
    .get(getPharmacies)
    .post(createPharmacy);

router.route('/:id')
    .get(getPharmacy)
    .put(updatePharmacy);

module.exports = router;
