const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Doctor = require('./src/models/Doctor');
const Pharmacy = require('./src/models/Pharmacy');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

const doctors = [
    {
        name: 'Dr. Rajesh Kumar',
        specialty: 'Cardiologist',
        experience: 15,
        rating: 4.8,
        reviewCount: 124,
        consultationFee: 1500,
        availability: 'Mon-Fri, 9 AM - 5 PM',
        isOnline: true,
        consultationTypes: ['video', 'audio', 'chat'],
        qualifications: ['MBBS', 'MD Cardiology', 'Fellowship in Interventional Cardiology'],
        languages: ['English', 'Nepali', 'Hindi']
    },
    {
        name: 'Dr. Priya Sharma',
        specialty: 'Dermatologist',
        experience: 10,
        rating: 4.9,
        reviewCount: 98,
        consultationFee: 1200,
        availability: 'Mon-Sat, 10 AM - 6 PM',
        isOnline: true,
        consultationTypes: ['video', 'audio'],
        qualifications: ['MBBS', 'MD Dermatology'],
        languages: ['English', 'Nepali']
    },
    {
        name: 'Dr. Amit Thapa',
        specialty: 'Orthopedic',
        experience: 12,
        rating: 4.7,
        reviewCount: 156,
        consultationFee: 1300,
        availability: 'Mon-Fri, 8 AM - 4 PM',
        isOnline: false,
        consultationTypes: ['video', 'chat'],
        qualifications: ['MBBS', 'MS Orthopedics'],
        languages: ['English', 'Nepali']
    },
    {
        name: 'Dr. Sunita Maharjan',
        specialty: 'General Physician',
        experience: 8,
        rating: 4.6,
        reviewCount: 203,
        consultationFee: 1000,
        availability: 'Mon-Sun, 24/7',
        isOnline: true,
        consultationTypes: ['video', 'audio', 'chat'],
        qualifications: ['MBBS', 'MD General Medicine'],
        languages: ['English', 'Nepali', 'Newari']
    },
    {
        name: 'Dr. Krishna Poudel',
        specialty: 'Gastroenterologist',
        experience: 18,
        rating: 4.9,
        reviewCount: 87,
        consultationFee: 1800,
        availability: 'Tue-Sat, 10 AM - 4 PM',
        isOnline: true,
        consultationTypes: ['video', 'audio'],
        qualifications: ['MBBS', 'MD Gastroenterology', 'DM Hepatology'],
        languages: ['English', 'Nepali']
    },
    {
        name: 'Dr. Maya Gurung',
        specialty: 'Gynecologist',
        experience: 14,
        rating: 4.8,
        reviewCount: 142,
        consultationFee: 1500,
        availability: 'Mon-Sat, 9 AM - 5 PM',
        isOnline: true,
        consultationTypes: ['video', 'audio', 'chat'],
        qualifications: ['MBBS', 'MD Obstetrics & Gynecology'],
        languages: ['English', 'Nepali']
    },
    {
        name: 'Dr. Bikash Shrestha',
        specialty: 'Pediatrician',
        experience: 11,
        rating: 4.7,
        reviewCount: 178,
        consultationFee: 1100,
        availability: 'Mon-Fri, 8 AM - 6 PM',
        isOnline: false,
        consultationTypes: ['video', 'audio', 'chat'],
        qualifications: ['MBBS', 'MD Pediatrics'],
        languages: ['English', 'Nepali']
    },
    {
        name: 'Dr. Anita Rai',
        specialty: 'Psychiatrist',
        experience: 9,
        rating: 4.9,
        reviewCount: 65,
        consultationFee: 1600,
        availability: 'Mon-Fri, 2 PM - 8 PM',
        isOnline: true,
        consultationTypes: ['video', 'audio', 'chat'],
        qualifications: ['MBBS', 'MD Psychiatry'],
        languages: ['English', 'Nepali', 'Hindi']
    },
    {
        name: 'Dr. Ramesh Adhikari',
        specialty: 'Neurologist',
        experience: 16,
        rating: 4.8,
        reviewCount: 91,
        consultationFee: 2000,
        availability: 'Tue-Sat, 9 AM - 3 PM',
        isOnline: true,
        consultationTypes: ['video', 'audio'],
        qualifications: ['MBBS', 'MD Neurology', 'DM Neurology'],
        languages: ['English', 'Nepali']
    },
    {
        name: 'Dr. Sita Karki',
        specialty: 'Endocrinologist',
        experience: 13,
        rating: 4.7,
        reviewCount: 76,
        consultationFee: 1700,
        availability: 'Mon-Fri, 10 AM - 4 PM',
        isOnline: false,
        consultationTypes: ['video', 'chat'],
        qualifications: ['MBBS', 'MD Endocrinology'],
        languages: ['English', 'Nepali']
    }
];

const pharmacies = [
    {
        name: 'HealthCare Pharmacy',
        address: 'Thamel, Kathmandu',
        city: 'Kathmandu',
        phone: '+977-1-4123456',
        rating: 4.5,
        distance: '1.2 km',
        deliveryTime: '20-30 min',
        isOpen: true,
        specialties: ['General Medicines', 'Surgical Items', 'Baby Care']
    },
    {
        name: 'MediPlus Pharmacy',
        address: 'Lazimpat, Kathmandu',
        city: 'Kathmandu',
        phone: '+977-1-4234567',
        rating: 4.7,
        distance: '2.5 km',
        deliveryTime: '30-40 min',
        isOpen: true,
        specialties: ['Prescription Drugs', 'OTC Medicines', 'Health Supplements']
    },
    {
        name: 'City Pharmacy',
        address: 'New Road, Kathmandu',
        city: 'Kathmandu',
        phone: '+977-1-4345678',
        rating: 4.3,
        distance: '3.1 km',
        deliveryTime: '35-45 min',
        isOpen: true,
        specialties: ['General Medicines', 'Ayurvedic Products']
    },
    {
        name: 'Wellness Pharmacy',
        address: 'Pulchowk, Lalitpur',
        city: 'Lalitpur',
        phone: '+977-1-5123456',
        rating: 4.8,
        distance: '1.8 km',
        deliveryTime: '25-35 min',
        isOpen: true,
        specialties: ['Prescription Drugs', 'Medical Equipment', 'Diabetes Care']
    },
    {
        name: 'Quick Meds Pharmacy',
        address: 'Baneshwor, Kathmandu',
        city: 'Kathmandu',
        phone: '+977-1-4456789',
        rating: 4.6,
        distance: '2.2 km',
        deliveryTime: '30-40 min',
        isOpen: true,
        specialties: ['24/7 Service', 'Emergency Medicines', 'Home Delivery']
    },
    {
        name: 'Care Plus Pharmacy',
        address: 'Koteshwor, Kathmandu',
        city: 'Kathmandu',
        phone: '+977-1-4567890',
        rating: 4.4,
        distance: '4.5 km',
        deliveryTime: '40-50 min',
        isOpen: false,
        specialties: ['General Medicines', 'Cosmetics', 'Personal Care']
    },
    {
        name: 'Metro Pharmacy',
        address: 'Jawalakhel, Lalitpur',
        city: 'Lalitpur',
        phone: '+977-1-5234567',
        rating: 4.9,
        distance: '2.8 km',
        deliveryTime: '30-40 min',
        isOnline: true,
        specialties: ['Prescription Drugs', 'Surgical Items', 'Medical Devices']
    }
];

const importData = async () => {
    try {
        // Clear existing data
        await Doctor.deleteMany();
        await Pharmacy.deleteMany();

        // Insert sample data
        await Doctor.insertMany(doctors);
        await Pharmacy.insertMany(pharmacies);

        console.log('✅ Data Imported Successfully!');
        console.log(`   - ${doctors.length} doctors added`);
        console.log(`   - ${pharmacies.length} pharmacies added`);
        process.exit();
    } catch (error) {
        console.error('❌ Error importing data:', error);
        process.exit(1);
    }
};

const deleteData = async () => {
    try {
        await Doctor.deleteMany();
        await Pharmacy.deleteMany();

        console.log('✅ Data Destroyed Successfully!');
        process.exit();
    } catch (error) {
        console.error('❌ Error destroying data:', error);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    deleteData();
} else {
    importData();
}
