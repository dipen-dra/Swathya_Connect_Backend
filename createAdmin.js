const mongoose = require('mongoose');
const User = require('./src/models/User');
const Profile = require('./src/models/Profile');
require('dotenv').config();

const createAdminUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists');

            // Update to ensure it's admin role
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log('✅ Updated existing user to admin role');
        } else {
            // Create new admin user
            const adminUser = await User.create({
                fullName: 'Admin User',
                email: 'admin@gmail.com',
                phone: '+9779800000000',
                password: 'admin123',
                role: 'admin',
                isVerified: true
            });

            console.log('✅ Admin user created successfully');
            console.log('📧 Email: admin@gmail.com');
            console.log('🔑 Password: admin123');

            // Create admin profile
            await Profile.create({
                userId: adminUser._id,
                firstName: 'Admin',
                lastName: 'User'
            });

            console.log('✅ Admin profile created');
        }

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
};

createAdminUser();
