import db from "../config/db.js";

// Check booking already reviewed
export const checkReviewExists = (bookingId, callback) => {
  const sql = `
    SELECT id
    FROM reviews
    WHERE booking_id = ?
  `;

  db.query(sql, [bookingId], callback);
};

// Add review
export const createReview = (reviewData, callback) => {
  const sql = `
    INSERT INTO reviews
    (
      booking_id,
      vendor_id,
      user_id,
      rating,
      review
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      reviewData.booking_id,
      reviewData.vendor_id,
      reviewData.user_id,
      reviewData.rating,
      reviewData.review,
    ],
    callback
  );
};

// Update Vendor Rating
export const updateVendorRating = (vendorId, callback) => {
  const sql = `
    UPDATE vendors
    SET rating = (
      SELECT ROUND(AVG(rating),1)
      FROM reviews
      WHERE vendor_id = ?
    )
    WHERE id = ?
  `;

  db.query(sql, [vendorId, vendorId], callback);
}; //(5 + 4 + 3) / 3 = 4.0

export const getVendorReviews = (vendorId, callback) => {
  const sql = `
    SELECT
      r.booking_id,
      u.name AS user_name,
      r.rating,
      r.review,
      r.created_at
    FROM reviews r
    JOIN users u
      ON r.user_id = u.id
    WHERE r.vendor_id = ?
    ORDER BY r.created_at DESC
  `;

  db.query(sql, [vendorId], callback);
};