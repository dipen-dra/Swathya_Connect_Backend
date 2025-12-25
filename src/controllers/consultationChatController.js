const ConsultationChat = require('../models/ConsultationChat');
const ConsultationMessage = require('../models/ConsultationMessage');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { sendConsultationStartedEmail } = require('../utils/emailService');
const { generateAgoraToken } = require('../utils/agoraToken');

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

        // Update participation flags
        if (isPatient && !consultation.patientJoined) {
            consultation.patientJoined = true;
            await consultation.save();
        } else if (isDoctor && !consultation.doctorJoined) {
            consultation.doctorJoined = true;
            await consultation.save();
        }

        // Check if both have joined to set start time for duration logic
        if (consultation.patientJoined && consultation.doctorJoined && !consultation.enteredConsultationAt) {
            consultation.enteredConsultationAt = new Date();
            await consultation.save();
            console.log(`✅ Both parties joined consultation ${consultationId}. Timer started at ${consultation.enteredConsultationAt}`);
        }

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

        // Verify user is part of this consultation (doctor or patient)
        const userId = req.user.id;
        const isDoctor = consultation.doctorId.toString() === userId;
        const isPatient = consultation.patientId.toString() === userId;

        if (!isDoctor && !isPatient) {
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

// @desc    Upload file for consultation chat
// @route   POST /api/consultation-chat/upload
// @access  Private (Doctor, Patient)
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Generate file URL
        const fileUrl = `/uploads/chat-attachments/${req.file.filename}`;

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                url: fileUrl,
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};


// @desc    Generate Agora token for audio/video consultation
// @route   POST /api/consultation-chat/:id/agora-token
// @access  Private (Doctor, Patient)
exports.generateAgoraToken = async (req, res) => {
    try {
        const consultationId = req.params.id;
        const userId = req.user.id;

        // Get or create consultation chat
        let consultationChat = await ConsultationChat.findOne({ consultationId })
            .populate('consultationId');

        if (!consultationChat) {
            // Consultation chat doesn't exist yet, create it
            const Consultation = require('../models/Consultation');
            const consultation = await Consultation.findById(consultationId);

            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    message: 'Consultation not found'
                });
            }

            // Verify consultation type is audio or video
            if (consultation.type !== 'audio' && consultation.type !== 'video') {
                return res.status(400).json({
                    success: false,
                    message: 'This consultation is not an audio or video consultation'
                });
            }

            // Create consultation chat
            consultationChat = await ConsultationChat.create({
                consultationId: consultation._id,
                doctorId: consultation.doctorId,
                patientId: consultation.patientId,
                status: 'active'
            });

            // Populate the consultation
            consultationChat = await ConsultationChat.findById(consultationChat._id)
                .populate('consultationId');
        }

        // Verify user is part of this consultation
        const isDoctor = consultationChat.doctorId.toString() === userId;
        const isPatient = consultationChat.patientId.toString() === userId;

        if (!isDoctor && !isPatient) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update participation flags (Audio/Video)
        // consultationChat.consultationId is populated above
        const consultationDoc = consultationChat.consultationId;

        let needsSave = false;
        if (isPatient && !consultationDoc.patientJoined) {
            consultationDoc.patientJoined = true;
            needsSave = true;
        } else if (isDoctor && !consultationDoc.doctorJoined) {
            consultationDoc.doctorJoined = true;
            needsSave = true;
        }

        if (consultationDoc.patientJoined && consultationDoc.doctorJoined && !consultationDoc.enteredConsultationAt) {
            consultationDoc.enteredConsultationAt = new Date();
            console.log(`✅ Both parties joined AV consultation ${consultationId}. Timer started at ${consultationDoc.enteredConsultationAt}`);
            needsSave = true;
        }

        if (needsSave) {
            await consultationDoc.save();
        }

        // Verify consultation type is audio or video
        const consultation = consultationChat.consultationId;
        if (consultation.type !== 'audio' && consultation.type !== 'video') {
            return res.status(400).json({
                success: false,
                message: 'This consultation is not an audio or video consultation'
            });
        }

        // Check if patient is trying to join before doctor has started
        if (isPatient && !consultationChat.callStartedAt) {
            return res.status(403).json({
                success: false,
                message: 'Your consultation link will be available shortly. Please wait for the doctor to start the consultation.'
            });
        }

        // Use consultation ID as channel name for uniqueness
        const channelName = consultationId;

        // Generate unique UID for user (use last 8 chars of user ID converted to number)
        const uid = parseInt(userId.slice(-8), 16) % 1000000;

        // Token expires in 1 hour (3600 seconds)
        const token = generateAgoraToken(channelName, uid, 'publisher', 3600);

        // Update channel name in consultation chat if not set
        if (!consultationChat.agoraChannelName) {
            consultationChat.agoraChannelName = channelName;
        }

        await consultationChat.save();

        // Calculate elapsed time in seconds (only if call has started)
        let elapsedSeconds = 0;
        let remainingSeconds = 1800; // Default 30 minutes

        if (consultationChat.callStartedAt) {
            elapsedSeconds = Math.floor((Date.now() - new Date(consultationChat.callStartedAt).getTime()) / 1000);
            remainingSeconds = Math.max(0, 1800 - elapsedSeconds);
        }

        res.status(200).json({
            success: true,
            data: {
                token,
                channelName,
                uid,
                appId: process.env.AGORA_APP_ID,
                expiresIn: 3600, // token expiration
                callStartedAt: consultationChat.callStartedAt,
                elapsedSeconds,
                remainingSeconds
            }
        });
    } catch (error) {
        console.error('Error generating Agora token:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Start call timer when both users are connected
 * @route POST /api/consultation-chat/:id/start-timer
 * @access Private (Doctor or Patient)
 */
exports.startCallTimer = async (req, res) => {
    try {
        const consultationId = req.params.id;
        const userId = req.user.id;

        // Get consultation chat
        const consultationChat = await ConsultationChat.findOne({ consultationId });

        if (!consultationChat) {
            return res.status(404).json({
                success: false,
                message: 'Consultation chat not found'
            });
        }

        // Verify user is part of this consultation
        const isDoctor = consultationChat.doctorId.toString() === userId;
        const isPatient = consultationChat.patientId.toString() === userId;

        if (!isDoctor && !isPatient) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Only set callStartedAt if not already set (first time both users connect)
        if (!consultationChat.callStartedAt) {
            consultationChat.callStartedAt = new Date();
            await consultationChat.save();

            // Send email to patient when doctor starts the consultation
            if (isDoctor) {
                try {
                    const consultation = await Consultation.findById(consultationId)
                        .populate('patientId', 'email')
                        .populate('doctorId', 'email');

                    const patientProfile = await Profile.findOne({ userId: consultation.patientId._id });
                    const doctorProfile = await Profile.findOne({ userId: consultation.doctorId._id });

                    if (consultation && consultation.patientId && consultation.patientId.email) {
                        await sendConsultationStartedEmail(
                            consultation.patientId.email,
                            {
                                patientName: `${patientProfile?.firstName || ''} ${patientProfile?.lastName || ''}`.trim(),
                                doctorName: `Dr. ${doctorProfile?.firstName || ''} ${doctorProfile?.lastName || ''}`.trim(),
                                consultationType: consultation.type,
                                consultationDate: consultation.date,
                                consultationTime: consultation.time
                            }
                        );
                        console.log(`✅ Consultation started email sent to patient: ${consultation.patientId.email}`);
                    }
                } catch (emailError) {
                    console.error('❌ Error sending consultation started email:', emailError);
                    // Don't fail the request if email fails
                }
            }
        }

        res.status(200).json({
            success: true,
            data: {
                callStartedAt: consultationChat.callStartedAt
            }
        });
    } catch (error) {
        console.error('Error starting call timer:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
