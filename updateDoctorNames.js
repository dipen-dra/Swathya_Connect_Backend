const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const Consultation = require('./src/models/Consultation');
const Profile = require('./src/models/Profile');

async function updateConsultationDoctorNames() {
    try {
        console.log('🔄 Starting consultation doctor name update...\n');

        // Get all consultations
        const consultations = await Consultation.find({});
        console.log(`📊 Found ${consultations.length} consultations to check\n`);

        let updatedCount = 0;

        for (const consultation of consultations) {
            if (!consultation.doctorId) {
                console.log(`⚠️  Skipping consultation ${consultation._id} - no doctorId`);
                continue;
            }

            // Get the doctor's profile (has the most up-to-date name)
            const doctorProfile = await Profile.findOne({ userId: consultation.doctorId });

            if (!doctorProfile) {
                console.log(`⚠️  Doctor profile not found for consultation ${consultation._id}`);
                continue;
            }

            // Get name from profile (firstName + lastName)
            const currentDoctorName = `${doctorProfile.firstName} ${doctorProfile.lastName}`.trim();

            // Check if the name needs updating
            if (consultation.doctorName !== currentDoctorName) {
                console.log(`🔄 Updating consultation ${consultation._id}:`);
                console.log(`   Old name: "${consultation.doctorName}"`);
                console.log(`   New name: "${currentDoctorName}"`);

                // Update the consultation
                consultation.doctorName = currentDoctorName;
                await consultation.save();

                updatedCount++;
                console.log(`   ✅ Updated!\n`);
            } else {
                console.log(`✓ Consultation ${consultation._id} already has correct name: "${currentDoctorName}"`);
            }
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`📊 Total consultations checked: ${consultations.length}`);
        console.log(`📝 Consultations updated: ${updatedCount}`);
        console.log(`✓ Consultations already correct: ${consultations.length - updatedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating consultations:', error);
        process.exit(1);
    }
}

// Run the migration
updateConsultationDoctorNames();
