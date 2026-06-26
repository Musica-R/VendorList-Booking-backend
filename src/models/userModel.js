import db from "../config/db.js";

// 1. find the  email and phone number is on db during regsiter

const findUserByEmailOrPhone = (email, phone, callback) => {
  const sql = `
    SELECT * FROM users
    WHERE email = ? OR phone = ?
  `;

  db.query(sql, [email, phone], callback);
};

// 2. create the user 

const createUser = (userData, callback) => {
  const sql = `
    INSERT INTO users
    (
      name,
      email,
      password,
      phone,
      location,
      profileImage
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      userData.name,
      userData.email,
      userData.password,
      userData.phone,
      userData.location,
      userData.profileImage,
    ],
    callback
  );
};

//3.Edit profile 

const updateUser = (userId, userData, callback) => {
  const query = `
    UPDATE users
    SET name = ?, email = ?, phone = ?, location = ?
    WHERE id = ?
  `;

  const values = [
    userData.name,
    userData.email,
    userData.phone,
    userData.location,
    userId,
  ];

  db.query(query, values, callback);
};

// 4. Find the user by email during the login process (Login, Forgot Password, OTP verification)

const findUserByEmail = (email, callback) => {
  const sql = `
    SELECT * FROM users
    WHERE email = ?
  `;

  db.query(sql, [email], callback);
};

// 5. update OTP Generated OTP save panna.

const saveOtp = (email, otp, expires, callback) => {
  const sql = `
    UPDATE users 
    SET otp_code = ?, otp_expires = ?
    WHERE email = ?
  `;

  db.query(sql, [otp, expires, email], callback);
};

// 6. update password (for reset flow)

const updatePassword = (email, newPassword, callback) => {
  const sql = `
    UPDATE users
    SET password = ?,
        otp_code = NULL,
        otp_expires = NULL
    WHERE email = ?
  `;

  db.query(sql, [newPassword, email], callback);
};

// admin panle list 
const getAllUsers = (callback) => {
  const sql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.location,
      u.profileImage,
      u.created_at,

      (
        SELECT COUNT(*)
        FROM bookings b
        WHERE b.user_id = u.id
    ) AS total_bookings,

      (
        SELECT COALESCE(SUM(p.amount),0)
        FROM payments p
        WHERE p.user_id = u.id
        AND p.payment_status = 'paid'
    ) AS total_paid


    FROM users u

    LEFT JOIN bookings b
      ON u.id = b.user_id

    LEFT JOIN payments p
      ON p.user_id = u.id

    GROUP BY u.id

    ORDER BY u.id DESC
  `;

  db.query(sql, callback);
};

export const getUserWalletHistory = (userId, callback) => {
  const sql = `
    SELECT
      uw.id,
      uw.user_id,
      uw.vendor_id,
      v.full_name AS vendor_name,
      v.shop_name,
      uw.booking_id,
      uw.amount,
      uw.type,
      uw.reason,
      uw.status,
      uw.created_at
    FROM user_wallet uw
    LEFT JOIN vendors v
      ON uw.vendor_id = v.id
    WHERE uw.user_id = ?
    ORDER BY uw.created_at DESC
  `;

  db.query(sql, [userId], callback);
};

export default {
  createUser,
  findUserByEmailOrPhone,
  findUserByEmail,
  updateUser,
  saveOtp,
  updatePassword,
  getAllUsers,
};

