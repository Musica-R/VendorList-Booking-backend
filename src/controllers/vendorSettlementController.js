import vendorSettlementModel from "../models/vendorSettlementModel.js";
import db from "../config/db.js";
import settlementModel from "../cron/settlementModel.js";

export const checkAndCreateVendorSettlement = (bookingId) => {

    vendorSettlementModel.getBookingSettlementData(
        bookingId,
        (err, result) => {

            if (err || result.length === 0) {
                return;
            }

            const booking = result[0];

            // Booking must be completed
            if (booking.booking_status !== "completed") {
                return;
            }

            // Advance must be paid
            if (booking.payment_status !== "paid") {
                return;
            }

            // Balance must be paid
            if (booking.balance_payment_status !== "paid") {
                return;
            }

            // Both payments must be settled
            if (
                Number(booking.payment_count) !==
                Number(booking.settlement_count)
            ) {
                return;
            }

            vendorSettlementModel.checkVendorSettlementExists(
                bookingId,
                (err2, existing) => {

                    if (err2) return;

                    if (existing.length > 0) {
                        return;
                    }

                    const totalReceived =
                        Number(booking.total_received);

                    const commission =
                        +(totalReceived * 0.10).toFixed(2);

                    const vendorAmount =
                        +(totalReceived - commission).toFixed(2);

                    vendorSettlementModel.createVendorSettlement(
                        bookingId,
                        booking.vendor_id,
                        totalReceived,
                        commission,
                        vendorAmount,
                        (err3) => {

                            if (err3) {
                                console.log(err3);
                                return;
                            }

                            console.log(
                                `Vendor settlement created for booking ${bookingId}`
                            );
                        }
                    );
                }
            );
        }
    );
};

export const getAllCompletedVendorSettlements = (req, res) => {
    const sql = `
    SELECT
      vs.id AS settlement_id,
      vs.booking_id,
      vs.vendor_id,

      v.full_name AS vendor_name,
      v.phone AS vendor_phone,
      v.shop_name,
      v.upi_id,

      u.name AS user_name,
      u.phone AS user_mobile,
      

      b.booking_number,
      b.total_amount,
      b.booking_status,
      b.payment_status,
      b.balance_payment_status,

      COALESCE(adv.advance_paid, 0) AS advance_paid,
      COALESCE(bal.balance_paid, 0) AS balance_paid,
      (COALESCE(adv.advance_paid, 0) + COALESCE(bal.balance_paid, 0)) AS total_paid_user,

      COALESCE(rs.total_received, 0) AS razorpay_settlement,
      COALESCE(rs.total_fee, 0) AS razorpay_fee,
      COALESCE(rs.total_tax, 0) AS razorpay_tax,

      vs.total_received,
      vs.platform_commission_percent,
      vs.platform_commission_amount,
      vs.vendor_amount,

      vs.settlement_status,
      vs.settled_at,
      vs.created_at

    FROM vendor_settlements vs

    JOIN bookings b ON b.id = vs.booking_id
    JOIN vendors v ON v.id = vs.vendor_id
    JOIN users u ON u.id = b.user_id

    LEFT JOIN (
      SELECT booking_id, SUM(amount) AS advance_paid
      FROM payments
      WHERE payment_type = 'advance'
      GROUP BY booking_id
    ) adv ON adv.booking_id = b.id

    LEFT JOIN (
      SELECT booking_id, SUM(amount) AS balance_paid
      FROM payments
      WHERE payment_type = 'balance'
      GROUP BY booking_id
    ) bal ON bal.booking_id = b.id

    LEFT JOIN (
      SELECT
        booking_id,
        SUM(net_amount) AS total_received,
        SUM(fee) AS total_fee,
        SUM(tax) AS total_tax
      FROM razorpay_settlements
      GROUP BY booking_id
    ) rs ON rs.booking_id = b.id

   WHERE b.booking_status = 'completed'

    ORDER BY vs.created_at DESC
  `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database error",
                error: err,
            });
        }

        return res.status(200).json({
            success: true,
            data: results,
        });
    });
};

// cancel by user

export const createPlatformProfit = (bookingId) => {

    vendorSettlementModel.getCancelledUserBooking(
        bookingId,
        (err, result) => {

            if (err || result.length === 0) return;

            const booking = result[0];

            if (booking.booking_status !== "cancelled_by_user")
                return;

            if (Number(booking.settlement_count) === 0)
                return;

            vendorSettlementModel.checkPlatformProfit(
                bookingId,
                (err2, exist) => {

                    if (err2) return;

                    if (exist.length > 0) return;

                    vendorSettlementModel.createPlatformProfit(
                        booking.id,
                        booking.user_id,
                        booking.vendor_id,
                        booking.total_received,
                        () => {

                            console.log("Platform Profit Created");
                        }
                    );

                }
            );

        }
    );

};

//cancel by vendor

export const creditUserWallet = (bookingId) => {

    vendorSettlementModel.getVendorCancelledBooking(

        bookingId,

        (err, result) => {

            if (err || result.length === 0) return;

            const booking = result[0];

            if (booking.booking_status !== "cancelled_by_vendor")
                return;

            if (Number(booking.settlement_count) === 0)
                return;

            vendorSettlementModel.checkWalletEntry(

                bookingId,

                (err2, exist) => {

                    if (err2) return;

                    if (exist.length > 0) return;

                    vendorSettlementModel.creditWallet(
                        booking.user_id,
                        booking.vendor_id,
                        booking.id,
                        booking.total_received,
                        (err3) => {

                            if (err3) {
                                console.log(err3);
                                return;
                            }

                            console.log("Wallet Credited");
                        }
                    );

                }

            );

        }

    );

};

// ==== Process settlement controller - Inserts data into the appropriate settlement table ===== //

export const processSettlement = async (bookingId) => {

    const booking = await new Promise((resolve, reject) => {
        vendorSettlementModel.getBookingSettlementData(bookingId, (err, res) => {
            if (err) return reject(err);
            resolve(res[0]);
        });
    });

    if (!booking) return;

    // SUCCESS BOOKING
    if (booking.booking_status === "completed") {
        checkAndCreateVendorSettlement(bookingId);
        console.log("vendor table inserted");
    }

    // USER CANCEL
    else if (booking.booking_status === "cancelled_by_user") {
        createPlatformProfit(bookingId);
        console.log("platform table inserted");
    }

    // VENDOR CANCEL
    else if (booking.booking_status === "cancelled_by_vendor") {
        creditUserWallet(bookingId);
        console.log("wallet table inserted");
    }
};

// list for the platform profit

export const getPlatformProfitList = (req, res) => {

    const sql = `
        SELECT

            pp.id,
            pp.booking_id,
            b.booking_number,

            pp.user_id,
            u.name AS user_name,
            u.phone AS user_phone,

            pp.vendor_id,
            v.full_name AS vendor_name,
            v.shop_name,
            v.phone AS vendor_phone,
            v.upi_id,

            b.total_amount,
            b.booking_status,
            b.payment_status,
            b.balance_payment_status,

            pp.amount,
            pp.reason,
            pp.created_at

        FROM platform_profits pp

        JOIN bookings b
            ON b.id = pp.booking_id

        JOIN users u
            ON u.id = pp.user_id

        JOIN vendors v
            ON v.id = pp.vendor_id

        ORDER BY pp.created_at DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error",
                error: err
            });
        }

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });

    });

};

// list of the wallet 

export const getUserWalletList = (req, res) => {

    const sql = `
        SELECT

            uw.id,
            uw.booking_id,
            b.booking_number,

            uw.user_id,
            u.name AS user_name,
            u.phone AS user_phone,

            uw.vendor_id,
            v.full_name AS vendor_name,
            v.shop_name,
            v.phone AS vendor_phone,
            v.upi_id,

            b.total_amount,
            b.booking_status,
            b.payment_status,
            b.balance_payment_status,

            uw.amount,
            uw.type,
            uw.reason,
            uw.status,

            uw.created_at

        FROM user_wallet uw

        JOIN bookings b
            ON b.id = uw.booking_id

        JOIN users u
            ON u.id = uw.user_id

        JOIN vendors v
            ON v.id = uw.vendor_id

        ORDER BY uw.created_at DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error",
                error: err
            });
        }

        return res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });

    });

};


// updating the settlement status

export const updateVendorSettlementStatus = (req, res) => {
  const { bookingId } = req.params;

  const sql = `
    UPDATE vendor_settlements
    SET
      settlement_status = 'paid',
      settled_at = NOW()
    WHERE booking_id = ?
      AND settlement_status = 'pending'
  `;

  db.query(sql, [bookingId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found or already paid",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vendor settlement marked as paid successfully.",
    });
  });
};


export const updateActivityVendorSettlementStatus = (req, res) => {
  const { bookingId } = req.params;

  const sql = `
    UPDATE activity_vendor_settlements
    SET
      settlement_status = 'paid',
      settled_at = NOW()
    WHERE activity_booking_id = ?
      AND settlement_status = 'pending'
  `;

  db.query(sql, [bookingId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found or already paid",
      });
    }

    res.status(200).json({
      success: true,
      message: "Activity vendor settlement marked as paid successfully.",
    });
  });
};