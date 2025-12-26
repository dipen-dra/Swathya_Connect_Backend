const PromoCode = require('../models/PromoCode');

// @desc    Validate promo code
// @route   POST /api/store/promo/validate
// @access  Private
exports.validatePromoCode = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id; // From auth middleware

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Promo code is required'
            });
        }

        const promo = await PromoCode.findOne({
            code: code.toUpperCase()
        });

        if (!promo) {
            return res.status(404).json({
                success: false,
                message: 'Invalid promo code'
            });
        }

        if (!promo.isActive) {
            return res.status(400).json({
                success: false,
                message: 'This promo code is inactive'
            });
        }

        if (promo.validUntil && new Date() > promo.validUntil) {
            return res.status(400).json({
                success: false,
                message: 'This promo code has expired'
            });
        }

        // Check if user has already used it
        if (promo.usedBy.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'You have already used this promo code'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Promo code applied',
            data: {
                code: promo.code,
                discountType: promo.discountType,
                discountValue: promo.discountValue
            }
        });

    } catch (error) {
        console.error('Promo validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Seed the initial SWASTHYA10 code (Internal helper)
// @route   POST /api/store/promo/seed
exports.seedPromoCode = async (req, res) => {
    try {
        const code = 'SWASTHYA10';
        let promo = await PromoCode.findOne({ code });

        if (!promo) {
            promo = await PromoCode.create({
                code: 'SWASTHYA10',
                discountType: 'percentage',
                discountValue: 10, // 10%
                isActive: true
            });
            console.log('✅ Created SWASTHYA10 promo code');
        }

        res.status(200).json({ success: true, data: promo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
