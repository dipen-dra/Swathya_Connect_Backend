const mongoose = require('mongoose');
const User = require('./src/models/User');

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/swasthya_connect');

        const pharmacyId = '6939144c1660f91d615f09a7';
        const updatedUser = await User.findByIdAndUpdate(
            pharmacyId,
            { fullName: 'Swasthya Connect Store' },
            { new: true }
        );

        if (updatedUser) {
            console.log('Successfully updated pharmacy name:', updatedUser.fullName);
        } else {
            console.log('Pharmacy user not found!');
        }

    } catch (error) {
        console.error(error);
    } finally {
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    }
};
run();
