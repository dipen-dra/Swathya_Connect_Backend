const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validatePromoCode, seedPromoCode } = require('../controllers/promoCodeController');

router.post('/validate', protect, validatePromoCode);
router.post('/seed', seedPromoCode); // Open endpoint for dev ease, or protect it

module.exports = router;
