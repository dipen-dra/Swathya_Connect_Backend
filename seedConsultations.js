const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Consultation = require('./src/models/Consultation');
const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

const seedConsultations = async () => {
    try {
        // Get a patient user (you'll need to replace with actual user ID from your database)
        const patient = await User.findOne({ role: 'patient' });

        if (!patient) {
            console.log('❌ No patient found. Please create a patient user first.');
            process.exit(1);
        }

        // Get some doctors
        const doctors = await Doctor.find().limit(5);

        if (doctors.length === 0) {
            console.log('❌ No doctors found. Please run the main seeder first: node seeder.js');
            process.exit(1);
        }

        // Create completed consultations with ratings
        const completedConsultations = [
            {
                patientId: patient._id,
                doctorId: doctors[0]._id,
                doctorName: doctors[0].name,
                specialty: doctors[0].specialty,
                doctorImage: doctors[0].image,
                date: new Date('2025-01-05'),
                time: '10:00 AM',
                type: 'video',
                status: 'completed',
                fee: 1500,
                reason: 'Regular checkup and blood pressure monitoring',
                notes: 'Patient is healthy. Blood pressure is normal.',
                prescription: 'Continue current medication. Follow-up in 3 months.',
                rating: 5,
                review: 'Excellent doctor! Very professional and caring.',
                ratedAt: new Date('2025-01-05T11:00:00Z'),
                paymentStatus: 'paid',
                paymentMethod: 'Khalti'
            },
            {
                patientId: patient._id,
                doctorId: doctors[1]._id,
                doctorName: doctors[1].name,
                specialty: doctors[1].specialty,
                doctorImage: doctors[1].image,
                date: new Date('2025-01-03'),
                time: '2:30 PM',
                type: 'audio',
                status: 'completed',
                fee: 1200,
                reason: 'Skin condition consultation',
                notes: 'Prescribed topical cream for eczema.',
                prescription: 'Hydrocortisone cream 1%, apply twice daily',
                rating: 4,
                review: 'Good consultation, helpful advice.',
                ratedAt: new Date('2025-01-03T15:30:00Z'),
                paymentStatus: 'paid',
                paymentMethod: 'eSewa'
            },
            {
                patientId: patient._id,
                doctorId: doctors[2]._id,
                doctorName: doctors[2].name,
                specialty: doctors[2].specialty,
                doctorImage: doctors[2].image,
                date: new Date('2024-12-28'),
                time: '11:00 AM',
                type: 'chat',
                status: 'completed',
                fee: 1300,
                reason: 'Knee pain after sports injury',
                notes: 'Recommended physiotherapy and rest.',
                prescription: 'Ibuprofen 400mg as needed, ice therapy',
                rating: 5,
                review: 'Very knowledgeable and patient. Explained everything clearly.',
                ratedAt: new Date('2024-12-28T12:00:00Z'),
                paymentStatus: 'paid',
                paymentMethod: 'Khalti'
            },
            {
                patientId: patient._id,
                doctorId: doctors[3]._id,
                doctorName: doctors[3].name,
                specialty: doctors[3].specialty,
                doctorImage: doctors[3].image,
                date: new Date('2024-12-20'),
                time: '3:00 PM',
                type: 'video',
                status: 'completed',
                fee: 1000,
                reason: 'Fever and cold symptoms',
                notes: 'Viral infection, prescribed symptomatic treatment.',
                prescription: 'Paracetamol 500mg, Vitamin C, plenty of rest',
                rating: 4,
                review: 'Quick and efficient consultation.',
                ratedAt: new Date('2024-12-20T16:00:00Z'),
                paymentStatus: 'paid',
                paymentMethod: 'eSewa'
            }
        ];

        // Create completed consultations WITHOUT ratings (for testing rating feature)
        const unratedCompletedConsultations = [
            {
                patientId: patient._id,
                doctorId: doctors[4]._id,
                doctorName: doctors[4].name,
                specialty: doctors[4].specialty,
                doctorImage: doctors[4].image,
                date: new Date('2025-01-02'),
                time: '4:00 PM',
                type: 'video',
                status: 'completed',
                fee: 1800,
                reason: 'Stomach pain and digestive issues',
                notes: 'Prescribed medication for gastritis. Advised dietary changes.',
                prescription: 'Omeprazole 20mg, avoid spicy food',
                paymentStatus: 'paid',
                paymentMethod: 'Khalti'
            },
            {
                patientId: patient._id,
                doctorId: doctors[1]._id,
                doctorName: doctors[1].name,
                specialty: doctors[1].specialty,
                doctorImage: doctors[1].image,
                date: new Date('2024-12-25'),
                time: '11:30 AM',
                type: 'chat',
                status: 'completed',
                fee: 1200,
                reason: 'Skin rash consultation',
                notes: 'Allergic reaction. Prescribed antihistamine.',
                prescription: 'Cetirizine 10mg, apply calamine lotion',
                paymentStatus: 'paid',
                paymentMethod: 'eSewa'
            }
        ];

        // Create upcoming consultations
        const upcomingConsultations = [
            {
                patientId: patient._id,
                doctorId: doctors[4]._id,
                doctorName: doctors[4].name,
                specialty: doctors[4].specialty,
                doctorImage: doctors[4].image,
                date: new Date('2025-01-20'),
                time: '10:00 AM',
                type: 'video',
                status: 'upcoming',
                fee: 1800,
                reason: 'Digestive issues consultation',
                paymentStatus: 'paid',
                paymentMethod: 'Khalti'
            },
            {
                patientId: patient._id,
                doctorId: doctors[0]._id,
                doctorName: doctors[0].name,
                specialty: doctors[0].specialty,
                doctorImage: doctors[0].image,
                date: new Date('2025-01-25'),
                time: '2:00 PM',
                type: 'audio',
                status: 'upcoming',
                fee: 1500,
                reason: 'Follow-up consultation',
                paymentStatus: 'paid',
                paymentMethod: 'eSewa'
            }
        ];

        // Delete existing consultations for this patient
        await Consultation.deleteMany({ patientId: patient._id });

        // Insert new consultations
        await Consultation.insertMany([...completedConsultations, ...unratedCompletedConsultations, ...upcomingConsultations]);

        console.log('✅ Consultation data seeded successfully!');
        console.log(`   - ${completedConsultations.length} completed consultations with ratings`);
        console.log(`   - ${unratedCompletedConsultations.length} completed consultations without ratings`);
        console.log(`   - ${upcomingConsultations.length} upcoming consultations added`);
        console.log(`   - Patient: ${patient.email}`);

        process.exit();
    } catch (error) {
        console.error('❌ Error seeding consultations:', error);
        process.exit(1);
    }
};

seedConsultations();
