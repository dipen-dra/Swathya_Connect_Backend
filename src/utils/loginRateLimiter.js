// Store failed login attempts: { ip: { count: number, blockedUntil: Date } }
const loginAttempts = new Map();

const MAX_ATTEMPTS = 7;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Cleanup expired blocks every 5 minutes
setInterval(() => {
    const now = new Date();
    for (const [ip, attempt] of loginAttempts.entries()) {
        if (attempt.blockedUntil && now > attempt.blockedUntil) {
            loginAttempts.delete(ip);
        }
    }
}, 5 * 60 * 1000);

/**
 * Check if an IP address is currently blocked
 * @param {string} ip - IP address to check
 * @returns {Object|boolean} - Returns object with blocked status and remaining time, or false if not blocked
 */
exports.isBlocked = (ip) => {
    const attempt = loginAttempts.get(ip);
    if (!attempt) return false;

    // Check if there's a block time set and if it's still active
    if (attempt.blockedUntil && new Date() < attempt.blockedUntil) {
        const remainingMs = attempt.blockedUntil - new Date();
        return {
            blocked: true,
            remainingTime: Math.ceil(remainingMs / 1000 / 60) // Convert to minutes
        };
    }

    // If block time exists but has expired, clear the block status but keep the count
    if (attempt.blockedUntil && new Date() >= attempt.blockedUntil) {
        delete attempt.blockedUntil; // Remove the blockedUntil property
        loginAttempts.set(ip, attempt); // Update the map with the modified attempt object
    }

    // Not blocked (either no block time set, or block expired and was cleared)
    return false;
};

/**
 * Record a failed login attempt
 * @param {string} ip - IP address
 * @returns {number} - Current attempt count
 */
exports.recordFailedAttempt = (ip) => {
    const attempt = loginAttempts.get(ip) || { count: 0 };
    attempt.count++;

    if (attempt.count >= MAX_ATTEMPTS) {
        attempt.blockedUntil = new Date(Date.now() + BLOCK_DURATION);
        console.log(`🚫 IP ${ip} blocked until ${attempt.blockedUntil.toLocaleString()}`);
    }

    loginAttempts.set(ip, attempt);
    return attempt.count;
};

/**
 * Reset login attempts for an IP (called on successful login)
 * @param {string} ip - IP address
 */
exports.resetAttempts = (ip) => {
    loginAttempts.delete(ip);
};

/**
 * Get current attempt count for an IP
 * @param {string} ip - IP address
 * @returns {number} - Current attempt count
 */
exports.getAttemptCount = (ip) => {
    const attempt = loginAttempts.get(ip);
    return attempt ? attempt.count : 0;
};

// Export constants for use in controllers
exports.MAX_ATTEMPTS = MAX_ATTEMPTS;
exports.BLOCK_DURATION_MINUTES = BLOCK_DURATION / 1000 / 60;
