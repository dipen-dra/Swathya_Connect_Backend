const axios = require('axios');

// WhatsApp Cloud API credentials
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

// Template configuration
const TEMPLATES = {
    MEDICINE_REMINDER: 'medicine_reminder'
};

// Check if credentials are available
if (phoneNumberId && accessToken) {
    console.log('✅ WhatsApp Cloud API initialized');
    console.log('📋 Available templates:', Object.values(TEMPLATES).join(', '));
} else {
    console.log('⚠️ WhatsApp Cloud API not configured (missing credentials)');
}

/**
 * Send WhatsApp medicine reminder using approved template
 * @param {string} phoneNumber - Recipient's WhatsApp number (international format)
 * @param {string} userName - Patient's name
 * @param {object} reminderData - Medicine reminder details
 * @returns {Promise<object>} - Success status and message ID
 */
exports.sendWhatsAppReminder = async (phoneNumber, userName, reminderData) => {
    if (!phoneNumberId || !accessToken) {
        console.log('⚠️ WhatsApp service not available - skipping WhatsApp reminder');
        return { success: false, error: 'WhatsApp Cloud API not configured' };
    }

    const { medicineName, dosage, times } = reminderData;

    // Remove any spaces from the phone number
    const cleanPhoneNumber = phoneNumber.replace(/\s/g, '');

    // Get the next scheduled time (or first time if multiple)
    const nextTime = Array.isArray(times) ? times[0] : times;

    try {
        console.log('📤 Sending WhatsApp template message to:', cleanPhoneNumber);
        console.log('📋 Template:', TEMPLATES.MEDICINE_REMINDER);
        console.log('📤 Using Phone Number ID:', phoneNumberId);

        // Send using approved template
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: cleanPhoneNumber,
                type: 'template',
                template: {
                    name: TEMPLATES.MEDICINE_REMINDER,
                    language: {
                        code: 'en' // English
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                {
                                    type: 'text',
                                    text: userName // {{1}} - Patient name
                                },
                                {
                                    type: 'text',
                                    text: medicineName // {{2}} - Medicine name
                                },
                                {
                                    type: 'text',
                                    text: dosage // {{3}} - Dosage
                                },
                                {
                                    type: 'text',
                                    text: nextTime // {{4}} - Time
                                },
                                {
                                    type: 'text',
                                    text: reminderData.instructions || 'Take with water' // {{5}} - Instructions
                                }
                            ]
                        }
                    ]
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ WhatsApp template message sent:', response.data.messages[0].id);
        return {
            success: true,
            messageId: response.data.messages[0].id,
            template: TEMPLATES.MEDICINE_REMINDER
        };
    } catch (error) {
        console.error('❌ Failed to send WhatsApp template message:', error.response?.data || error.message);

        // If template fails, try fallback to regular text message
        if (error.response?.data?.error?.code === 132000 || error.response?.data?.error?.code === 133016) {
            console.log('⚠️ Template not available, falling back to regular message');
            return await sendFallbackMessage(cleanPhoneNumber, userName, reminderData);
        }

        return { success: false, error: error.response?.data || error.message };
    }
};

/**
 * Fallback function to send regular text message if template fails
 * @private
 */
async function sendFallbackMessage(phoneNumber, userName, reminderData) {
    const { medicineName, dosage, times, instructions } = reminderData;

    const message = `🏥 *Swasthya Connect - Medicine Reminder*

Hello ${userName}! ⏰

It's time to take your medicine in *10 minutes*.

💊 *${medicineName}*
📋 Dosage: ${dosage}
🕐 Scheduled Time: ${Array.isArray(times) ? times.join(', ') : times}
${instructions ? `\n⚠️ Instructions: ${instructions}` : ''}

Please take your medicine as prescribed by your doctor.

_This is an automated reminder from Swasthya Connect_`;

    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: phoneNumber,
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

        console.log('✅ WhatsApp fallback message sent:', response.data.messages[0].id);
        return {
            success: true,
            messageId: response.data.messages[0].id,
            fallback: true
        };
    } catch (error) {
        console.error('❌ Failed to send fallback message:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
}

/**
 * Send a custom WhatsApp template message
 * @param {string} phoneNumber - Recipient's WhatsApp number
 * @param {string} templateName - Template name from Meta
 * @param {string} languageCode - Language code (e.g., 'en')
 * @param {Array} parameters - Array of parameter values for the template
 * @returns {Promise<object>} - Success status and message ID
 */
exports.sendTemplateMessage = async (phoneNumber, templateName, languageCode, parameters) => {
    if (!phoneNumberId || !accessToken) {
        console.log('⚠️ WhatsApp service not available');
        return { success: false, error: 'WhatsApp Cloud API not configured' };
    }

    const cleanPhoneNumber = phoneNumber.replace(/\s/g, '');

    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: cleanPhoneNumber,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: languageCode
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: parameters.map(param => ({
                                type: 'text',
                                text: param
                            }))
                        }
                    ]
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ WhatsApp template message sent:', response.data.messages[0].id);
        return {
            success: true,
            messageId: response.data.messages[0].id,
            template: templateName
        };
    } catch (error) {
        console.error('❌ Failed to send template message:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

module.exports = exports;
