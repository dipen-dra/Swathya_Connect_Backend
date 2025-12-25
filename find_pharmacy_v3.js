const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('URI:', process.env.MONGODB_URI);

const User = require('./src/models/User');

const run = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.log('Trying default URI...');
            process.env.MONGODB_URI = 'mongodb://localhost:27017/swasthya_connect';
        }

        await mongoose.connect(process.env.MONGODB_URI);

        const users = await User.find({ role: 'pharmacy' }).select('name email role _id');
        console.log('FOUND_PHARMACIES:', JSON.stringify(users, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
};

run();
