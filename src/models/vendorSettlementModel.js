import db from "../config/db.js";

const getBookingSettlementData = (bookingId, callback) => {
  const sql = `
    SELECT
      b.id,
      b.vendor_id,
      b.booking_status,
      b.payment_status,
      b.balance_payment_status,

      (SELECT COUNT(*) FROM payments p WHERE p.booking_id = b.id) AS payment_count,

      (SELECT COUNT(*) FROM razorpay_settlements rs WHERE rs.booking_id = b.id) AS settlement_count,

     (
    COALESCE((
        SELECT SUM(rs.net_amount)
        FROM razorpay_settlements rs
        WHERE rs.booking_id = b.id
    ),0)

    +

    COALESCE((
        SELECT SUM(uw.amount)
        FROM user_wallet uw
        WHERE uw.booking_id = b.id
        AND uw.type = 'debit'
        AND uw.status = 'completed'
    ),0)

) AS total_received

    FROM bookings b
    WHERE b.id = ?
  `;

  db.query(sql, [bookingId], callback);
};

const checkVendorSettlementExists = (bookingId, callback) => {
  const sql = `
    SELECT id
    FROM vendor_settlements
    WHERE booking_id = ?
  `;

  db.query(sql, [bookingId], callback);
};

const createVendorSettlement = (
  bookingId,
  vendorId,
  totalReceived,
  commission,
  vendorAmount,
  callback
) => {
  const sql = `
    INSERT INTO vendor_settlements (
      booking_id,
      vendor_id,
      total_received,
      platform_commission_amount,
      vendor_amount
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      bookingId,
      vendorId,
      totalReceived,
      commission,
      vendorAmount,
    ],
    callback
  );
};


// cancel by user logic model

const getCancelledUserBooking = (bookingId, callback) => {
  const sql = `
        SELECT
            b.id,
            b.user_id,
            b.vendor_id,
            b.booking_status,

            COUNT(rs.id) settlement_count,

            COALESCE(SUM(rs.net_amount),0) total_received

        FROM bookings b

        LEFT JOIN razorpay_settlements rs
        ON rs.booking_id=b.id

        WHERE b.id=?

        GROUP BY b.id
    `;

  db.query(sql, [bookingId], callback);
};

const checkPlatformProfit = (bookingId, callback) => {
  db.query(
    "SELECT id FROM platform_profits WHERE booking_id=?",
    [bookingId],
    callback
  );
};

const createPlatformProfit = (bookingId, userId, vendorId, amount, callback) => {

  db.query(
    `INSERT INTO platform_profits
        (booking_id,user_id,vendor_id,amount,reason)
        VALUES(?,?,?,?, 'cancelled_by_user')`,
    [bookingId, userId, vendorId, amount],
    callback
  );
};

// cancel by vendor logic

const getVendorCancelledBooking = (bookingId, callback) => {

  const sql = `

    SELECT

    b.id,
    b.user_id,
    b.vendor_id,
    b.booking_status,

    COUNT(rs.id) settlement_count,

    COALESCE(SUM(rs.net_amount),0) total_received

    FROM bookings b

    LEFT JOIN razorpay_settlements rs
    ON rs.booking_id=b.id

    WHERE b.id=?

    GROUP BY b.id, b.user_id, b.vendor_id, b.booking_status;

    `;

  db.query(sql, [bookingId], callback);

};

const checkWalletEntry = (bookingId, callback) => {

  db.query(
    "SELECT id FROM user_wallet WHERE booking_id=? AND type='credit'",
    [bookingId],
    callback
  );

};

const creditWallet = (
  userId,
  vendorId,
  bookingId,
  amount,
  callback
) => {

  const sql = `
    INSERT INTO user_wallet
    (
      user_id,
      vendor_id,
      booking_id,
      amount,
      type,
      reason
    )
    VALUES (?, ?, ?, ?, 'credit', 'Booking Cancelled By Vendor')
  `;

  db.query(
    sql,
    [userId, vendorId, bookingId, amount],
    callback
  );
};


export default {
  getBookingSettlementData,
  checkVendorSettlementExists,
  createVendorSettlement,
  getCancelledUserBooking,
  checkPlatformProfit,
  createPlatformProfit,
  getVendorCancelledBooking,
  checkWalletEntry,
  creditWallet
};