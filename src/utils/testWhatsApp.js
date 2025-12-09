/**
 * WhatsApp Template Test Script
 * 
 * This script tests the WhatsApp Cloud API integration with the approved template.
 * 
 * Usage:
 *   node src/utils/testWhatsApp.js +9779812345678
 * 
 * Make sure to:
 * 1. Add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN to .env
 * 2. Replace the phone number with your actual WhatsApp number
 * 3. Phone number must be in international format: +[country_code][number]
 */

require('dotenv').config();
const { sendWhatsAppReminder, sendTemplateMessage } = require('./whatsappService');

// Get phone number from command line argument
const phoneNumber = process.argv[2];

if (!phoneNumber) {
    console.error('❌ Error: Please provide a phone number');
    console.log('Usage: node src/utils/testWhatsApp.js +9779812345678');
    process.exit(1);
}

// Validate phone number format
if (!phoneNumber.startsWith('+')) {
    console.error('❌ Error: Phone number must be in international format (e.g., +9779812345678)');
    process.exit(1);
}

async function testWhatsAppTemplate() {
    console.log('\n🧪 Testing WhatsApp Template Integration\n');
    console.log('━'.repeat(50));

    // Test data
    const testData = {
        userName: 'Dipanshu',
        reminderData: {
            medicineName: 'Paracetamol',
            dosage: '500mg',
            times: ['18:00', '22:00'],
            instructions: 'Take with water'
        }
    };

    console.log('\n📋 Test Data:');
    console.log(`   Patient: ${testData.userName}`);
    console.log(`   Medicine: ${testData.reminderData.medicineName}`);
    console.log(`   Dosage: ${testData.reminderData.dosage}`);
    console.log(`   Times: ${testData.reminderData.times.join(', ')}`);
    console.log(`   Phone: ${phoneNumber}`);
    console.log('\n━'.repeat(50));

    try {
        console.log('\n🚀 Sending WhatsApp template message...\n');

        const result = await sendWhatsAppReminder(
            phoneNumber,
            testData.userName,
            testData.reminderData
        );

        console.log('\n━'.repeat(50));

        if (result.success) {
            console.log('\n✅ SUCCESS! WhatsApp message sent\n');
            console.log('📊 Result Details:');
            console.log(`   Message ID: ${result.messageId}`);
            console.log(`   Template: ${result.template || 'N/A'}`);
            console.log(`   Fallback Used: ${result.fallback ? 'Yes' : 'No'}`);
            console.log('\n💡 Check your WhatsApp to see the message!');
        } else {
            console.log('\n❌ FAILED to send WhatsApp message\n');
            console.log('📊 Error Details:');
            console.log(JSON.stringify(result.error, null, 2));

            console.log('\n🔍 Troubleshooting:');
            console.log('   1. Check if WHATSAPP_PHONE_NUMBER_ID is set in .env');
            console.log('   2. Check if WHATSAPP_ACCESS_TOKEN is set in .env');
            console.log('   3. Verify the phone number is correct and has WhatsApp');
            console.log('   4. Check if template is approved in Meta Business Manager');
            console.log('   5. Review error details above for specific issues');
        }

        console.log('\n━'.repeat(50));
        console.log('\n');

    } catch (error) {
        console.error('\n❌ Unexpected Error:', error.message);
        console.error('\nStack Trace:', error.stack);
    }
}

// Run the test
testWhatsAppTemplate()
    .then(() => {
        console.log('✅ Test completed\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
