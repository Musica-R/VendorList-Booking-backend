import db from "../config/db.js";

// Add Booking Item

const createBookingItem = (itemData, callback) => {
  const sql = `
    INSERT INTO booking_items
    (
      booking_id,
      category_id,
      sub_service_id,
      price,
      quantity
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      itemData.booking_id,
      itemData.category_id,
      itemData.sub_service_id,
      itemData.price,
      itemData.quantity,
    ],
    callback
  );
};

// Get Items By Booking Id

const getBookingItems = (bookingId, callback) => {
  const sql = `
    SELECT
      bi.*,
      ss.sub_service_name
    FROM booking_items bi
    LEFT JOIN sub_services ss
      ON bi.sub_service_id = ss.id
    WHERE bi.booking_id = ?
  `;
[]
  db.query(sql, [bookingId], callback);
};

export default {
  createBookingItem,
  getBookingItems,
};