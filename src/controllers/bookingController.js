import db from "../config/db.js";

export const updateBookingStatus = (req, res) => {
  try {
    const { booking_id, status } = req.body;

    const sql = `
      UPDATE bookings
      SET booking_status = ?
      WHERE id = ?
    `;

    db.query(sql, [status, booking_id], (err) => {
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
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}; // no used any where 

export const getUserBookingsFull = (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT 
      b.id AS booking_id,
      b.booking_number,
      b.customer_name,
      b.customer_phone,
      b.vendor_id,

      v.id AS vendor_id,
      v.full_name,
      v.shop_name,
      v.category_id,
      v.profile_photo,

      s.category_name,

      ua.id AS address_id,
      ua.address_type,
      ua.flat,
      ua.area,
      ua.city,
      ua.state,
      ua.pincode,

      b.booking_date,
      b.booking_time,
      b.total_amount,
      b.booking_status,
      b.payment_status,
      b.balance_amount,
      b.balance_payment_status,

      bi.id AS item_id,
      bi.sub_service_id,
      bi.price,
      bi.quantity,
      ss.service_name

    FROM bookings b

    LEFT JOIN vendors v 
      ON v.id = b.vendor_id

    LEFT JOIN service_categories s 
      ON s.id = v.category_id  

    LEFT JOIN user_addresses ua 
      ON ua.id = b.customer_address

    LEFT JOIN booking_items bi 
      ON bi.booking_id = b.id

    LEFT JOIN sub_services ss 
      ON ss.id = bi.sub_service_id

    WHERE b.user_id = ?
    ORDER BY b.id DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Error fetching bookings",
      });
    }

    const bookingsMap = {};

    results.forEach((row) => {
      if (!bookingsMap[row.booking_id]) {
        bookingsMap[row.booking_id] = {
          booking_id: row.booking_id,
          booking_number: row.booking_number,
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,

          vendor_details: {
            vendor_id: row.vendor_id,
            vendor_name: row.full_name,
            shop_name: row.shop_name,
            vendor_cat: row.category_id,
            vendor_profile: row.profile_photo
              ? `${req.protocol}://${req.get("host")}/uploads/${row.profile_photo}`
              : null,
            category_name: row.category_name,
          },

          address: {
            address_id: row.address_id,
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
          booking_status: row.booking_status,
          payment_status: row.payment_status,

          // ✅ IMPORTANT ADDED FIELDS
          balance_amount: row.balance_amount,
          balance_payment_status: row.balance_payment_status,

          payment: null, // ✅ will be filled safely if needed

          items: [],
        };
      }

      const booking = bookingsMap[row.booking_id];

      // ✅ ADD PAYMENT ONLY ONCE (prevents duplication)
      if (!booking.payment && row.payment_id) {
        booking.payment = {
          payment_id: row.payment_id,
          razorpay_payment_id: row.razorpay_payment_id,
          paid_amount: row.paid_amount,
        };
      }

      // ✅ ADD ITEMS WITHOUT DUPLICATION
      if (row.item_id) {
        const exists = booking.items.some(
          (item) => item.item_id === row.item_id
        );

        if (!exists) {
          booking.items.push({
            item_id: row.item_id,
            sub_service_id: row.sub_service_id,
            sub_service_name: row.service_name,
            price: row.price,
            quantity: row.quantity,
          });
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: Object.values(bookingsMap),
    });
  });
};