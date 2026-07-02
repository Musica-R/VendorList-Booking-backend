import db from "../config/db.js";

const createBooking = (bookingData, callback) => {
    const sql = `
   INSERT INTO activity_bookings
(
booking_number,
user_id,
activity_vendor_id,
activity_plan_id,
customer_name,
customer_phone,
customer_address,
booking_date,
booking_time,
total_amount,
advance_amount,
payment_status,
booking_status,

razorpay_order_id,
razorpay_payment_id,
razorpay_signature
)
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

    db.query(
        sql,
        [
            bookingData.booking_number,
            bookingData.user_id,
            bookingData.activity_vendor_id,
            bookingData.activity_plan_id,
            bookingData.customer_name,
            bookingData.customer_phone,
            bookingData.customer_address,
            bookingData.booking_date,
            bookingData.booking_time,
            bookingData.total_amount,
            bookingData.advance_amount,
            bookingData.payment_status,
            bookingData.booking_status,

            bookingData.razorpay_order_id,
            bookingData.razorpay_payment_id,
            bookingData.razorpay_signature
        ],
        callback
    );
};

const getNearbyStallList = (callback) => {
    const sql = `
        SELECT
            id,
            shop_name,
            phone,
            whatsapp_number,
            email,
            address1,
            address2,
            city,
            pincode,
            description,
            google_map_link,
            latitude,
            longitude,
            profile_photo,
            government_id,
            opening_time,
            closing_time,
            status,
            is_verified,
            listing_fee,
            payment_status,
            created_at,
            updated_at
        FROM nearby_stalls
        ORDER BY id DESC
    `;

    db.query(sql, callback);
};


const getActivityBookingList = (callback) => {

    const sql = `
        SELECT
            ab.id,
            ab.booking_number,

            u.id AS user_id,
            u.name AS user_name,
            u.phone AS user_phone,

            av.id AS activity_vendor_id,
            av.full_name AS vendor_name,
            av.shop_name,

            ac.id AS activity_id,
            ac.activity_name,

            avp.id AS plan_id,
            avp.plan_name,
            avp.amount,
            avp.advance_amount,

            ab.customer_name,
            ab.customer_phone,
            ab.customer_address,
            ab.booking_date,
            ab.booking_time,
            ab.total_amount,
            ab.advance_amount AS paid_advance_amount,
            ab.payment_status,
            ab.booking_status,
            ab.created_at

        FROM activity_bookings ab

        LEFT JOIN users u
            ON ab.user_id = u.id

        LEFT JOIN activity_vendors av
            ON ab.activity_vendor_id = av.id

        LEFT JOIN activity_categories ac
            ON av.activity_id = ac.id

        LEFT JOIN activity_vendor_plans avp
            ON ab.activity_plan_id = avp.id

        ORDER BY ab.id DESC
    `;

    db.query(sql, callback);
};

export default {
    createBooking,
    getNearbyStallList,
    getActivityBookingList
};