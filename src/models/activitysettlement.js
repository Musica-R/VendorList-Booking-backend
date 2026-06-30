import db from "../config/db.js";

const getActivityBooking = (razorpayPaymentId, callback) => {

    const sql = `
        SELECT
            id,
            activity_vendor_id,
            payment_status,
            booking_status,
            razorpay_payment_id
        FROM activity_bookings
        WHERE razorpay_payment_id = ?
    `;

    db.query(sql, [razorpayPaymentId], callback);

};

const getSettlement = (razorpayPaymentId, callback) => {

    const sql = `
        SELECT
            razorpay_payment_id,
            net_amount
        FROM razorpay_settlements
        WHERE razorpay_payment_id = ?
    `;

    db.query(sql, [razorpayPaymentId], callback);

};

const checkSettlementExists = (activityBookingId, callback) => {

    const sql = `
        SELECT id
        FROM activity_vendor_settlements
        WHERE activity_booking_id = ?
    `;

    db.query(sql, [activityBookingId], callback);

};

const createSettlement = (
    activityBookingId,
    activityVendorId,
    totalReceived,
    commission,
    vendorAmount,
    callback
) => {

    const sql = `
        INSERT INTO activity_vendor_settlements
        (
            activity_booking_id,
            activity_vendor_id,
            total_received,
            platform_commission_amount,
            vendor_amount
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            activityBookingId,
            activityVendorId,
            totalReceived,
            commission,
            vendorAmount
        ],
        callback
    );

};


const getAllActivityVendorSettlements = (callback) => {
    const sql = `
       SELECT
    avs.id AS settlement_id,

    ab.id AS booking_id,
    ab.booking_number,
    ab.user_id,
    ab.activity_vendor_id AS vendor_id,

    av.full_name AS vendor_name,
    av.phone AS vendor_phone,
    av.shop_name,

    ab.customer_name AS user_name,
    ab.customer_phone AS user_mobile,
    ab.customer_address,

    ab.booking_date,
    ab.booking_time,

    ab.activity_plan_id,
    ab.total_amount,
    ab.advance_amount,

    ab.payment_status,
    ab.booking_status,
    ab.created_at,

    ab.razorpay_order_id,
    ab.razorpay_payment_id,
    ab.razorpay_signature,

    rs.razorpay_settlement_id,
    rs.gross_amount AS razorpay_gross_amount,
    rs.fee AS razorpay_fee,
    rs.tax AS razorpay_tax,
    rs.net_amount AS razorpay_settlement,
    rs.settled_at,

    avs.total_received,
    avs.platform_commission_percent,
    avs.platform_commission_amount,
    avs.vendor_amount,
    avs.settlement_status

FROM activity_vendor_settlements avs

INNER JOIN activity_bookings ab
    ON avs.activity_booking_id = ab.id

INNER JOIN activity_vendors av
    ON avs.activity_vendor_id = av.id

LEFT JOIN razorpay_settlements rs
    ON rs.booking_id = ab.id
    AND rs.booking_type = 'activity'

ORDER BY avs.id DESC;
    `;

    db.query(sql, callback);
};

export default {

    getActivityBooking,
    getSettlement,
    checkSettlementExists,
    createSettlement,
    getAllActivityVendorSettlements,

};