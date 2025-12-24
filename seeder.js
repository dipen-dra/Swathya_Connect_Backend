const mongoose = require('mongoose');
const dotenv = require('dotenv');
// const colors = require('colors'); // Removed missing dependency
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Inventory = require('./src/models/Inventory');
const connectDB = require('./src/config/db');

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

const importData = async () => {
    try {
        // Find a pharmacy user to assign products to
        const pharmacyUser = await User.findOne({ role: 'pharmacy' });

        if (!pharmacyUser) {
            console.error('Error: No pharmacy user found. Please create a pharmacy account first.');
            process.exit(1);
        }

        console.log(`Using Pharmacy: ${pharmacyUser.name} (${pharmacyUser._id})`);

        // Clear existing data and Drop Collections to remove potential ghost indexes
        try {
            await Category.collection.drop();
            console.log('Category Collection Dropped');
        } catch (error) {
            console.log('Category Collection not found (ok)');
        }

        try {
            await Inventory.collection.drop();
            console.log('Inventory Collection Dropped');
        } catch (error) {
            console.log('Inventory Collection not found (ok)');
        }

        console.log('Data Destroyed & Indexes Cleared...');

        // 1. Create Categories
        const categories = [
            {
                name: 'Skin Care',
                description: 'Products for skin health and beauty, including cleansers, moisturizers, and treatments.',
                image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Prescription Medicine',
                description: 'Medicines requiring a valid doctor\'s prescription for purchase.',
                image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Vitamins & Supplements',
                description: 'Daily vitamins, minerals, and herbal supplements for overall wellness.',
                image: 'https://images.unsplash.com/photo-1550572705-726487932c02?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Baby Care',
                description: 'Essential products for infants and toddlers, including diapers, formula, and lotions.',
                image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'First Aid',
                description: 'Emergency medical supplies, bandages, antiseptics, and kits.',
                image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Personal Hygiene',
                description: 'Products for personal cleanliness and grooming.',
                image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Diabetes Care',
                description: 'Insulin, test strips, monitors, and diabetic-friendly products.',
                image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Pain Relief',
                description: 'Over-the-counter painkillers and analgesics for various types of pain.',
                image: 'https://images.unsplash.com/photo-1584362917165-526a96884152?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Eye Care',
                description: 'Eye drops, contact lens solutions, and vision supplements.',
                image: 'https://images.unsplash.com/photo-1589658257008-011409386c9d?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Dental Care',
                description: 'Toothpaste, toothbrushes, floss, and mouthwash.',
                image: 'https://images.unsplash.com/photo-1588776814546-1b9a896cc7de?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Hair Care',
                description: 'Shampoos, conditioners, and treatments for hair health.',
                image: 'https://images.unsplash.com/photo-1585232975374-72670d372e9a?auto=format&fit=crop&q=80&w=800'
            },
            {
                name: 'Medical Devices',
                description: 'Thermometers, blood pressure monitors, and other health gadgets.',
                image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800'
            }
        ];

        const createdCategories = await Category.insertMany(categories);
        console.log('Categories Imported!');

        // 2. Create Products (Inventory) linked to Pharmacy and Categories
        const products = [
            // Skin Care
            {
                medicineName: 'Cetaphil Gentle Skin Cleanser',
                genericName: 'Hydrating Cleanser',
                manufacturer: 'Galderma',
                dosage: '500ml',
                quantity: 50,
                price: 1850,
                expiryDate: new Date('2026-12-31'),
                category: 'Skin Care',
                image: 'https://images.unsplash.com/photo-1556228720-1987ba47b857?auto=format&fit=crop&q=80&w=800',
                description: 'A mild, non-irritating cleanser for sensitive skin. Maintains broad-spectrum barrier function.',
                pharmacyId: pharmacyUser._id
            },
            {
                medicineName: 'Neutrogena Sunscreen SPF 50',
                genericName: 'Sunscreen Lotion',
                manufacturer: 'Johnson & Johnson',
                dosage: '88ml',
                quantity: 40,
                price: 1200,
                expiryDate: new Date('2025-08-15'),
                category: 'Skin Care',
                image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=800',
                description: 'Broad Spectrum SPF 50 sunscreen. Water-resistant and oil-free.',
                pharmacyId: pharmacyUser._id
            },
            {
                medicineName: 'Aloe Vera Gel',
                genericName: 'Aloe Barbadensis',
                manufacturer: 'Himalaya',
                dosage: '300ml',
                quantity: 60,
                price: 450,
                expiryDate: new Date('2025-10-10'),
                category: 'Skin Care',
                image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
                description: 'Soothing and moisturizing aloe vera gel for face and body.',
                pharmacyId: pharmacyUser._id
            },

            // Vitamins
            {
                medicineName: 'Multivitamin Complex',
                genericName: 'Multivitamin',
                manufacturer: 'Centrum',
                dosage: '60 Tablets',
                quantity: 100,
                price: 1500,
                expiryDate: new Date('2026-05-20'),
                category: 'Vitamins & Supplements',
                image: 'https://images.unsplash.com/photo-1584362917165-526a96884152?auto=format&fit=crop&q=80&w=800',
                description: 'Complete daily multivitamin supplement for adults.',
                pharmacyId: pharmacyUser._id
            },
            {
                medicineName: 'Vitamin C 1000mg',
                genericName: 'Ascorbic Acid',
                manufacturer: 'Nature Made',
                dosage: '100 Tablets',
                quantity: 80,
                price: 900,
                expiryDate: new Date('2026-03-15'),
                category: 'Vitamins & Supplements',
                image: 'https://images.unsplash.com/photo-1550572705-726487932c02?auto=format&fit=crop&q=80&w=800',
                description: 'High potency Vitamin C for immune system support.',
                pharmacyId: pharmacyUser._id
            },
            {
                medicineName: 'Fish Oil Omega-3',
                genericName: 'Omega-3 Fatty Acids',
                manufacturer: 'Kirkland Signature',
                dosage: '400 Softgels',
                quantity: 30,
                price: 3500,
                expiryDate: new Date('2025-12-01'),
                category: 'Vitamins & Supplements',
                image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
                description: 'Supports heart, brain, and joint health.',
                pharmacyId: pharmacyUser._id
            },

            // Pain Relief
            {
                medicineName: 'Tylenol Extra Strength',
                genericName: 'Acetaminophen',
                manufacturer: 'Johnson & Johnson',
                dosage: '500mg, 100 Caplets',
                quantity: 120,
                price: 850,
                expiryDate: new Date('2027-01-01'),
                category: 'Pain Relief',
                image: 'https://images.unsplash.com/photo-1626079035668-cb282b01dcc0?auto=format&fit=crop&q=80&w=800',
                description: 'Pain reliever and fever reducer.',
                pharmacyId: pharmacyUser._id
            },
            {
                medicineName: 'Ibuprofen 200mg',
                genericName: 'Ibuprofen',
                manufacturer: 'Advil',
                dosage: '200 Tablets',
                quantity: 90,
                price: 1100,
                expiryDate: new Date('2026-06-30'),
                category: 'Pain Relief',
                image: 'https://images.unsplash.com/photo-1584362917165-526a96884152?auto=format&fit=crop&q=80&w=800',
                description: 'NSAID for pain relief, fever reduction, and inflammation.',
                pharmacyId: pharmacyUser._id
            },
            {
                medicineName: 'Volini Pain Relief Spray',
                genericName: 'Diclofenac',
                manufacturer: 'Sun Pharma',
                dosage: '60g',
                quantity: 75,
                price: 350,
                expiryDate: new Date('2025-09-01'),
                category: 'Pain Relief',
                image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=800',
                description: 'Instant relief from muscle pain, sprain, and backache.',
                pharmacyId: pharmacyUser._id
            },

            // Baby Care
            {
                medicineName: 'Pampers Premium Care',
                genericName: 'Baby Diapers',
                manufacturer: 'P&G',
                dosage: 'Size 3, 50 Count',
                quantity: 40,
                price: 1600,
                expiryDate: new Date('2028-01-01'),
                category: 'Baby Care',
                image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&q=80&w=800',
                description: 'Soft and comfortable diapers for babies.',
                pharmacyId: pharmacyUser._id
            },
            {
                medicineName: 'Johnson\'s Baby Lotion',
                genericName: 'Baby Lotion',
                manufacturer: 'Johnson & Johnson',
                dosage: '500ml',
                quantity: 60,
                price: 650,
                expiryDate: new Date('2026-05-01'),
                category: 'Baby Care',
                image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800',
                description: 'Mild and gentle moisturizer for baby skin.',
                pharmacyId: pharmacyUser._id
            },

            // First Aid
            {
                medicineName: 'Dettol Antiseptic Liquid',
                genericName: 'Chloroxylenol',
                manufacturer: 'Reckitt Benckiser',
                dosage: '1 Liter',
                quantity: 100,
                price: 800,
                expiryDate: new Date('2026-11-01'),
                category: 'First Aid',
                image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800',
                description: 'Effective antiseptic liquid for first aid and personal hygiene.',
                pharmacyId: pharmacyUser._id
            },
            {
                medicineName: 'Waterproof Bandages',
                genericName: 'Adhesive Bandages',
                manufacturer: 'Band-Aid',
                dosage: '100 Count',
                quantity: 150,
                price: 400,
                expiryDate: new Date('2029-01-01'),
                category: 'First Aid',
                image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=800',
                description: 'Sterile waterproof bandages for cuts and scrapes.',
                pharmacyId: pharmacyUser._id
            },

            // Diabetes Care
            {
                medicineName: 'Accu-Chek Active Strips',
                genericName: 'Glucose Test Strips',
                manufacturer: 'Roche',
                dosage: '50 Strips',
                quantity: 80,
                price: 1450,
                expiryDate: new Date('2025-07-01'),
                category: 'Diabetes Care',
                image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800',
                description: 'Test strips for blood glucose monitoring.',
                pharmacyId: pharmacyUser._id
            },
            {
                medicineName: 'Glucerna Shake',
                genericName: 'Nutritional Shake',
                manufacturer: 'Abbott',
                dosage: '400g',
                quantity: 40,
                price: 1100,
                expiryDate: new Date('2025-12-01'),
                category: 'Diabetes Care',
                image: 'https://images.unsplash.com/photo-1542316417-3026f4325a81?auto=format&fit=crop&q=80&w=800',
                description: 'Nutritional shake designed for people with diabetes.',
                pharmacyId: pharmacyUser._id
            },

            // Dental Care
            {
                medicineName: 'Oral-B Electric Toothbrush',
                genericName: 'Electric Toothbrush',
                manufacturer: 'Oral-B',
                dosage: '1 Unit',
                quantity: 20,
                price: 3500,
                expiryDate: new Date('2030-01-01'),
                category: 'Dental Care',
                image: 'https://images.unsplash.com/photo-1588776814546-1b9a896cc7de?auto=format&fit=crop&q=80&w=800',
                description: 'Rechargeable electric toothbrush for superior cleaning.',
                pharmacyId: pharmacyUser._id
            },
            {
                medicineName: 'Sensodyne Repair & Protect',
                genericName: 'Toothpaste',
                manufacturer: 'GSK',
                dosage: '100g',
                quantity: 100,
                price: 350,
                expiryDate: new Date('2026-02-01'),
                category: 'Dental Care',
                image: 'https://images.unsplash.com/photo-1559599242-c53443831d87?auto=format&fit=crop&q=80&w=800',
                description: 'Toothpaste for sensitive teeth repair and protection.',
                pharmacyId: pharmacyUser._id
            },

            // Hair Care
            {
                medicineName: 'Minoxidil 5% Solution',
                genericName: 'Minoxidil',
                manufacturer: 'Regaine',
                dosage: '60ml',
                quantity: 40,
                price: 2200,
                expiryDate: new Date('2026-08-01'),
                category: 'Hair Care',
                image: 'https://images.unsplash.com/photo-1585232975374-72670d372e9a?auto=format&fit=crop&q=80&w=800',
                description: 'Topical solution for hair regrowth.',
                pharmacyId: pharmacyUser._id
            },
            {
                medicineName: 'Head & Shoulders Shampoo',
                genericName: 'Anti-Dandruff Shampoo',
                manufacturer: 'P&G',
                dosage: '650ml',
                quantity: 60,
                price: 950,
                expiryDate: new Date('2027-01-01'),
                category: 'Hair Care',
                image: 'https://images.unsplash.com/photo-15223363669-80dc4507f352?auto=format&fit=crop&q=80&w=800',
                description: 'Clinical strength anti-dandruff shampoo.',
                pharmacyId: pharmacyUser._id
            },

            // Prescription (Mock - usually requires verification)
            {
                medicineName: 'Atorvastatin 20mg',
                genericName: 'Atorvastatin',
                manufacturer: 'Pfizer',
                dosage: '30 Tablets',
                quantity: 100,
                price: 450,
                expiryDate: new Date('2026-04-15'),
                category: 'Prescription Medicine',
                image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
                description: 'Used to lower cholesterol levels.',
                pharmacyId: pharmacyUser._id,
                isPublic: true // Listed but requires prescription to buy logic (if implemented)
            },
            {
                medicineName: 'Amoxicillin 500mg',
                genericName: 'Amoxicillin',
                manufacturer: ' GSK',
                dosage: '10 Capsules',
                quantity: 80,
                price: 150,
                expiryDate: new Date('2025-11-20'),
                category: 'Prescription Medicine',
                image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=800',
                description: 'Antibiotic for bacterial infections.',
                pharmacyId: pharmacyUser._id,
                isPublic: true
            },

            // Other
            {
                medicineName: 'N95 Face Mask',
                genericName: 'Respirator Mask',
                manufacturer: '3M',
                dosage: 'Pack of 5',
                quantity: 200,
                price: 750,
                expiryDate: new Date('2030-01-01'),
                category: 'Other',
                image: 'https://images.unsplash.com/photo-1588147326490-64213d2f9d51?auto=format&fit=crop&q=80&w=800',
                description: 'High filtration face mask for protection.',
                pharmacyId: pharmacyUser._id
            },
            {
                medicineName: 'Digital Thermometer',
                genericName: 'Thermometer',
                manufacturer: 'Omron',
                dosage: '1 Unit',
                quantity: 60,
                price: 450,
                expiryDate: new Date('2030-01-01'),
                category: 'Medical Devices',
                image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=800',
                description: 'Fast and accurate digital thermometer.',
                pharmacyId: pharmacyUser._id
            }

        ];

        await Inventory.insertMany(products);
        console.log('Products Imported!');

        console.log('Seeding completed successfully');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Category.deleteMany();
        await Inventory.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
