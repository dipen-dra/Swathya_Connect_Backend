const mongoose = require('mongoose');
const User = require('./src/models/User');
const fs = require('fs');
const path = require('path');

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/swasthya_connect');

        let output = '';

        const pharmacies = await User.find({ role: 'pharmacy' });
        output += '--- PHARMACY LIST START ---\n';
        pharmacies.forEach(p => {
            output += `ID: ${p._id}\n`;
            output += `Name: ${p.name}\n`;
            output += `Email: ${p.email}\n`;
            output += '---\n';
        });
        output += '--- PHARMACY LIST END ---\n';

        const swasthyaUsers = await User.find({ name: /swasthya/i });
        output += '--- SWASTHYA USERS START ---\n';
        swasthyaUsers.forEach(u => {
            output += `ID: ${u._id}\n`;
            output += `Name: ${u.name}\n`;
            output += `Role: ${u.role}\n`;
            output += '---\n';
        });
        output += '--- SWASTHYA USERS END ---\n';

        fs.writeFileSync(path.join(__dirname, 'pharmacy_list.txt'), output);
        console.log('File written.');

    } catch (error) {
        console.error(error);
    } finally {
        if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    }
};
run();
