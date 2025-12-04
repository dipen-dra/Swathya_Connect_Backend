const Doctor = require('../models/Doctor');

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res) => {
    try {
        const { specialty, search, sort } = req.query;

        // Build query
        let query = {};

        // Filter by specialty
        if (specialty && specialty !== 'all') {
            query.specialty = specialty;
        }

        // Search by name or specialty
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { specialty: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query
        let doctors = Doctor.find(query);

        // Sort
        if (sort === 'rating') {
            doctors = doctors.sort({ rating: -1 });
        } else if (sort === 'fee') {
            doctors = doctors.sort({ consultationFee: 1 });
        } else {
            doctors = doctors.sort({ createdAt: -1 });
        }

        doctors = await doctors;

        res.status(200).json({
            success: true,
            count: doctors.length,
            data: doctors
        });
    } catch (error) {
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
