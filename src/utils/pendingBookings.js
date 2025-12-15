// In-memory storage for pending bookings
// This will store booking data temporarily until payment is verified
const pendingBookings = new Map();

// Helper function to generate unique booking ID
const generateBookingId = () => {
    return `BOOKING-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper functions
const storePendingBooking = (bookingId, bookingData) => {
    pendingBookings.set(bookingId, {
        ...bookingData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry
    });
    return bookingId;
};

const getPendingBooking = (bookingId) => {
    const booking = pendingBookings.get(bookingId);
    if (!booking) return null;

    // Check if expired
    if (new Date() > booking.expiresAt) {
        pendingBookings.delete(bookingId);
        return null;
    }

    return booking;
};

const deletePendingBooking = (bookingId) => {
    pendingBookings.delete(bookingId);
};

// Cleanup expired bookings every 10 minutes
setInterval(() => {
    const now = new Date();
    for (const [bookingId, booking] of pendingBookings.entries()) {
        if (now > booking.expiresAt) {
            pendingBookings.delete(bookingId);
        }
    }
}, 10 * 60 * 1000);

module.exports = {
    generateBookingId,
    storePendingBooking,
    getPendingBooking,
    deletePendingBooking
};
