const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Explicitly load .env
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('Trying to connect with URI:', process.env.MONGODB_URI ? 'URI Found' : 'URI Missing');

const User = require('./src/models/User');

const run = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        const pharmacy = await User.findOne({ role: 'pharmacy' }).sort({ createdAt: -1 });
        console.log('PHARMACY_NAME:', pharmacy ? pharmacy.name : 'None');
        console.log('PHARMACY_ID:', pharmacy ? pharmacy._id : 'None');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Only disconnect if connected
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit();
    }
};

run();
