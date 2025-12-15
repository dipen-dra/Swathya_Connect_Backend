const pendingOrders = new Map();

// Auto-cleanup expired orders (30 minutes)
const ORDER_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

setInterval(() => {
    const now = Date.now();
    for (const [orderId, orderData] of pendingOrders.entries()) {
        if (now - orderData.timestamp > ORDER_EXPIRY_TIME) {
            pendingOrders.delete(orderId);
            console.log(`🗑️  Cleaned up expired pending order: ${orderId}`);
        }
    }
}, 5 * 60 * 1000); // Check every 5 minutes

function generateOrderId() {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function storePendingOrder(orderId, orderData) {
    pendingOrders.set(orderId, {
        ...orderData,
        timestamp: Date.now()
    });
    console.log(`✅ Stored pending order: ${orderId}`);
}

function getPendingOrder(orderId) {
    return pendingOrders.get(orderId);
}

function deletePendingOrder(orderId) {
    const deleted = pendingOrders.delete(orderId);
    if (deleted) {
        console.log(`🗑️  Deleted pending order: ${orderId}`);
    }
    return deleted;
}

module.exports = {
    generateOrderId,
    storePendingOrder,
    getPendingOrder,
    deletePendingOrder
};
