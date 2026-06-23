import db from "../config/db.js";
import activityBookingModel from "../models/activityBookingModel.js";

// Create Activity Booking
export const createActivityBooking = (req, res) => {
    try {
        const {
            user_id,
            activity_vendor_id,
            activity_plan_id,
            customer_name,
            customer_phone,
            customer_address,
            booking_date,
            booking_time,
            total_amount,
            advance_amount,
            payment_status,
            booking_status,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        const booking_number = `ACT${Date.now()}`;

        const bookingData = {
            booking_number,
            user_id,
            activity_vendor_id,
            activity_plan_id,
            customer_name,
            customer_phone,
            customer_address,
            booking_date,
            booking_time,
            total_amount,
            advance_amount,

            payment_status: payment_status || "pending",
            booking_status: booking_status || "Pending",

            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        };

        activityBookingModel.createBooking(bookingData, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: "Booking Failed",
                });
            }

            return res.status(201).json({
                success: true,
                message: "Activity Booking Created Successfully",
                booking_id: result.insertId,
            });
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


export const getUserActivityBookings = (req, res) => {
    const { user_id } = req.params;

    const sql = `
  SELECT

      ab.id AS booking_id,
      ab.booking_number,

      ab.customer_name,
      ab.customer_phone,

      av.id AS vendor_id,
      av.full_name,
      av.shop_name,
      av.profile_photo,
      av.phone,
      av.whatsapp_number,

      ac.activity_name,

      ap.plan_name,
      ap.amount,
      ap.advance_amount,

      ua.address_type,
      ua.flat,
      ua.area,
      ua.city,
      ua.state,
      ua.pincode,

      ab.booking_date,
      ab.booking_time,

      ab.total_amount,
      ab.advance_amount,

      ab.payment_status,
      ab.booking_status

  FROM activity_bookings ab

  LEFT JOIN activity_vendors av
      ON av.id = ab.activity_vendor_id

  LEFT JOIN activity_categories ac
      ON ac.id = av.activity_id

  LEFT JOIN activity_vendor_plans ap
      ON ap.id = ab.activity_plan_id

  LEFT JOIN user_addresses ua
      ON ua.id = ab.customer_address

  WHERE ab.user_id = ?

  ORDER BY ab.id DESC
  `;

    db.query(sql, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error",
            });
        }

        const bookings = results.map((row) => ({
            booking_id: row.booking_id,
            booking_number: row.booking_number,

            customer_name: row.customer_name,
            customer_phone: row.customer_phone,

            vendor_details: {
                vendor_id: row.vendor_id,
                vendor_name: row.full_name,
                shop_name: row.shop_name,
                activity_name: row.activity_name,
                vendor_profile: row.profile_photo
                    ? `${req.protocol}://${req.get("host")}/uploads/${row.profile_photo}`
                    : null,
                vendor_phone: row.phone,
                vendor_whatsapp: row.whatsapp_number,
            },

            plan: {
                plan_name: row.plan_name,
                amount: row.amount,
                advance_amount: row.advance_amount,
            },

            address: {
                address_type: row.address_type,
                flat: row.flat,
                area: row.area,
                city: row.city,
                state: row.state,
                pincode: row.pincode,
            },

            booking_date: row.booking_date,
            booking_time: row.booking_time,

            total_amount: row.total_amount,
            advance_amount: row.advance_amount,

            payment_status: row.payment_status,
            booking_status: row.booking_status,
        }));

        return res.status(200).json({
            success: true,
            data: bookings,
        });
    });
};


export const updateActivityBookingStatus = (req, res) => {
    const { booking_id, status } = req.body;

    db.query(
        `
    UPDATE activity_bookings
    SET booking_status = ?
    WHERE id = ?
    `,
        [status, booking_id],
        (err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Update Failed",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Booking Status Updated",
            });
        }
    );
};