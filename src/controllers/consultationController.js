const Consultation = require('../models/Consultation');
const Doctor = require('../models/Doctor');

// @desc    Get all consultations for user
// @route   GET /api/consultations
// @access  Private
exports.getConsultations = async (req, res) => {
    try {
        const { status } = req.query;

        let query = { patientId: req.user.id };

        if (status && status !== 'all') {
            query.status = status;
        }

        const consultations = await Consultation.find(query)
            .sort({ date: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: consultations.length,
            data: consultations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single consultation
// @route   GET /api/consultations/:id
// @access  Private
exports.getConsultation = async (req, res) => {
    try {
        const consultation = await Consultation.findById(req.params.id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Make sure user owns consultation
        if (consultation.patientId.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this consultation'
            });
        }

        res.status(200).json({
            success: true,
            data: consultation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Book consultation
// @route   POST /api/consultations
// @access  Private
exports.bookConsultation = async (req, res) => {
    try {
        const { doctorId, date, time, type, reason } = req.body;

        // Get doctor details
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Create consultation
        const consultation = await Consultation.create({
            patientId: req.user.id,
            doctorId: doctor._id,
            doctorName: doctor.name,
            specialty: doctor.specialty,
            doctorImage: doctor.image || '',
            date,
            time,
            type,
            fee: doctor.consultationFee,
            reason,
            status: 'upcoming'
        });

        res.status(201).json({
            success: true,
            data: consultation
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to book consultation',
            error: error.message
        });
    }
};

// @desc    Update consultation
// @route   PUT /api/consultations/:id
// @access  Private
exports.updateConsultation = async (req, res) => {
    try {
        let consultation = await Consultation.findById(req.params.id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Make sure user owns consultation
        if (consultation.patientId.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this consultation'
            });
        }

        consultation = await Consultation.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: consultation
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to update consultation',
            error: error.message
        });
    }
};

// @desc    Cancel consultation
// @route   DELETE /api/consultations/:id
// @access  Private
exports.cancelConsultation = async (req, res) => {
    try {
        const consultation = await Consultation.findById(req.params.id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Make sure user owns consultation
        if (consultation.patientId.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to cancel this consultation'
            });
        }

        consultation.status = 'cancelled';
        await consultation.save();

        res.status(200).json({
            success: true,
            message: 'Consultation cancelled successfully',
            data: consultation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Rate consultation
// @route   POST /api/consultations/:id/rate
// @access  Private
exports.rateConsultation = async (req, res) => {
    try {
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a rating between 1 and 5'
            });
        }

        let consultation = await Consultation.findById(req.params.id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Make sure user owns consultation
        if (consultation.patientId.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to rate this consultation'
            });
        }

        // Only completed consultations can be rated
        if (consultation.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Only completed consultations can be rated'
            });
        }

        consultation.rating = rating;
        await consultation.save();

        // Update doctor's rating
        const doctor = await Doctor.findById(consultation.doctorId);
        if (doctor) {
            const consultations = await Consultation.find({
                doctorId: doctor._id,
                rating: { $exists: true, $ne: null }
            });

            const totalRating = consultations.reduce((sum, c) => sum + c.rating, 0);
            doctor.rating = totalRating / consultations.length;
            doctor.reviewCount = consultations.length;
            await doctor.save();
        }

        res.status(200).json({
            success: true,
            data: consultation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
