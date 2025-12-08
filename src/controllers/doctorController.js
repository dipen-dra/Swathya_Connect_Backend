const Doctor = require('../models/Doctor');
const Profile = require('../models/Profile');
const User = require('../models/User');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res) => {
    try {
        const { specialty, search, sort } = req.query;

        // Build query - ONLY show approved doctors
        let query = {
            verificationStatus: 'approved'
        };

        // Filter by specialty
        if (specialty && specialty !== 'all') {
            query.specialty = specialty;
        }

        // Search by name or specialty
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { specialty: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query and populate user details
        let doctors = await Profile.find(query).populate('userId', 'name email role');

        // Filter to ensure only doctor role profiles
        doctors = doctors.filter(d => d.userId && d.userId.role === 'doctor');

        // Get consultation model for ratings and patient counts
        const Consultation = require('../models/Consultation');

        // Transform doctors data with calculated fields
        const transformedDoctors = await Promise.all(doctors.map(async (doctor) => {
            // Get all completed consultations for this doctor
            const completedConsultations = await Consultation.find({
                doctorId: doctor.userId._id,
                status: 'completed'
            });

            // Calculate average rating
            const ratingsWithValues = completedConsultations.filter(c => c.rating && c.rating > 0);
            const averageRating = ratingsWithValues.length > 0
                ? (ratingsWithValues.reduce((sum, c) => sum + c.rating, 0) / ratingsWithValues.length).toFixed(1)
                : 0;

            // Get unique patient count
            const uniquePatients = [...new Set(completedConsultations.map(c => c.patientId?.toString()))].filter(Boolean);

            return {
                id: doctor._id,
                userId: doctor.userId._id, // Add userId for consultation booking
                name: `${doctor.firstName} ${doctor.lastName}`.trim(),
                specialty: doctor.specialty || 'General Physician',
                image: doctor.profileImage || null,
                rating: parseFloat(averageRating),
                experience: doctor.yearsOfExperience || 0,
                patients: uniquePatients.length,
                description: doctor.professionalBio || `Experienced ${doctor.specialty || 'doctor'} with ${doctor.yearsOfExperience || 0} years of practice.`,
                location: doctor.workplace || 'Not specified',
                hours: doctor.availabilityTime || 'Not specified',
                availabilityDays: doctor.availabilityDays || [],
                consultationFee: doctor.videoFee || doctor.audioFee || doctor.chatFee || 1000,
                chatFee: doctor.chatFee || 600,
                audioFee: doctor.audioFee || 800,
                videoFee: doctor.videoFee || 1000,
                isOnline: true, // Can be enhanced with real-time status later
                education: doctor.education || '',
                licenseNumber: doctor.licenseNumber || ''
            };
        }));

        // Sort transformed data
        let sortedDoctors = transformedDoctors;
        if (sort === 'rating') {
            sortedDoctors = transformedDoctors.sort((a, b) => b.rating - a.rating);
        } else if (sort === 'fee') {
            sortedDoctors = transformedDoctors.sort((a, b) => a.consultationFee - b.consultationFee);
        }

        res.status(200).json({
            success: true,
            count: sortedDoctors.length,
            data: sortedDoctors
        });
    } catch (error) {
        console.error('Error in getDoctors:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.status(200).json({
            success: true,
            data: doctor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create doctor
// @route   POST /api/doctors
// @access  Private/Admin
exports.createDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.create(req.body);

        res.status(201).json({
            success: true,
            data: doctor
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to create doctor',
            error: error.message
        });
    }
};

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private/Admin
exports.updateDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.status(200).json({
            success: true,
            data: doctor
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to update doctor',
            error: error.message
        });
    }
};

// @desc    Get specialties list
// @route   GET /api/doctors/specialties
// @access  Public
exports.getSpecialties = async (req, res) => {
    try {
        const specialties = await Doctor.distinct('specialty');

        res.status(200).json({
            success: true,
            data: specialties
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
