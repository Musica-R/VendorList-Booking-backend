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

export default {
    createBooking,
};