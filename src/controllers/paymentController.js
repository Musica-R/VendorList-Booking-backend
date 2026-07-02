import Razorpay from "razorpay";
import "dotenv/config";
import crypto from "crypto";
import bookingModel from "../models/bookingModel.js";
import bookingItemModel from "../models/bookingItemModel.js";
import paymentModel from "../models/paymentModel.js";
import db from "../config/db.js";
import { checkAndCreateVendorSettlement } from "../controllers/vendorSettlementController.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: Math.round(amount * 100),// rupees → paise
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const verifyPaymentAndCreateBooking = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingData,
      bookingType, // frontend sends full booking data
    } = req.body;

    console.log("razorpay-orderid", razorpay_order_id);
    console.log("razorpay-paymentid", razorpay_payment_id);
    console.log("razorpay-signature", razorpay_signature);
    console.log("bookingdata", bookingData);
    console.log("Category ID Received:", bookingData.category_id);

    // 1. VERIFY SIGNATURE
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Activity booking
    if (bookingType === "activity") {
      return res.status(200).json({
        success: true,
        message: "Payment Verified"
      });
    }

    // 2. CREATE BOOKING
    const booking_number = "BK" + Date.now();

    const [walletResult] = await db.promise().query(
      `SELECT 
      COALESCE(
        SUM(
          CASE
            WHEN type='credit' THEN amount
            WHEN type='debit' THEN -amount
          END
        ), 0
      ) AS balance
   FROM user_wallet
   WHERE user_id = ?`,
      [bookingData.user_id]
    );

    const wallet_balance = walletResult[0].balance;

    // VALIDATION
    if (bookingData.wallet_used > wallet_balance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance"
      });
    }

    const booking = await new Promise((resolve, reject) => {
      bookingModel.createBooking(
        {
          booking_number,
          user_id: bookingData.user_id,
          vendor_id: bookingData.vendor_id,
          customer_name: bookingData.customer_name,
          customer_phone: bookingData.customer_phone,
          customer_address: bookingData.customer_address,
          booking_date: bookingData.booking_date,
          booking_time: bookingData.booking_time,
          total_amount: bookingData.total_amount,
          payment_status: "paid",
          booking_status: "pending",
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    const bookingId = booking.insertId;

    setImmediate(() => {
      checkAndCreateVendorSettlement(bookingId);
    });

    // 3. CREATE BOOKING ITEMS
    for (let item of bookingData.services) {
      await new Promise((resolve, reject) => {
        bookingItemModel.createBookingItem(
          {
            booking_id: bookingId,
            category_id: bookingData.category_id,
            sub_service_id: item.sub_service_id,
            price: item.price,
            quantity: 1,
          },
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    // 4. SAVE PAYMENT
    await new Promise((resolve, reject) => {
      paymentModel.createPayment(
        {
          booking_id: bookingId,
          user_id: bookingData.user_id,
          vendor_id: bookingData.vendor_id,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          amount: bookingData.final_amount,
          payment_status: "paid",
          payment_type: "balance"
        },
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 5. WALLET DEBIT LOGIC (IF USED)
    if (bookingData.wallet_used > 0) {

      await new Promise((resolve, reject) => {
        db.query(
          `INSERT INTO user_wallet
      (
        user_id,
        vendor_id,
        booking_id,
        amount,
        type,
        reason,
        status
      )
      VALUES (?, ?, ?, ?, 'debit', 'Wallet Used For Booking', 'completed')`,
          [
            bookingData.user_id,
            bookingData.vendor_id,
            bookingId,
            bookingData.wallet_used
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

    }

    // 5. RESPONSE
    return res.status(200).json({
      success: true,
      message: "Booking Created Successfully",
      bookingId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createBalanceOrder = async (req, res) => {
  const { amount } = req.body;

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: "balance_" + Date.now(),
  });

  res.json({
    success: true,
    order,
  });
};

// wallet only logic


export const createWalletOnlyBooking = async (req, res) => {
  try {
    const bookingData = req.body;

    const [walletResult] = await db.promise().query(
      `SELECT COALESCE(SUM(CASE WHEN type='credit' THEN amount WHEN type='debit' THEN -amount END),0) AS balance
       FROM user_wallet WHERE user_id = ?`,
      [bookingData.user_id]
    );
    const wallet_balance = walletResult[0].balance;

    if (bookingData.total_amount > wallet_balance) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    const booking_number = "BK" + Date.now();

    const booking = await new Promise((resolve, reject) => {
      bookingModel.createBooking(
        {
          booking_number,
          user_id: bookingData.user_id,
          vendor_id: bookingData.vendor_id,
          customer_name: bookingData.customer_name,
          customer_phone: bookingData.customer_phone,
          customer_address: bookingData.customer_address,
          booking_date: bookingData.booking_date,
          booking_time: bookingData.booking_time,
          total_amount: bookingData.total_amount,
          payment_status: "paid",
          booking_status: "pending",
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });

    const bookingId = booking.insertId;

    for (let item of bookingData.services) {
      await new Promise((resolve, reject) => {
        bookingItemModel.createBookingItem(
          {
            booking_id: bookingId,
            category_id: bookingData.category_id,
            sub_service_id: item.sub_service_id,
            price: item.price,
            quantity: 1,
          },
          (err) => (err ? reject(err) : resolve())
        );
      });
    }

    // Wallet debit for the FULL amount — no payments row at all
    await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO user_wallet (user_id, vendor_id, booking_id, amount, type, reason, status)
         VALUES (?, ?, ?, ?, 'debit', 'Wallet Used For Booking (Full)', 'completed')`,
        [bookingData.user_id, bookingData.vendor_id, bookingId, bookingData.total_amount],
        (err) => (err ? reject(err) : resolve())
      );
    });

    return res.status(200).json({ success: true, message: "Booking Created Successfully", bookingId });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


export const verifyBalancePayment = async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id,
      amount,
    } = req.body;

    if (
      !booking_id ||
      !amount ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify Razorpay Signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    await connection.beginTransaction();

    // Get booking
    const [bookingRows] = await connection.query(
      `SELECT * FROM bookings WHERE id = ?`,
      [booking_id]
    );

    if (bookingRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking = bookingRows[0];

    // Prevent duplicate payment processing
    const [existingPayment] = await connection.query(
      `SELECT id FROM payments WHERE razorpay_payment_id = ?`,
      [razorpay_payment_id]
    );

    if (existingPayment.length > 0) {
      await connection.rollback();

      return res.status(200).json({
        success: true,
        message: "Payment already processed",
      });
    }

    // Store payment record
    await connection.query(
      `INSERT INTO payments (
          booking_id,
          user_id,
          vendor_id,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          amount,
          payment_status,
          payment_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        booking_id,
        booking.user_id,
        booking.vendor_id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount,
        "paid",
        "balance",
      ]
    );

    // Mark balance as paid
    await connection.query(
      `UPDATE bookings
       SET balance_payment_status = 'paid'
       WHERE id = ?`,
      [booking_id]
    );

    await connection.commit();

    setImmediate(() => {
      checkAndCreateVendorSettlement(booking_id);
    });

    return res.status(200).json({
      success: true,
      message: "Balance payment successful",
    });

  } catch (err) {
    console.error("verifyBalancePayment error:", err);

    try {
      await connection.rollback();
    } catch (e) { }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });

  } finally {
    connection.release();
  }
};

export const getUserPayments = (req, res) => {
  const { user_id } = req.params;

  paymentModel.getPaymentsByUserId(user_id, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err,
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
};

export const getVendorPayments = (req, res) => {
  const { vendor_id } = req.params;

  paymentModel.getPaymentsByVendorId(vendor_id, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error",
        error: err,
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
};


// controllers/razorpayWebhookController.js

export const razorpayWebhook = async (req, res) => {
  try {
    console.log("========== RAZORPAY WEBHOOK ==========");
    console.log("Headers:");
    console.log(req.headers);

    console.log("Body:");
    console.log(req.body.toString());

    console.log("======================================");

    return res.status(200).json({
      success: true,
      message: "Webhook received"
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false
    });
  }
};