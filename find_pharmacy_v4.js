const mongoose = require('mongoose');
const User = require('./src/models/User');

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/swasthya_connect');

        const pharmacies = await User.find({ role: 'pharmacy' });
        console.log('--- PHARMACY LIST START ---');
        pharmacies.forEach(p => {
            console.log(`ID: ${p._id}`);
            console.log(`Name: ${p.name}`);
            console.log(`Email: ${p.email}`);
            console.log('---');
        });
        console.log('--- PHARMACY LIST END ---');

        const swasthyaUsers = await User.find({ name: /swasthya/i });
        console.log('--- SWASTHYA USERS START ---');
        swasthyaUsers.forEach(u => {
            console.log(`ID: ${u._id}`);
            console.log(`Name: ${u.name}`); // or fullName if distinct
            console.log(`Role: ${u.role}`);
            console.log('---');
        });
        console.log('--- SWASTHYA USERS END ---');

    } catch (error) {
        console.error(error);
    } finally {
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    }
};
run();
