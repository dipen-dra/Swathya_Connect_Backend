const Consultation = require('../models/Consultation');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const emailService = require('../utils/emailService');

// @desc    Get all consultations for user
// @route   GET /api/consultations
// @access  Private
exports.getConsultations = async (req, res) => {
    try {
        const { status } = req.query;

        // Build query based on user role
        let query = {};

        if (req.user.role === 'doctor') {
            // For doctors, get consultations where they are the doctor
            query.doctorId = req.user.id;
        } else {
            // For patients, get their consultations
            query.patientId = req.user.id;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const consultations = await Consultation.find(query)
            .populate('patientId', 'name fullName email phone')
            .populate('doctorId', 'name fullName email')
            .sort({ createdAt: -1, date: -1 });

        // Fetch profile images for patients
        const Profile = require('../models/Profile');
        const consultationsWithImages = await Promise.all(consultations.map(async (consultation) => {
            const consultationObj = consultation.toObject();

            // Get patient profile image
            if (consultationObj.patientId) {
                const patientProfile = await Profile.findOne({ userId: consultationObj.patientId._id });
                if (patientProfile && patientProfile.profileImage) {
                    consultationObj.patientId.profileImage = patientProfile.profileImage;
                }
            }

            return consultationObj;
        }));

        res.status(200).json({
            success: true,
            count: consultationsWithImages.length,
            data: consultationsWithImages
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
        const { doctorId, date, time, type, reason, fee } = req.body;

        // Get doctor user details
        const doctorUser = await User.findById(doctorId);

        if (!doctorUser || doctorUser.role !== 'doctor') {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Get doctor profile for additional details
        const Profile = require('../models/Profile');
        const doctorProfile = await Profile.findOne({ userId: doctorId });

        // Validate fee is provided
        if (!fee || fee <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid consultation fee'
            });
        }

        // Create consultation
        const consultation = await Consultation.create({
            patientId: req.user.id,
            doctorId: doctorUser._id,
            doctorName: doctorUser.fullName || doctorUser.name ||
                (doctorProfile ? `${doctorProfile.firstName} ${doctorProfile.lastName}`.trim() : doctorUser.email),
            specialty: doctorProfile?.specialty || 'General Physician',
            doctorImage: doctorProfile?.profileImage || '',
            date,
            time,
            type,
            fee, // Use the fee passed from frontend based on consultation type
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

        // If consultation is unpaid, delete it completely
        // If it's paid, mark as cancelled (for refund processing)
        if (consultation.paymentStatus !== 'paid') {
            console.log(`🗑️ Deleting unpaid consultation: ${req.params.id}`);
            await Consultation.findByIdAndDelete(req.params.id);
            console.log(`✅ Unpaid consultation deleted: ${req.params.id}`);
            return res.status(200).json({
                success: true,
                message: 'Unpaid consultation deleted successfully'
            });
        }

        // For paid consultations, mark as cancelled
        console.log(`❌ Marking paid consultation as cancelled: ${req.params.id}`);
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

// @desc    Approve consultation (Doctor only)
// @route   PUT /api/consultations/:id/approve
// @access  Private (Doctor)
exports.approveConsultation = async (req, res) => {
    try {
        const consultation = await Consultation.findById(req.params.id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Make sure the user is a doctor
        if (req.user.role !== 'doctor') {
            return res.status(403).json({
                success: false,
                message: 'Only doctors can approve consultations'
            });
        }

        // Make sure the doctor owns this consultation
        if (consultation.doctorId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to approve this consultation'
            });
        }

        // Only upcoming consultations can be approved
        if (consultation.status !== 'upcoming') {
            return res.status(400).json({
                success: false,
                message: 'Only upcoming consultations can be approved'
            });
        }

        // Update consultation status to approved
        consultation.status = 'approved';
        consultation.approvedAt = new Date();
        await consultation.save();

        // Get patient details for email notification
        const patient = await User.findById(consultation.patientId);

        // Send approval email to patient (optional)
        if (patient && emailService.sendApprovalEmail) {
            try {
                await emailService.sendApprovalEmail(
                    patient.email,
                    patient.name,
                    {
                        doctorName: consultation.doctorName,
                        specialty: consultation.specialty,
                        date: consultation.date,
                        time: consultation.time,
                        type: consultation.type
                    }
                );
            } catch (emailError) {
                console.error('Failed to send approval email:', emailError);
                // Don't fail the approval if email fails
            }
        }

        res.status(200).json({
            success: true,
            message: 'Consultation approved successfully',
            data: consultation
        });
    } catch (error) {
        console.error('Error approving consultation:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Reject consultation (Doctor only)
// @route   PUT /api/consultations/:id/reject
// @access  Private (Doctor)
exports.rejectConsultation = async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        if (!rejectionReason || rejectionReason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reason for rejection'
            });
        }

        const consultation = await Consultation.findById(req.params.id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Only pending/upcoming consultations can be rejected
        if (consultation.status !== 'upcoming') {
            return res.status(400).json({
                success: false,
                message: 'Only upcoming consultations can be rejected'
            });
        }

        // Get patient details for email
        const patient = await User.findById(consultation.patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Update consultation status
        consultation.status = 'rejected';
        consultation.rejectionReason = rejectionReason;
        consultation.rejectedAt = new Date();
        consultation.refundStatus = 'processing';
        consultation.refundInitiatedAt = new Date();
        consultation.paymentStatus = 'refunded';
        await consultation.save();

        // Send rejection email to patient
        await emailService.sendRejectionEmail(
            patient.email,
            patient.name,
            {
                doctorName: consultation.doctorName,
                specialty: consultation.specialty,
                date: consultation.date,
                time: consultation.time,
                type: consultation.type,
                fee: consultation.fee
            },
            rejectionReason
        );

        res.status(200).json({
            success: true,
            message: 'Consultation rejected and refund initiated. Patient has been notified via email.',
            data: consultation
        });
    } catch (error) {
        console.error('Error rejecting consultation:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Re-request an expired consultation (free for patient)
 * @route POST /api/consultations/:id/re-request
 * @access Private (Patient only)
 */
exports.reRequestConsultation = async (req, res) => {
    try {
        const consultationId = req.params.id;
        const userId = req.user.id;

        // Get original consultation
        const originalConsultation = await Consultation.findById(consultationId);

        if (!originalConsultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Verify user is the patient
        if (originalConsultation.patientId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the patient can re-request a consultation'
            });
        }

        // Verify consultation is expired (not permanently)
        if (originalConsultation.expiryStage !== 'expired') {
            return res.status(400).json({
                success: false,
                message: 'Only expired consultations can be re-requested'
            });
        }

        // Create new consultation with same details (free re-request)
        const newConsultation = await Consultation.create({
            patientId: originalConsultation.patientId,
            doctorId: originalConsultation.doctorId,
            doctorName: originalConsultation.doctorName,
            specialty: originalConsultation.specialty,
            doctorImage: originalConsultation.doctorImage,
            date: originalConsultation.date,
            time: originalConsultation.time,
            type: originalConsultation.type,
            status: 'upcoming', // Back to pending approval
            fee: originalConsultation.fee,
            reason: originalConsultation.reason,
            paymentStatus: 'paid', // Already paid from original
            paymentMethod: originalConsultation.paymentMethod,
            isReRequest: true,
            originalConsultationId: originalConsultation._id
        });

        res.status(201).json({
            success: true,
            message: 'Consultation re-requested successfully',
            data: newConsultation
        });
    } catch (error) {
        console.error('Error re-requesting consultation:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
