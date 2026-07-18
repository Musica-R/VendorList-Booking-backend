import db from "../config/db.js";

// Create Booking

const createBooking = (bookingData, callback) => {
  const sql = `
    INSERT INTO bookings
    (
      booking_number,
      user_id,
      vendor_id,
      customer_name,
      customer_phone,
      customer_address,
      booking_date,
      booking_time,
      total_amount,
      booking_status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      bookingData.booking_number,
      bookingData.user_id,
      bookingData.vendor_id,
      bookingData.customer_name,
      bookingData.customer_phone,
      bookingData.customer_address,
      bookingData.booking_date,
      bookingData.booking_time,
      bookingData.total_amount,
      bookingData.booking_status,
    ],
    callback
  );
};

// Get Booking By Id

const getBookingById = (bookingId, callback) => {
  const sql = `
    SELECT *
    FROM bookings
    WHERE id = ?
  `;

  db.query(sql, [bookingId], callback);
};

// Get User Bookings

const getBookingsByUserId = (userId, callback) => {
  const sql = `
    SELECT *
    FROM bookings
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [userId], callback);
};





export default {
  createBooking,
  getBookingById,
  getBookingsByUserId,
};

