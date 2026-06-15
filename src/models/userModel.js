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



export default {
  createUser,
  findUserByEmailOrPhone,
  findUserByEmail,
  updateUser,
  saveOtp,
  updatePassword,
};

