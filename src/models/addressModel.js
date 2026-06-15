import db from "../config/db.js";

// Add Address
const addAddress = (addressData, callback) => {
  const sql = `
    INSERT INTO user_addresses
    (user_id, address_type, flat, area, city, state, pincode)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      addressData.user_id,
      addressData.address_type,
      addressData.flat,
      addressData.area,
      addressData.city,
      addressData.state,
      addressData.pincode,
    ],
    callback
  );
};

// Get User Addresses
const getAddressesByUserId = (userId, callback) => {
  db.query(
    "SELECT * FROM user_addresses WHERE user_id = ?",
    [userId],
    callback
  );
};

// Update Address
const updateAddress = (id, addressData, callback) => {
  const sql = `
    UPDATE user_addresses
    SET address_type=?, flat=?, area=?, city=?, state=?, pincode=?
    WHERE id=?
  `;

  db.query(
    sql,
    [
      addressData.address_type,
      addressData.flat,
      addressData.area,
      addressData.city,
      addressData.state,
      addressData.pincode,
      id,
    ],
    callback
  );
};

// Delete Address
const deleteAddress = (id, callback) => {
  db.query(
    "DELETE FROM user_addresses WHERE id = ?",
    [id],
    callback
  );
};

export default {
  addAddress,
  getAddressesByUserId,
  updateAddress,
  deleteAddress,
};