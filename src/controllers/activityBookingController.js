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
            booking_status,
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
            booking_status: booking_status || "Pending",
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

      ua.address_type,
      ua.flat,
      ua.area,
      ua.city,
      ua.state,
      ua.pincode,

      ab.booking_date,
      ab.booking_time,

      ab.total_amount,
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


// get activity vendors list for the admin

export const getAllActivityVendors = (req, res) => {
    const sql = `
    SELECT
      av.id,
      av.full_name,
      av.shop_name,
      av.phone,
      av.whatsapp_number,
      av.activity_id,
      ac.activity_name,
      av.experience,
      av.address1,
      av.address2,
      av.city,
      av.pincode,
      av.profile_photo,
      av.start_time,
      av.end_time,
      av.average_rating,
      av.total_reviews,
      av.rating,
      av.upi_id,
      av.created_at,
      av.updated_at,
      av.availability
    FROM activity_vendors av
    LEFT JOIN activity_categories ac
      ON ac.id = av.activity_id
    ORDER BY av.id DESC
  `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                success: false,
                message: "Database Error",
            });
        }

        const vendors = results.map((vendor) => ({
            id: vendor.id,
            full_name: vendor.full_name,
            shop_name: vendor.shop_name,
            phone: vendor.phone,
            whatsapp_number: vendor.whatsapp_number,

            activity: {
                id: vendor.activity_id,
                name: vendor.activity_name,
            },

            experience: vendor.experience,

            address: {
                address1: vendor.address1,
                address2: vendor.address2,
                city: vendor.city,
                pincode: vendor.pincode,
            },

            profile_photo: vendor.profile_photo
                ? `${req.protocol}://${req.get("host")}/uploads/${vendor.profile_photo}`
                : null,

            working_hours: {
                start_time: vendor.start_time,
                end_time: vendor.end_time,
            },

            ratings: {
                average_rating: vendor.average_rating,
                total_reviews: vendor.total_reviews,
                rating: vendor.rating,
            },

            upi_id: vendor.upi_id,
            availability: vendor.availability,

            created_at: vendor.created_at,
            updated_at: vendor.updated_at,
        }));

        return res.status(200).json({
            success: true,
            total: vendors.length,
            data: vendors,
        });
    });
};

// near stall list 

export const nearbyStallList = (req, res) => {
    activityBookingModel.getNearbyStallList((err, results) => {
        if (err) {
            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Database Error",
            });
        }

        const stalls = results.map((stall) => ({
            id: stall.id,
            shop_name: stall.shop_name,
            phone: stall.phone,
            whatsapp_number: stall.whatsapp_number,
            email: stall.email,

            address: {
                address1: stall.address1,
                address2: stall.address2,
                city: stall.city,
                pincode: stall.pincode,
            },

            description: stall.description,

            google_map_link: stall.google_map_link,

            location: {
                latitude: stall.latitude,
                longitude: stall.longitude,
            },

            profile_photo: stall.profile_photo
                ? `${req.protocol}://${req.get("host")}/uploads/${stall.profile_photo}`
                : null,

            government_id: stall.government_id
                ? `${req.protocol}://${req.get("host")}/uploads/${stall.government_id}`
                : null,

            opening_time: stall.opening_time,
            closing_time: stall.closing_time,

            status: stall.status,
            is_verified: stall.is_verified,

            listing_fee: stall.listing_fee,
            payment_status: stall.payment_status,

            created_at: stall.created_at,
            updated_at: stall.updated_at,
        }));

        return res.status(200).json({
            success: true,
            message: "Nearby Stall List",
            total: stalls.length,
            data: stalls,
        });
    });
};

export const activityBookingList = (req, res) => {

    activityBookingModel.getActivityBookingList((err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error",
                error: err.message
            });
        }

        return res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    });

};



export const getActiveActivityVendors = (req, res) => {
    const sql = `
        SELECT
            av.id,
            av.full_name,
            av.shop_name,
            av.phone,
            av.whatsapp_number,

            ac.id AS activity_id,
            ac.activity_name,

            av.experience,
            av.address1,
            av.address2,
            av.city,
            av.pincode,

            av.profile_photo,

            av.start_time,
            av.end_time,

            av.average_rating,
            av.total_reviews,
            av.rating,

            av.upi_id,
            av.availability,

            av.created_at,
            av.updated_at,

            ap.id AS plan_id,
            ap.plan_name,
            ap.amount,
            ap.advance_amount,
            ap.status

        FROM activity_vendors av

        LEFT JOIN activity_categories ac
            ON ac.id = av.activity_id

        LEFT JOIN activity_vendor_plans ap
            ON ap.vendor_id = av.id

        WHERE ap.status = 'Active'

        ORDER BY av.id DESC;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error",
                error: err.message,
            });
        }

        const vendorsMap = {};

        results.forEach((row) => {
            if (!vendorsMap[row.id]) {
                vendorsMap[row.id] = {
                    id: row.id,
                    full_name: row.full_name,
                    shop_name: row.shop_name,
                    phone: row.phone,
                    whatsapp_number: row.whatsapp_number,

                    activity: {
                        id: row.activity_id,
                        name: row.activity_name,
                    },

                    experience: row.experience,

                    address: {
                        address1: row.address1,
                        address2: row.address2,
                        city: row.city,
                        pincode: row.pincode,
                    },

                    profile_photo: row.profile_photo
                        ? `${req.protocol}://${req.get("host")}/uploads/${row.profile_photo}`
                        : null,

                    working_hours: {
                        start_time: row.start_time,
                        end_time: row.end_time,
                    },

                    ratings: {
                        average_rating: row.average_rating,
                        total_reviews: row.total_reviews,
                        rating: row.rating,
                    },

                    upi_id: row.upi_id,
                    availability: row.availability,

                    created_at: row.created_at,
                    updated_at: row.updated_at,

                    plans: [],
                };
            }

            if (row.plan_id) {
                vendorsMap[row.id].plans.push({
                    id: row.plan_id,
                    plan_name: row.plan_name,
                    amount: row.amount,
                    advance_amount: row.advance_amount,
                    status: row.status,
                });
            }
        });

        const vendors = Object.values(vendorsMap);

        return res.status(200).json({
            success: true,
            total: vendors.length,
            data: vendors,
        });
    });
};