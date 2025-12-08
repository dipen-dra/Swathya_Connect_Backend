const axios = require('axios');

// WhatsApp Cloud API credentials
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

// Check if credentials are available
if (phoneNumberId && accessToken) {
    console.log('✅ WhatsApp Cloud API initialized');
} else {
    console.log('⚠️ WhatsApp Cloud API not configured (missing credentials)');
}

// Send WhatsApp medicine reminder using Cloud API
exports.sendWhatsAppReminder = async (phoneNumber, userName, reminderData) => {
    if (!phoneNumberId || !accessToken) {
        console.log('⚠️ WhatsApp service not available - skipping WhatsApp reminder');
        return { success: false, error: 'WhatsApp Cloud API not configured' };
    }

    const { medicineName, dosage, times, instructions } = reminderData;

    // Remove any spaces from the phone number
    const cleanPhoneNumber = phoneNumber.replace(/\s/g, '');

    // Format the message
    const message = `🏥 *Swasthya Connect - Medicine Reminder*

Hello ${userName}! ⏰

It's time to take your medicine in *10 minutes*.

💊 *${medicineName}*
📋 Dosage: ${dosage}
🕐 Scheduled Time: ${times.join(', ')}
${instructions ? `\n⚠️ Instructions: ${instructions}` : ''}

Please take your medicine as prescribed by your doctor.

_This is an automated reminder from Swasthya Connect_`;

    try {
        console.log('📤 Sending WhatsApp message to:', cleanPhoneNumber);
        console.log('📤 Using Phone Number ID:', phoneNumberId);

        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: cleanPhoneNumber,
                type: 'text',
                text: {
                    body: message
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ WhatsApp reminder sent:', response.data.messages[0].id);
        return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
        console.error('❌ Failed to send WhatsApp reminder:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

module.exports = exports;
