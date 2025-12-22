const express = require('express');
const router = express.Router();
const { getPublicProducts, getProductDetails } = require('../controllers/storeController');

// Public routes
router.get('/products', getPublicProducts);
router.get('/products/:id', getProductDetails);

module.exports = router;
