import db from "../config/db.js";

export const addFavorite = async (userId, vendorId) => {
  const sql = `
    INSERT INTO favorite_vendors (user_id, vendor_id)
    VALUES (?, ?)
  `;

  const [result] = await db.promise().query(sql, [userId, vendorId]);
  return result;
};

export const removeFavorite = async (userId, vendorId) => {
  const sql = `
    DELETE FROM favorite_vendors
    WHERE user_id = ? AND vendor_id = ?
  `;

  const [result] = await db.promise().query(sql, [userId, vendorId]);
  return result;
};

export const checkFavorite = async (userId, vendorId) => {
  const sql = `
    SELECT id
    FROM favorite_vendors
    WHERE user_id = ? AND vendor_id = ?
  `;

  const [rows] = await db.promise().query(sql, [userId, vendorId]);
  return rows.length > 0;
};

export const getUserFavorites = async (userId) => {
  const sql = `
    SELECT
      v.id,
      v.full_name,
      v.profile_photo,
      v.rating,
      v.category_id,
      sc.category_name,
      fv.created_at AS saved_at
    FROM favorite_vendors fv
    INNER JOIN vendors v
      ON fv.vendor_id = v.id
    LEFT JOIN service_categories sc
      ON v.category_id = sc.id
    WHERE fv.user_id = ?
    ORDER BY fv.created_at DESC
  `;

  const [rows] = await db.promise().query(sql, [userId]);
  return rows;
};