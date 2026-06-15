import db from "../config/db.js";

// Save Payment

const createPayment = (paymentData, callback) => {
  const sql = `
    INSERT INTO payments
    (
      booking_id,
      user_id,
      vendor_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      payment_status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      paymentData.booking_id,
      paymentData.user_id,
      paymentData.vendor_id,
      paymentData.razorpay_order_id,
      paymentData.razorpay_payment_id,
      paymentData.razorpay_signature,
      paymentData.amount,
      paymentData.payment_status,
    ],
    callback
  );
};

// Get Payment By Booking Id

const getPaymentByBookingId = (bookingId, callback) => {
  const sql = `
    SELECT *
    FROM payments
    WHERE booking_id = ?
  `;

  db.query(sql, [bookingId], callback);
};

const updateBalance = (bookingId, balanceStatus, paymentStatus, callback) => {
  const sql = `
    UPDATE bookings
    SET balance_payment_status = ?,
        payment_status = ?
    WHERE id = ?
  `;

  db.query(sql, [balanceStatus, paymentStatus, bookingId], callback);
};

// Get Payments by User ID
const getPaymentsByUserId = (userId, callback) => {
  const sql = `
    SELECT 
      p.id AS payment_id,
      p.amount,
      p.payment_status,
      p.razorpay_payment_id,
      p.created_at,
      p.payment_type,
      v.full_name AS vendor_name,
      GROUP_CONCAT(ss.service_name SEPARATOR ', ') AS services
    FROM payments p
    JOIN vendors v ON v.id = p.vendor_id
    JOIN bookings b ON b.id = p.booking_id
    JOIN booking_items bi ON bi.booking_id = b.id
    JOIN sub_services ss ON ss.id = bi.sub_service_id
    WHERE p.user_id = ?
    GROUP BY p.id
    ORDER BY p.id DESC
  `;

  db.query(sql, [userId], callback);
};

// Get Payments by Vendor ID
const getPaymentsByVendorId = (vendorId, callback) => {
  const sql = `
    SELECT 
      p.id AS payment_id,
      p.amount,
      p.payment_status,
      p.razorpay_payment_id,
      p.created_at,
       p.payment_type,
      u.name AS user_name,
      u.phone AS user_phone,
      GROUP_CONCAT(ss.service_name SEPARATOR ', ') AS services
    FROM payments p
    JOIN users u ON u.id = p.user_id
    JOIN bookings b ON b.id = p.booking_id
    JOIN booking_items bi ON bi.booking_id = b.id
    JOIN sub_services ss ON ss.id = bi.sub_service_id
    WHERE p.vendor_id = ?
    GROUP BY p.id
    ORDER BY p.id DESC
  `;

  db.query(sql, [vendorId], callback);
};

export default {
  createPayment,
  getPaymentByBookingId,
  updateBalance,
  getPaymentsByUserId,
  getPaymentsByVendorId
};