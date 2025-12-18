const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email service error:', error);
    } else {
        console.log('✅ Email service ready');
    }
});

// Send medicine reminder email
exports.sendMedicineReminder = async (userEmail, userName, reminderData) => {
    const { medicineName, dosage, times, instructions } = reminderData;

    const mailOptions = {
        from: `"Swasthya Connect" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `⏰ Medicine Reminder: ${medicineName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .medicine-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .medicine-name { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
                    .dosage { font-size: 18px; color: #666; margin-bottom: 15px; }
                    .instructions { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 3px solid #ffc107; margin-top: 15px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏥 Medicine Reminder</h1>
                        <p>Time to take your medicine!</p>
                    </div>
                    <div class="content">
                        <p>Hello <strong>${userName}</strong>,</p>
                        <p>This is a friendly reminder to take your medicine in <strong>10 minutes</strong>.</p>
                        
                        <div class="medicine-card">
                            <div class="medicine-name">💊 ${medicineName}</div>
                            <div class="dosage">Dosage: ${dosage}</div>
                            <div style="color: #666;">
                                <strong>Scheduled Time:</strong> ${times.join(', ')}
                            </div>
                            ${instructions ? `
                            <div class="instructions">
                                <strong>⚠️ Instructions:</strong><br>
                                ${instructions}
                            </div>
                            ` : ''}
                        </div>
                        
                        <p style="margin-top: 20px;">
                            <strong>Important:</strong> Please take your medicine as prescribed by your doctor.
                        </p>
                        
                        <div style="text-align: center;">
                            <a href="http://localhost:5173/dashboard" class="btn">View Dashboard</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated reminder from Swasthya Connect</p>
                        <p>If you wish to modify your reminders, please visit your dashboard</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Reminder email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send reminder email:', error);
        return { success: false, error: error.message };
    }
};

// Send welcome email
exports.sendWelcomeEmail = async (userEmail, userName) => {
    const mailOptions = {
        from: `"Swasthya Connect" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Welcome to Swasthya Connect! 🏥',
        html: `
            <h1>Welcome to Swasthya Connect, ${userName}!</h1>
            <p>Thank you for joining our healthcare platform.</p>
            <p>You can now:</p>
            <ul>
                <li>Book consultations with doctors</li>
                <li>Set medicine reminders</li>
                <li>Order from pharmacies</li>
                <li>Manage your health records</li>
            </ul>
            <p>Get started by visiting your dashboard!</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent to:', userEmail);
    } catch (error) {
        console.error('❌ Failed to send welcome email:', error);
    }
};

// Send consultation booking confirmation email
exports.sendConsultationConfirmation = async (userEmail, userName, consultationData) => {
    const { doctorName, specialty, date, time, type, fee, paymentMethod, consultationId } = consultationData;

    const consultationTypeLabels = {
        video: '📹 Video Consultation',
        audio: '📞 Audio Consultation',
        chat: '💬 Text Chat Consultation'
    };

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const mailOptions = {
        from: `"Swasthya Connect" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `✅ Consultation Booked Successfully - ${doctorName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
                    .consultation-card { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .doctor-name { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 5px; }
                    .specialty { font-size: 16px; color: #666; margin-bottom: 20px; }
                    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
                    .detail-label { font-weight: bold; color: #666; }
                    .detail-value { color: #333; }
                    .payment-badge { background: #10b981; color: white; padding: 5px 15px; border-radius: 15px; font-size: 14px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .important-note { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 3px solid #ffc107; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏥 Consultation Confirmed!</h1>
                        <div class="success-badge">✓ Payment Successful</div>
                    </div>
                    <div class="content">
                        <p>Dear <strong>${userName}</strong>,</p>
                        <p>Your consultation has been successfully booked and payment has been confirmed!</p>
                        
                        <div class="consultation-card">
                            <div class="doctor-name">${doctorName}</div>
                            <div class="specialty">${specialty}</div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Consultation Type:</span>
                                <span class="detail-value">${consultationTypeLabels[type] || type}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Date:</span>
                                <span class="detail-value">${formattedDate}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Time:</span>
                                <span class="detail-value">${time}</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Consultation Fee:</span>
                                <span class="detail-value">NPR ${fee}</span>
                            </div>
                            
                            <div class="detail-row" style="border-bottom: none;">
                                <span class="detail-label">Payment Method:</span>
                                <span class="payment-badge">${paymentMethod}</span>
                            </div>
                            
                            <div class="detail-row" style="border-bottom: none;">
                                <span class="detail-label">Booking ID:</span>
                                <span class="detail-value" style="font-family: monospace; font-size: 12px;">${consultationId}</span>
                            </div>
                        </div>
                        
                        <div class="important-note">
                            <strong>⚠️ Important Reminders:</strong><br>
                            • Please be available at the scheduled time<br>
                            • Keep your device charged and internet connection stable<br>
                            • You can view your consultation details in your dashboard<br>
                            • If you need to reschedule, please contact us at least 24 hours in advance
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="http://localhost:5173/dashboard/consultations" class="btn">View My Consultations</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing Swasthya Connect</p>
                        <p>For any queries, contact us at support@swasthyaconnect.com</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Consultation confirmation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send consultation confirmation email:', error);
        return { success: false, error: error.message };
    }
};

// Send consultation rejection email with refund notice
exports.sendRejectionEmail = async (patientEmail, patientName, consultationData, rejectionReason) => {
    const { doctorName, specialty, date, time, type, fee } = consultationData;

    const consultationTypeLabels = {
        video: '📹 Video Consultation',
        audio: '📞 Audio Consultation',
        chat: '💬 Text Chat Consultation'
    };

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const mailOptions = {
        from: `"Swasthya Connect" <${process.env.EMAIL_USER}>`,
        to: patientEmail,
        subject: `Consultation Request Rejected - Refund Initiated`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .consultation-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
                    .rejection-box { background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0; }
                    .refund-box { background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .detail-label { font-weight: bold; color: #666; }
                    .detail-value { color: #333; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>❌ Consultation Request Rejected</h1>
                        <p>Refund will be processed within 24 hours</p>
                    </div>
                    <div class="content">
                        <p>Dear <strong>${patientName}</strong>,</p>
                        <p>We regret to inform you that your consultation request has been rejected by the doctor.</p>
                        
                        <div class="consultation-card">
                            <h3 style="margin-top: 0; color: #dc2626;">Consultation Details</h3>
                            <div class="detail-row">
                                <span class="detail-label">Doctor:</span>
                                <span class="detail-value">Dr. ${doctorName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Specialty:</span>
                                <span class="detail-value">${specialty}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Type:</span>
                                <span class="detail-value">${consultationTypeLabels[type] || type}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Date:</span>
                                <span class="detail-value">${formattedDate}</span>
                            </div>
                            <div class="detail-row" style="border-bottom: none;">
                                <span class="detail-label">Time:</span>
                                <span class="detail-value">${time}</span>
                            </div>
                        </div>
                        
                        <div class="rejection-box">
                            <h3 style="margin-top: 0; color: #dc2626;">📋 Reason for Rejection</h3>
                            <p style="margin: 0;">${rejectionReason}</p>
                        </div>
                        
                        <div class="refund-box">
                            <h3 style="margin-top: 0; color: #10b981;">💰 Refund Information</h3>
                            <div class="detail-row">
                                <span class="detail-label">Amount:</span>
                                <span class="detail-value"><strong>NPR ${fee.toLocaleString()}</strong></span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value" style="color: #10b981;"><strong>Processing</strong></span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Expected Credit:</span>
                                <span class="detail-value">Within 24 hours</span>
                            </div>
                            <div class="detail-row" style="border-bottom: none;">
                                <span class="detail-label">Refund Method:</span>
                                <span class="detail-value">Original payment method</span>
                            </div>
                        </div>
                        
                        <p style="margin-top: 20px;">
                            <strong>What's Next?</strong><br>
                            • Your refund will be processed automatically<br>
                            • You can book another consultation with a different doctor<br>
                            • If you have any questions, please contact our support team
                        </p>
                        
                        <p>We apologize for any inconvenience caused and hope to serve you better in the future.</p>
                    </div>
                    <div class="footer">
                        <p>Best regards,<br>Swasthya Connect Team</p>
                        <p>For support, contact us at support@swasthyaconnect.com</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Rejection email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send rejection email:', error);
        return { success: false, error: error.message };
    }
};

// Send password reset OTP email
exports.sendPasswordResetOTP = async (userEmail, userName, otp) => {
    const mailOptions = {
        from: `"Swasthya Connect" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: '🔐 Password Reset OTP - Swasthya Connect',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px dashed #667eea; }
                    .otp-code { font-size: 48px; font-weight: bold; color: #667eea; letter-spacing: 10px; font-family: 'Courier New', monospace; margin: 20px 0; }
                    .warning-box { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 3px solid #ffc107; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .timer { background: #fef2f2; padding: 15px; border-radius: 5px; border-left: 3px solid #dc2626; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                        <p>Your verification code is ready</p>
                    </div>
                    <div class="content">
                        <p>Hello <strong>${userName}</strong>,</p>
                        <p>We received a request to reset your password. Use the OTP below to proceed:</p>
                        
                        <div class="otp-box">
                            <p style="margin: 0; color: #666; font-size: 14px;">Your One-Time Password</p>
                            <div class="otp-code">${otp}</div>
                            <p style="margin: 0; color: #666; font-size: 12px;">Enter this code on the verification page</p>
                        </div>
                        
                        <div class="timer">
                            <strong>⏰ Important:</strong> This OTP will expire in <strong>10 minutes</strong>
                        </div>
                        
                        <div class="warning-box">
                            <strong>🔒 Security Tips:</strong><br>
                            • Never share this OTP with anyone<br>
                            • Swasthya Connect will never ask for your OTP<br>
                            • If you didn't request this, please ignore this email
                        </div>
                        
                        <p style="margin-top: 20px;">
                            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                        </p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email from Swasthya Connect</p>
                        <p>For support, contact us at support@swasthyaconnect.com</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset OTP email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send OTP email:', error);
        return { success: false, error: error.message };
    }
};

// Send consultation started email
exports.sendConsultationStartedEmail = async (userEmail, userName, consultationDetails) => {
    const { doctorName, consultationType, scheduledTime, consultationId } = consultationDetails;

    const mailOptions = {
        from: `"Swasthya Connect" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: '🩺 Your Consultation Has Started - Swasthya Connect',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                    .detail-row:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #667eea; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🩺 Consultation Started!</h1>
                    </div>
                    <div class="content">
                        <p>Hello <strong>${userName}</strong>,</p>
                        <p>Your consultation with <strong>Dr. ${doctorName}</strong> has just started!</p>
                        
                        <div class="details">
                            <div class="detail-row">
                                <span class="label">Doctor:</span> Dr. ${doctorName}
                            </div>
                            <div class="detail-row">
                                <span class="label">Type:</span> ${consultationType}
                            </div>
                            <div class="detail-row">
                                <span class="label">Scheduled Time:</span> ${new Date(scheduledTime).toLocaleString()}
                            </div>
                            <div class="detail-row">
                                <span class="label">Duration:</span> 30 minutes
                            </div>
                        </div>
                        
                        <p><strong>Important:</strong> The consultation will automatically end after 30 minutes. You'll receive a warning at the 10-minute mark.</p>
                        
                        <p>Please join the consultation chat to communicate with your doctor.</p>
                        
                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                            Best regards,<br>
                            <strong>Swasthya Connect Team</strong>
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send consultation started email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = exports;


// Send consultation expired refund email
exports.sendConsultationExpiredEmail = async (patient, doctor, consultation) => {
    const mailOptions = {
        from: `"Swasthya Connect" <${process.env.EMAIL_USER}>`,
        to: patient.email,
        subject: 'Consultation Expired - Refund Initiated',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Consultation Expired</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${patient.firstName || 'Patient'},</p>
                        
                        <p>We regret to inform you that your consultation with <strong>Dr. ${doctor.firstName} ${doctor.lastName}</strong> could not be completed as it expired.</p>
                        
                        <div class="info-box">
                            <h3>Consultation Details:</h3>
                            <p><strong>Doctor:</strong> Dr. ${doctor.firstName} ${doctor.lastName}</p>
                            <p><strong>Specialty:</strong> ${consultation.specialty}</p>
                            <p><strong>Type:</strong> ${consultation.type.toUpperCase()}</p>
                            <p><strong>Scheduled:</strong> ${new Date(consultation.date).toLocaleDateString()} at ${consultation.time}</p>
                            <p><strong>Consultation Fee:</strong> NPR ${consultation.fee}</p>
                        </div>
                        
                        <h3>Refund Information:</h3>
                        <p>Your payment of <strong>NPR ${consultation.fee}</strong> will be refunded manually within <strong>24 hours</strong>.</p>
                        
                        <p>We apologize for any inconvenience caused. If you have any questions, please contact our support team.</p>
                        
                        <p>Best regards,<br>Swasthya Connect Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error sending expired consultation email:', error);
        return { success: false, error: error.message };
    }
};
