const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Explicitly load .env
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const User = require('./src/models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find users with 'pharmacy' related strings in name or email
        const users = await User.find({
            $or: [
                { role: 'pharmacy' },
                { name: { $regex: 'pharmacy', $options: 'i' } },
                { name: { $regex: 'swasthya', $options: 'i' } }
            ]
        }).select('name email role _id');

        console.log('Found Potential Pharmacies:', JSON.stringify(users, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
};

run();
