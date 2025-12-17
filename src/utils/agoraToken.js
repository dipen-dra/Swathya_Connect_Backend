const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

/**
 * Generate Agora RTC token for audio/video consultation
 * @param {string} channelName - Unique channel name (use consultation ID)
 * @param {number} uid - User ID (0 for auto-assign)
 * @param {string} role - 'publisher' or 'subscriber' (use 'publisher' for both doctor and patient)
 * @param {number} expirationTimeInSeconds - Token expiration time (default: 3600 = 1 hour)
 * @returns {string} - Agora RTC token
 */
const generateAgoraToken = (channelName, uid = 0, role = 'publisher', expirationTimeInSeconds = 3600) => {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    console.log('🔍 Agora Debug - App ID:', appId ? `${appId.substring(0, 8)}...` : 'MISSING');
    console.log('🔍 Agora Debug - Certificate:', appCertificate ? `${appCertificate.substring(0, 8)}...` : 'MISSING');

    if (!appId || !appCertificate) {
        throw new Error('Agora App ID and Certificate must be set in environment variables');
    }

    // Calculate privilege expiration time
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Determine role
    const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // Build token
    const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        agoraRole,
        privilegeExpiredTs
    );

    return token;
};

module.exports = {
    generateAgoraToken
};
