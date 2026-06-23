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
            vendor_id,
            user_id,

            gross_amount,
            fee,
            tax,
            net_amount,

            settled_at

        )

        VALUES (?,?,?,?,?,?,?,?,?,?)
    `;

    db.query(sql, [

        data.razorpaySettlementId,
        data.razorpayPaymentId,

        data.bookingId,
        data.vendorId,
        data.userId,

        data.grossAmount,
        data.fee,
        data.tax,
        data.netAmount,

        data.settledAt

    ], callback);

};

export default {

    checkSettlementExists,
    getPaymentDetails,
    insertSettlement

};