const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PromoCode = require('./src/models/PromoCode');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const code = 'SWASTHYA10';
        let promo = await PromoCode.findOne({ code });

        if (!promo) {
            await PromoCode.create({
                code: 'SWASTHYA10',
                discountType: 'percentage',
                discountValue: 10, // 10%
                isActive: true
            });
            console.log('✅ Created SWASTHYA10 promo code');
        } else {
            console.log('ℹ️ Promo code already exists');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
