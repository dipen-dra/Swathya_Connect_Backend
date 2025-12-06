const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Doctor = require('./src/models/Doctor');
const Pharmacy = require('./src/models/Pharmacy');
const User = require('./src/models/User');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

// Demo users for testing (passwords will be hashed by User model)
const users = [
    {
        fullName: 'John Patient',
        email: 'patient@demo.com',
        phone: '+977-9841234567',
        password: 'demo123',
        role: 'patient',
        isVerified: true
    },
    {
        fullName: 'Dr. Rajesh Kumar',
        email: 'doctor@demo.com',
        phone: '+977-9841234568',
        password: 'demo123',
        role: 'doctor',
        isVerified: true
    },
    {
        fullName: 'MediCare Pharmacy',
        email: 'pharmacy@demo.com',
        phone: '+977-9841234569',
        password: 'demo123',
        role: 'pharmacy',
        isVerified: true
    }
];

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
        languages: ['English', 'Nepali', 'Hindi'],
        image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
        description: 'Senior Cardiologist with expertise in interventional cardiology and heart disease prevention.',
        location: 'Kathmandu Medical Center',
        hours: 'Mon-Fri 9AM-5PM',
        patients: 1200
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
        languages: ['English', 'Nepali'],
        image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop',
        description: 'Dermatologist specializing in skin conditions, cosmetic procedures, and hair treatments.',
        location: 'Bir Hospital',
        hours: 'Tue-Sat 10AM-6PM',
        patients: 800
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
        languages: ['English', 'Nepali'],
        image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop',
        description: 'Orthopedic surgeon with specialization in joint replacement and sports medicine.',
        location: 'TUTH',
        hours: 'Mon-Wed-Fri 8AM-4PM',
        patients: 950
    },
    {
        name: 'Dr. Sunita Maharjan',
        specialty: 'General Physician',
        experience: 8,
        rating: 4.6,
        reviewCount: 203,
        consultationFee: 100,
        availability: 'Mon-Sun, 24/7',
        isOnline: true,
        consultationTypes: ['video', 'audio', 'chat'],
        qualifications: ['MBBS', 'MD General Medicine'],
        languages: ['English', 'Nepali', 'Newari'],
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
        description: 'Pediatrician with expertise in child development and pediatric emergency care.',
        location: 'Kanti Children Hospital',
        hours: 'Mon-Sat 9AM-5PM',
        patients: 1500
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
        languages: ['English', 'Nepali'],
        image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop',
        description: 'Gastroenterologist with expertise in digestive disorders and endoscopic procedures.',
        location: 'Norvic International Hospital',
        hours: 'Mon-Wed-Fri 10AM-4PM',
        patients: 750
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
        languages: ['English', 'Nepali'],
        image: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=400&h=400&fit=crop',
        description: 'Gynecologist and Obstetrician specializing in high-risk pregnancies and women\'s health.',
        location: 'Paropakar Maternity Hospital',
        hours: 'Mon-Fri 9AM-5PM',
        patients: 1100
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
        languages: ['English', 'Nepali'],
        image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop',
        description: 'General Physician with broad experience in treating common medical conditions.',
        location: 'Patan Hospital',
        hours: 'Mon-Sat 8AM-6PM',
        patients: 2000
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
        languages: ['English', 'Nepali', 'Hindi'],
        image: 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=400&h=400&fit=crop',
        description: 'Psychiatrist with focus on anxiety, depression, and cognitive behavioral therapy.',
        location: 'Mental Health Center',
        hours: 'Tue-Sat 10AM-6PM',
        patients: 650
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
        languages: ['English', 'Nepali'],
        image: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&h=400&fit=crop',
        description: 'Neurologist specializing in stroke, epilepsy, and neurodegenerative diseases.',
        location: 'Grande International Hospital',
        hours: 'Mon-Thu 9AM-4PM',
        patients: 850
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
        languages: ['English', 'Nepali'],
        image: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=400&h=400&fit=crop',
        description: 'Endocrinologist specializing in diabetes, thyroid disorders, and hormonal imbalances.',
        location: 'Nepal Mediciti Hospital',
        hours: 'Mon-Fri 10AM-4PM',
        patients: 720
    },
    {
        name: 'Dr. Deepak Tamang',
        specialty: 'Ophthalmologist',
        experience: 14,
        rating: 4.8,
        reviewCount: 112,
        consultationFee: 1400,
        availability: 'Mon-Sat, 9 AM - 5 PM',
        isOnline: true,
        consultationTypes: ['video', 'audio', 'chat'],
        qualifications: ['MBBS', 'MS Ophthalmology'],
        languages: ['English', 'Nepali'],
        image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=400&fit=crop',
        description: 'Eye specialist with expertise in cataract surgery and laser vision correction.',
        location: 'Tilganga Eye Hospital',
        hours: 'Mon-Fri 8AM-4PM',
        patients: 1300
    },
    {
        name: 'Dr. Kavita Joshi',
        specialty: 'Pulmonologist',
        experience: 11,
        rating: 4.6,
        reviewCount: 89,
        consultationFee: 1350,
        availability: 'Tue-Sat, 10 AM - 4 PM',
        isOnline: true,
        consultationTypes: ['video', 'audio'],
        qualifications: ['MBBS', 'MD Pulmonary Medicine'],
        languages: ['English', 'Nepali', 'Hindi'],
        image: 'https://images.unsplash.com/photo-1643297654416-05795d62e39c?w=400&h=400&fit=crop',
        description: 'Pulmonologist specializing in respiratory disorders and critical care medicine.',
        location: 'Star Hospital',
        hours: 'Tue-Sat 10AM-4PM',
        patients: 680
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
        await User.create(users);
        await Doctor.create(doctors);
        await Pharmacy.create(pharmacies);

        console.log('✅ Data Imported Successfully!');
        console.log(`   - ${users.length} users added`);
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
        await User.deleteMany();
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
