import db from "../config/db.js";

const findAdminByEmailAndMobile = (email, mobile, callback) => {
  const sql = `
    SELECT *
    FROM admins
    WHERE email = ? AND mobile = ?
  `;

  db.query(sql, [email, mobile], callback);
};

// admin booking list 

const getAllBookings = (callback) => {
  const sql = `
    SELECT
      b.id,
      b.booking_number,
      b.user_id,
      u.name AS user_name,

      b.vendor_id,
      v.full_name AS vendor_name,
      v.shop_name,

      b.customer_name,
      b.customer_phone,
      b.customer_address,

      b.booking_date,
      b.booking_time,

      b.total_amount,
      b.balance_amount,

      b.payment_status,
      b.balance_payment_status,
      b.booking_status,

      b.created_at

    FROM bookings b

    LEFT JOIN users u
      ON b.user_id = u.id

    LEFT JOIN vendors v
      ON b.vendor_id = v.id

    ORDER BY b.id DESC
  `;

  db.query(sql, callback);
};


export default {
  findAdminByEmailAndMobile,
  getAllBookings
};