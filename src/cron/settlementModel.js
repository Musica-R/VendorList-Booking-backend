import db from "../config/db.js";

const checkSettlementExists = (paymentId, callback) => {
    const sql = `
        SELECT id
        FROM razorpay_settlements
        WHERE razorpay_payment_id = ?
    `;

    db.query(sql, [paymentId], callback);
};

const getPaymentDetails = (paymentId, callback) => {
    const sql = `
        SELECT
            booking_id,
            vendor_id,
            user_id
        FROM payments
        WHERE razorpay_payment_id = ?
        LIMIT 1
    `;

    db.query(sql, [paymentId], callback);
};

const insertSettlement = (data, callback) => {

    const sql = `
        INSERT INTO razorpay_settlements (

            razorpay_settlement_id,
            razorpay_payment_id,

            booking_id,
            booking_type,
            vendor_id,
            user_id,

            gross_amount,
            fee,
            tax,
            net_amount,

            settled_at

        )

      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `;

    db.query(sql, [

        data.razorpaySettlementId,
        data.razorpayPaymentId,

        data.bookingId,
        data.bookingType,
        data.vendorId,
        data.userId,

        data.grossAmount,
        data.fee,
        data.tax,
        data.netAmount,

        data.settledAt

    ], callback);

};


const getActivityBookingByPaymentId = (
    paymentId,
    callback
) => {

    const sql = `
        SELECT
            id,
            user_id,
            activity_vendor_id,
            razorpay_payment_id
        FROM activity_bookings
        WHERE razorpay_payment_id = ?
    `;

    db.query(sql, [paymentId], callback);

};

// Get Nearby Stall Details

const getNearbyStallByPaymentId = (paymentId, callback) => {

    const sql = `
        SELECT
            id,
            listing_fee,
            razorpay_payment_id
        FROM nearby_stalls
        WHERE razorpay_payment_id = ?
        LIMIT 1
    `;

    db.query(sql, [paymentId], callback);

};

// Check Already Exists near by stall 

const checkNearbyStallProfitExists = (paymentId, callback) => {

    const sql = `
        SELECT id
        FROM nearby_stall_profits
        WHERE razorpay_payment_id = ?
    `;

    db.query(sql, [paymentId], callback);

};

// Insert Nearby Stall Profit

const insertNearbyStallProfit = (data, callback) => {

    const sql = `
        INSERT INTO nearby_stall_profits (

            stall_id,

            razorpay_settlement_id,
            razorpay_payment_id,

            listing_fee,

            razorpay_fee,
            razorpay_tax,

            platform_profit,

            settled_at

        )
        VALUES (?,?,?,?,?,?,?,?)
    `;

    db.query(sql, [

        data.stallId,
        data.razorpaySettlementId,
        data.razorpayPaymentId,
        data.listingFee,
        data.razorpayFee,
        data.razorpayTax,
        data.platformProfit,
        data.settledAt

    ], callback);

};

export default {

    checkSettlementExists,
    getPaymentDetails,
    insertSettlement,
    getActivityBookingByPaymentId,
    checkNearbyStallProfitExists,
    getNearbyStallByPaymentId,
    insertNearbyStallProfit
};