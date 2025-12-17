const ConsultationChat = require('../models/ConsultationChat');
const ConsultationMessage = require('../models/ConsultationMessage');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { sendConsultationStartedEmail } = require('../utils/emailService');

// @desc    Start consultation (Doctor only)
// @route   POST /api/consultations/:id/start
// @access  Private/Doctor
exports.startConsultation = async (req, res) => {
    try {
        const consultationId = req.params.id;
        const doctorId = req.user.id;

        // Get consultation
        const consultation = await Consultation.findById(consultationId);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Check if doctorId exists
        if (!consultation.doctorId) {
            return res.status(400).json({
                success: false,
                message: 'Consultation doctor information is missing'
            });
        }

        // Get doctor and patient users directly (don't rely on populate)
        const doctorUser = await User.findById(consultation.doctorId);
        const patientUser = await User.findById(consultation.patientId);

        if (!doctorUser) {
            console.error('Doctor user not found for ID:', consultation.doctorId);
            return res.status(400).json({
                success: false,
                message: 'Doctor account not found. Please contact support.'
            });
        }

        if (!patientUser) {
            return res.status(400).json({
                success: false,
                message: 'Patient account not found'
            });
        }

        // Verify doctor owns this consultation
        if (consultation.doctorId.toString() !== doctorId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to start this consultation'
            });
        }

        // Check if consultation is approved
        if (consultation.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Consultation must be approved before starting'
            });
        }

        // Check if already started
        if (consultation.sessionStarted) {
            return res.status(400).json({
                success: false,
                message: 'Consultation already started'
            });
        }

        // Update consultation
        consultation.sessionStarted = true;
        consultation.sessionStartedAt = new Date();
        await consultation.save();

        // Create or get consultation chat
        let consultationChat = await ConsultationChat.findOne({ consultationId });

        if (!consultationChat) {
            consultationChat = await ConsultationChat.create({
                consultationId,
                patientId: consultation.patientId,
                doctorId: consultation.doctorId,
                status: 'active',
                startedAt: new Date(),
                startedBy: doctorId
            });
        } else {
            consultationChat.status = 'active';
            consultationChat.startedAt = new Date();
            consultationChat.startedBy = doctorId;
            await consultationChat.save();
        }

        // Create system message
        await ConsultationMessage.create({
            consultationChatId: consultationChat._id,
            consultationId,
            senderId: doctorId,
            senderRole: 'doctor',
            messageType: 'system',
            content: `Dr. ${doctorUser.fullName} has started the consultation`
        });

        // Send email notification to patient
        try {
            await sendConsultationStartedEmail(
                patientUser.email,
                patientUser.fullName,
                {
                    doctorName: consultation.doctorName,
                    consultationType: consultation.type,
                    consultationDate: consultation.date,
                    consultationTime: consultation.time,
                    consultationId: consultation._id
                }
            );
        } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
            // Don't fail the request if email fails
        }

        res.status(200).json({
            success: true,
            message: 'Consultation started successfully',
            data: {
                consultation,
                consultationChat
            }
        });
    } catch (error) {
        console.error('Start consultation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Join consultation
// @route   POST /api/consultations/:id/join
// @access  Private
exports.joinConsultation = async (req, res) => {
    try {
        const consultationId = req.params.id;
        const userId = req.user.id;

        // Get consultation
        const consultation = await Consultation.findById(consultationId);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Verify user is part of this consultation
        const isPatient = consultation.patientId.toString() === userId;
        const isDoctor = consultation.doctorId.toString() === userId;

        if (!isPatient && !isDoctor) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to join this consultation'
            });
        }

        // Check if consultation has been started
        if (!consultation.sessionStarted) {
            return res.status(400).json({
                success: false,
                message: 'Consultation has not been started yet. The doctor will initiate the consultation 10-15 minutes before the scheduled time.',
                canJoin: false
            });
        }

        // Get consultation chat
        const consultationChat = await ConsultationChat.findOne({ consultationId });

        if (!consultationChat) {
            return res.status(404).json({
                success: false,
                message: 'Consultation chat not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Joined consultation successfully',
            canJoin: true,
            data: {
                consultation,
                consultationChat
            }
        });
    } catch (error) {
        console.error('Join consultation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get consultation chat details
// @route   GET /api/consultations/:id/chat
// @access  Private
exports.getConsultationChat = async (req, res) => {
    try {
        const consultationId = req.params.id;
        const userId = req.user.id;

        // Get consultation
        const consultation = await Consultation.findById(consultationId);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Get users directly
        const patientUser = await User.findById(consultation.patientId).select('fullName email profilePicture');
        const doctorUser = await User.findById(consultation.doctorId).select('fullName email profilePicture');

        if (!patientUser || !doctorUser) {
            return res.status(404).json({
                success: false,
                message: 'User information not found'
            });
        }

        // Verify user is part of this consultation
        const isPatient = consultation.patientId.toString() === userId;
        const isDoctor = consultation.doctorId.toString() === userId;

        if (!isPatient && !isDoctor) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this consultation'
            });
        }

        // Get or create consultation chat
        let consultationChat = await ConsultationChat.findOne({ consultationId });

        if (!consultationChat) {
            // Create consultation chat if it doesn't exist
            consultationChat = await ConsultationChat.create({
                consultationId,
                patientId: consultation.patientId,
                doctorId: consultation.doctorId,
                status: 'active',
                startedAt: new Date()
            });

            console.log(`✅ Created consultation chat for consultation ${consultationId}`);

            // Send email notification to patient
            try {
                await sendConsultationStartedEmail(
                    patientUser.email,
                    patientUser.fullName,
                    {
                        doctorName: doctorUser.fullName,
                        consultationType: consultation.type,
                        scheduledTime: consultation.time,
                        consultationId
                    }
                );
                console.log(`📧 Sent consultation started email to ${patientUser.email}`);
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                // Don't fail the request if email fails
            }
        }

        // Get patient and doctor profiles
        const patientProfile = await Profile.findOne({ userId: consultation.patientId });
        const doctorProfile = await Profile.findOne({ userId: consultation.doctorId });

        // Calculate time remaining (30 minutes max)
        const startTime = new Date(consultationChat.startedAt);
        const now = new Date();
        const elapsedMinutes = Math.floor((now - startTime) / 1000 / 60);
        const timeRemaining = Math.max(0, 30 - elapsedMinutes);

        res.status(200).json({
            success: true,
            data: {
                consultation,
                consultationChat,
                userRole: isPatient ? 'patient' : 'doctor',
                timeRemaining, // Time remaining in minutes
                otherUser: isPatient ? {
                    id: consultation.doctorId,
                    name: doctorUser.fullName,
                    role: 'doctor',
                    profilePicture: doctorProfile?.profileImage || consultation.doctorImage,
                    specialty: consultation.specialty
                } : {
                    id: consultation.patientId,
                    name: patientUser.fullName,
                    role: 'patient',
                    profilePicture: patientProfile?.profileImage || ''
                }
            }
        });
    } catch (error) {
        console.error('Get consultation chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get consultation messages
// @route   GET /api/consultations/:id/messages
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const consultationId = req.params.id;
        const userId = req.user.id;
        const { limit = 50, before } = req.query;

        // Get consultation
        const consultation = await Consultation.findById(consultationId);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Verify user is part of this consultation
        const isPatient = consultation.patientId.toString() === userId;
        const isDoctor = consultation.doctorId.toString() === userId;

        if (!isPatient && !isDoctor) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access these messages'
            });
        }

        // Build query
        const query = { consultationId };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        // Get messages
        const messages = await ConsultationMessage.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('senderId', 'fullName profilePicture');

        // Reverse to get chronological order
        messages.reverse();

        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Mark messages as read
// @route   PUT /api/consultations/:id/messages/read
// @access  Private
exports.markMessagesAsRead = async (req, res) => {
    try {
        const consultationId = req.params.id;
        const userId = req.user.id;

        // Get consultation
        const consultation = await Consultation.findById(consultationId);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Determine user role
        const isPatient = consultation.patientId.toString() === userId;
        const isDoctor = consultation.doctorId.toString() === userId;

        if (!isPatient && !isDoctor) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const userRole = isPatient ? 'patient' : 'doctor';

        // Update unread messages
        const updateField = userRole === 'patient' ? 'readBy.patient' : 'readBy.doctor';
        const readAtField = userRole === 'patient' ? 'readAt.patient' : 'readAt.doctor';

        await ConsultationMessage.updateMany(
            {
                consultationId,
                [updateField]: false,
                senderRole: { $ne: userRole }
            },
            {
                $set: {
                    [updateField]: true,
                    [readAtField]: new Date()
                }
            }
        );

        // Update consultation chat unread count
        const consultationChat = await ConsultationChat.findOne({ consultationId });
        if (consultationChat) {
            if (userRole === 'patient') {
                consultationChat.unreadCount.patient = 0;
            } else {
                consultationChat.unreadCount.doctor = 0;
            }
            await consultationChat.save();
        }

        res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Mark messages as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    End consultation
// @route   POST /api/consultations/:id/end
// @access  Private/Doctor
exports.endConsultation = async (req, res) => {
    try {
        const consultationId = req.params.id;
        const doctorId = req.user.id;

        // Get consultation
        const consultation = await Consultation.findById(consultationId);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Verify doctor owns this consultation
        if (consultation.doctorId.toString() !== doctorId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to end this consultation'
            });
        }

        // Update consultation status
        consultation.status = 'completed';
        await consultation.save();

        // Update consultation chat
        const consultationChat = await ConsultationChat.findOne({ consultationId });
        if (consultationChat) {
            consultationChat.status = 'ended';
            consultationChat.endedAt = new Date();
            await consultationChat.save();
        }

        // Create system message
        if (consultationChat) {
            await ConsultationMessage.create({
                consultationChatId: consultationChat._id,
                consultationId,
                senderId: doctorId,
                senderRole: 'doctor',
                messageType: 'system',
                content: 'Consultation has ended'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Consultation ended successfully',
            data: consultation
        });
    } catch (error) {
        console.error('End consultation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
