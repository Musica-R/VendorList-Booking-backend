import db from "../config/db.js";
import adminModel from "../models/adminModel.js";
import bookingModel from "../models/bookingModel.js";
import bookingItemModel from "../models/bookingItemModel.js";

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
      v.phone,
      v.whatsapp_number,

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

    // console.log(results.map(r => r.booking_id));

    const bookingsMap = new Map();

    results.forEach((row) => {
      if (!bookingsMap.has(row.booking_id)) {
        bookingsMap.set(row.booking_id, {
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
            vendor_phone: row.phone,
            vendor_whatsapp: row.whatsapp_number,
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
      
          items: [],
        });
      }

      const booking = bookingsMap.get(row.booking_id);

  
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

   const data = [...bookingsMap.values()];

// console.log("Final response:", data.map(b => b.booking_id));

return res.status(200).json({
  success: true,
  data,
});

  });
};

export const getAllBookings = (req, res) => {
  adminModel.getAllBookings((err, bookings) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database Error",
      });
    }

    return res.status(200).json({
      success: true,
      totalBookings: bookings.length,
      bookings,
    });
  });
};

// user wallet using get logic

export const getUserWalletBalance = (req, res) => {

  try {

    const { user_id } = req.params;

    const sql = `
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'credit' THEN amount
                            WHEN type = 'debit' THEN -amount
                        END
                    ),
                    0
                ) AS wallet_balance
            FROM user_wallet
            WHERE user_id = ?
            AND status = 'completed'
        `;

    db.query(sql, [user_id], (err, result) => {

      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database Error"
        });
      }

      return res.status(200).json({
        success: true,
        wallet_balance: Number(result[0].wallet_balance)
      });

    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};



export const createBooking = async (req, res) => {
  try {
    const bookingData = req.body;

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
          booking_status: "pending",
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    const bookingId = booking.insertId;

    // Insert booking items
    for (const item of bookingData.services) {
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

    return res.status(200).json({
      success: true,
      bookingId,
      bookingNumber: booking_number,
      message: "Booking Created Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};