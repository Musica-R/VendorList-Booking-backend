import vendorModel from "../models/vendorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { checkAndCreateVendorSettlement } from "../controllers/vendorSettlementController.js";
import crypto from "crypto";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const registerVendor = async (req, res) => {
    const {
        fullName,
        shopName,
        phone,
        whatsapp_number,
        category_id,
        experience,
        address1,
        address2,
        city,
        pincode,
        availability,
        start_time,
        end_time,
    } = req.body;


    const profilePhoto = req.files?.profilePhoto
        ? req.files.profilePhoto[0].filename
        : null;

    // =========================
    // VALIDATION
    // =========================
    if (!fullName || !phone || !category_id) {
        return res.status(400).json({
            success: false,
            message: "Full Name, Phone and Category are required",
        });
    }


    if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
            success: false,
            message: "Phone number must be 10 digits",
        });
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
        return res.status(400).json({
            success: false,
            message: "Pincode must be 6 digits",
        });
    }



    // =========================
    // CHECK DUPLICATE VENDOR
    // =========================
    vendorModel.findVendorByPhone(phone, (err, vendors) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error",
            });
        }

        if (vendors.length > 0) {
            const vendor = vendors[0];


            if (vendor.phone === phone) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number already registered",
                });
            }
        }

        // =========================
        // VENDOR DATA (NEW TABLE)
        // =========================
        const vendorData = {
            fullName,
            shopName,
            phone,
            whatsappNumber: whatsapp_number || phone,
            categoryId: category_id,
            experience,
            address1,
            address2,
            city,
            pincode,
            profilePhoto,
            availability,
            startTime: start_time,
            endTime: end_time,
        };
        // =========================
        // INSERT VENDOR
        // =========================
        vendorModel.createVendor(vendorData, (err, result) => {
            if (err) {
                console.error(err);

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({
                        success: false,
                        message: "Phone number already registered"
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Vendor Registration Failed"
                });
            }


            const vendorId = result.insertId;

            // =========================
            // PARSE SERVICES
            // =========================
            let parsedServices = [];

            try {
                parsedServices =
                    typeof req.body.services === "string"
                        ? JSON.parse(req.body.services)
                        : req.body.services;
            } catch (e) {
                parsedServices = [];
            }

            // =========================
            // IF NO SERVICES
            // =========================
            if (!parsedServices || parsedServices.length === 0) {
                return res.status(201).json({
                    success: true,
                    message: "Vendor Registered Successfully (No services added)",
                    vendorId,
                });
            }

            // =========================
            // INSERT SERVICES
            // =========================
            const saveServices = (index = 0) => {

                if (index >= parsedServices.length) {

                    return res.status(201).json({
                        success: true,
                        message: "Vendor Registered Successfully",
                        vendorId
                    });

                }

                const service = parsedServices[index];

                // Existing service
                if (service.sub_service_id) {

                    return vendorModel.addVendorService(

                        vendorId,
                        service.sub_service_id,
                        service.price,

                        (err) => {

                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: err.message
                                });
                            }

                            saveServices(index + 1);

                        }

                    );

                }

                // Custom service

                vendorModel.findSubServiceByName(

                    category_id,
                    service.service_name,

                    (err, rows) => {

                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });
                        }

                        if (rows.length > 0) {

                            return vendorModel.addVendorService(

                                vendorId,
                                rows[0].id,
                                service.price,

                                (err) => {

                                    if (err) {
                                        return res.status(500).json({
                                            success: false,
                                            message: err.message
                                        });
                                    }

                                    saveServices(index + 1);

                                }

                            );

                        }

                        vendorModel.addCustomSubService(

                            category_id,
                            service.service_name,

                            (err, result) => {

                                if (err) {
                                    return res.status(500).json({
                                        success: false,
                                        message: err.message
                                    });
                                }

                                vendorModel.addVendorService(

                                    vendorId,
                                    result.insertId,
                                    service.price,

                                    (err) => {

                                        if (err) {
                                            return res.status(500).json({
                                                success: false,
                                                message: err.message
                                            });
                                        }

                                        saveServices(index + 1);

                                    }

                                );

                            }

                        );

                    }

                );

            };

            saveServices();
        });
    });
};

//2. list the vendors

export const getVendorList = (req, res) => {
    vendorModel.getAllVendors((err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error",
            });
        }

        const vendors = {};

        rows.forEach((row) => {
            if (!vendors[row.id]) {
                vendors[row.id] = {
                    id: row.id,
                    full_name: row.full_name,
                    shop_name: row.shop_name,
                    phone: row.phone,
                    whatsapp_number: row.whatsapp_number,
                    category_id: row.category_id,
                    category_name: row.category_name,
                    experience: row.experience,
                    address1: row.address1,
                    address2: row.address2,
                    city: row.city,
                    pincode: row.pincode,
                    profile_photo: row.profile_photo,
                    profile_url: row.profile_photo
                        ? `${req.protocol}://${req.get("host")}/uploads/${row.profile_photo}`
                        : null,
                    average_rating: row.average_rating,
                    total_reviews: row.total_reviews,
                    availability: row.availability,
                    start_time: row.start_time,
                    end_time: row.end_time,
                    rating: row.rating,
                    upi_id: row.upi_id,
                    created_at: row.created_at,

                    services: [],
                };
            }

            if (row.sub_service_id) {
                vendors[row.id].services.push({
                    vendor_service_id: row.vendor_service_id,
                    sub_service_id: row.sub_service_id,
                    service_name: row.service_name,
                    price: row.price,
                });
            }
        });

        res.status(200).json({
            success: true,
            vendors: Object.values(vendors),
        });
    });
};

// 3. List the categroy list

export const getServiceCategories = (req, res) => {
    vendorModel.getServiceCategories((err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        res.status(200).json({
            success: true,
            categories: results
        });
    });
};

//4. sub categories result 

export const getSubServices = (req, res) => {
    const { categoryId } = req.params;

    if (!categoryId) {
        return res.status(400).json({
            success: false,
            message: "Category ID is required",
        });
    }

    // Step 1: get category from model
    vendorModel.getCategoryById(categoryId, (err, categoryResult) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error",
            });
        }

        if (categoryResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const category = categoryResult[0];

        // Step 2: get sub services
        vendorModel.getSubServicesByCategoryId(categoryId, (err, results) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error",
                });
            }

            return res.status(200).json({
                success: true,
                category: category.category_name,
                categoryId: category.id,
                subServices: results,
            });
        });
    });
};

// 5. single Vendor completed details

export const getVendorDetails = (req, res) => {
    const { vendorId } = req.params;

    if (!vendorId) {
        return res.status(400).json({
            success: false,
            message: "Vendor ID is required"
        });
    }

    vendorModel.getVendorDetails(vendorId, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        const vendor = {
            id: results[0].vendor_id,
            full_name: results[0].full_name,
            shop_name: results[0].shop_name,
            phone: results[0].phone,
            whatsapp_number: results[0].whatsapp_number,
            experience: results[0].experience,
            address1: results[0].address1,
            address2: results[0].address2,
            city: results[0].city,
            pincode: results[0].pincode,
            availability: results[0].availability,
            start_time: results[0].start_time,
            end_time: results[0].end_time,

            profile_url: results[0].profile_photo
                ? `${req.protocol}://${req.get("host")}/uploads/${results[0].profile_photo}`
                : null,

            category: {
                id: results[0].category_id,
                name: results[0].category_name
            },

            services: results.map(service => ({
                sub_service_id: service.sub_service_id,
                service_name: service.service_name,
                price: service.price
            }))
        };

        return res.status(200).json({
            success: true,
            vendor
        });
    });
};


// List the vendors based on their category

export const getVendorsByCategory = (req, res) => {
    const { categoryId } = req.params;

    if (!categoryId) {
        return res.status(400).json({
            success: false,
            message: "Category ID is required",
        });
    }

    // Get Category Details
    vendorModel.getCategoryById(categoryId, (err, categoryResult) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error",
            });
        }

        if (categoryResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const category = categoryResult[0];

        // Get Vendors
        vendorModel.getVendorsByCategoryId(categoryId, (err, vendors) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error",
                });
            }

            const updatedVendors = vendors.map((vendor) => ({
                ...vendor,
                profile_url: vendor.profile_photo
                    ? `${req.protocol}://${req.get("host")}/uploads/${vendor.profile_photo}`
                    : null,
            }));

            return res.status(200).json({
                success: true,

                category: {
                    id: category.id,
                    name: category.category_name,
                },

                total: updatedVendors.length,

                vendors: updatedVendors,
            });
        });
    });
};


export const vendorLogin = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and Password are required"
        });
    }

    vendorModel.findVendorByEmail(email, async (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        const vendor = result[0];

        const isPasswordValid = await bcrypt.compare(
            password,
            vendor.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid Password"
            });
        }

        const token = jwt.sign(
            {
                vendorId: vendor.id,
                email: vendor.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            vendor: {
                id: vendor.id,
                full_name: vendor.full_name,
                shop_name: vendor.shop_name,
                email: vendor.email,
                phone: vendor.phone,
                profile_photo: vendor.profile_photo
            }
        });
    });
};

export const getVendorBookings = async (req, res) => {
    const { vendor_id } = req.params;

    const sql = `
    SELECT
      b.id AS booking_id,
      b.booking_number,
      b.booking_date,
      b.booking_time,
      b.total_amount,
      b.booking_status,
      b.payment_status,
      b.balance_amount,
b.balance_payment_status,

      u.id AS user_id,
      u.name AS user_name,
      u.phone AS user_phone,
      u.profileImage,

      ua.id AS address_id,
      ua.address_type,
      ua.flat,
      ua.area,
      ua.city,
      ua.state,
      ua.pincode,

      sc.category_name,
      ss.service_name,

      bi.id AS item_id,
      bi.price AS service_price

    FROM bookings b

    LEFT JOIN users u ON b.user_id = u.id
    LEFT JOIN user_addresses ua ON b.customer_address = ua.id
    LEFT JOIN booking_items bi ON b.id = bi.booking_id
    LEFT JOIN service_categories sc ON bi.category_id = sc.id
    LEFT JOIN sub_services ss ON bi.sub_service_id = ss.id

    WHERE b.vendor_id = ?

    ORDER BY b.created_at DESC
  `;

    db.query(sql, [vendor_id], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error",
                error: err.message,
            });
        }

        const bookings = {};

        result.forEach((row) => {
            if (!bookings[row.booking_id]) {
                bookings[row.booking_id] = {
                    booking_id: row.booking_id,
                    booking_number: row.booking_number,
                    booking_date: row.booking_date,
                    booking_time: row.booking_time,
                    total_amount: row.total_amount,
                    booking_status: row.booking_status,
                    payment_status: row.payment_status,

                    balance_amount: row.balance_amount,
                    balance_payment_status: row.balance_payment_status,

                    user_id: row.user_id,
                    user_name: row.user_name,
                    user_phone: row.user_phone,
                    profileImage: row.profileImage,

                    address: {
                        address_id: row.address_id,
                        address_type: row.address_type,
                        flat: row.flat,
                        area: row.area,
                        city: row.city,
                        state: row.state,
                        pincode: row.pincode,
                    },

                    services: [],
                    payment: null, // ✅ IMPORTANT
                };
            }

            const booking = bookings[row.booking_id];

            // ✅ prevent duplicate services
            const exists = booking.services.some(
                (s) =>
                    s.category_name === row.category_name &&
                    s.service_name === row.service_name
            );

            if (!exists && row.service_name) {
                booking.services.push({
                    category_name: row.category_name,
                    service_name: row.service_name,
                    service_price: row.service_price,
                });
            }
        });

        const finalData = Object.values(bookings);

        // 🔥 SECOND QUERY → payments (NO duplication)

        const bookingIds = finalData.map((b) => b.booking_id);

        db.query(
            `SELECT * FROM payments WHERE booking_id IN (?)`,
            [bookingIds],
            (err2, payments) => {
                if (!err2 && payments) {
                    payments.forEach((p) => {
                        if (bookings[p.booking_id]) {
                            bookings[p.booking_id].payment = {
                                payment_id: p.id,
                                razorpay_payment_id: p.razorpay_payment_id,
                                amount: p.amount,
                                payment_status: p.payment_status,
                            };
                        }
                    });
                }

                return res.status(200).json({
                    success: true,
                    totalBookings: finalData.length,
                    data: Object.values(bookings),
                });
            }
        );
    });
};

export const updateBookingStatus = (req, res) => {
    const { booking_id } = req.params;
    const { booking_status, balance_amount } = req.body;

    const allowedStatuses = [
        "pending",
        "completed",
        "cancelled_by_user",
        "cancelled_by_vendor"
    ];

    if (!allowedStatuses.includes(booking_status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status",
        });
    }

    if (booking_status === "completed") {
        const sql = `
            UPDATE bookings
            SET
                booking_status = ?,
                balance_amount = COALESCE(?, balance_amount),
                balance_payment_status = 'pending'
            WHERE id = ?
        `;

        db.query(
            sql,
            [booking_status, balance_amount, booking_id],
            (err) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Database error",
                    });
                }

                return res.json({
                    success: true,
                    message: "Booking marked as completed",
                });

                setImmediate(() => {
                    checkAndCreateVendorSettlement(booking_id);
                });
            }
        );
    } else {
        const sql = `
            UPDATE bookings
            SET booking_status = ?
            WHERE id = ?
        `;

        db.query(sql, [booking_status, booking_id], (err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error",
                });
            }

            return res.json({
                success: true,
                message: "Booking updated successfully",
            });

            setImmediate(() => {
                checkAndCreateVendorSettlement(booking_id);
            });

        });
    }
};


export const vendorForgotPassword = (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required",
        });
    }

    vendorModel.findVendorByEmailS(email, (err, vendors) => {
        if (err) {
            return res.status(500).json({ success: false, message: "DB Error" });
        }

        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        vendorModel.saveVendorOtp(email, otp, otpExpires, async (err2) => {
            if (err2) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to save OTP",
                });
            }

            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: "Vendor Password Reset OTP",
                    html: `
            <h2>Vendor Password Reset</h2>
            <p>Your OTP is:</p>
            <h1>${otp}</h1>
            <p>Valid for 10 minutes</p>
          `,
                });

                return res.status(200).json({
                    success: true,
                    message: "OTP sent successfully",
                });
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: "Email sending failed",
                });
            }
        });
    });
};

export const vendorVerifyResetOtp = (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: "Email and OTP required",
        });
    }

    vendorModel.findVendorByEmailS(email, (err, vendors) => {
        if (err) {
            return res.status(500).json({ success: false, message: "DB Error" });
        }

        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
        }

        const vendor = vendors[0];

        if (vendor.otp_code !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        if (new Date(vendor.otp_expires) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP expired",
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
        });
    });
};

export const vendorResetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Email and new password required",
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        vendorModel.updateVendorPassword(email, hashedPassword, (err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Password update failed",
                });
            }

            return res.status(200).json({
                success: true,
                message: "Password reset successfully",
            });
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Hashing failed",
        });
    }
};


// upi id updated

export const updateVendorUpiId = (req, res) => {
    const { vendorId, upiId } = req.body;

    if (!vendorId || !upiId) {
        return res.status(400).json({
            success: false,
            message: "Vendor ID and UPI ID are required",
        });
    }

    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/;

    if (!upiRegex.test(upiId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid UPI ID",
        });
    }

    vendorModel.updateVendorUpiId(
        vendorId,
        upiId,
        (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({
                        success: false,
                        message: "UPI ID already exists",
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: "Database error",
                    error: err.message,
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Vendor not found",
                });
            }

            res.status(200).json({
                success: true,
                message: "UPI ID updated successfully",
            });
        }
    );
};


export const getVendorUpi = (req, res) => {
    const { vendorId } = req.params;

    vendorModel.getVendorUpi(vendorId, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database error",
                error: err.message,
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found",
            });
        }

        res.status(200).json({
            success: true,
            upi_id: result[0].upi_id,
        });
    });
};


// limit three vendor list 

export const getTopRatedVendorList = (req, res) => {
    vendorModel.getTopRatedVendors((err, vendors) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error",
            });
        }

        const updatedVendors = vendors.map((vendor) => ({
            ...vendor,
            profile_url: vendor.profile_photo
                ? `${req.protocol}://${req.get("host")}/uploads/${vendor.profile_photo}`
                : null,
        }));

        res.status(200).json({
            success: true,
            vendors: updatedVendors,
        });
    });
};


export const registerActivityVendor = async (req, res) => {
    const {
        fullName,
        shopName,
        phone,
        whatsapp_number,
        activity_id,
        experience,
        address1,
        address2,
        city,
        pincode,
        availability,
        start_time,
        end_time
    } = req.body;

    const profilePhoto = req.files?.profilePhoto
        ? req.files.profilePhoto[0].filename
        : null;

    // Validation
    if (!fullName || !phone || !activity_id) {
        return res.status(400).json({
            success: false,
            message: "Full Name, Phone and Activity are required"
        });
    }

    vendorModel.findActivityVendorByPhone(phone, (err, vendors) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        if (vendors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Phone already exists"
            });
        }

        const vendorData = {
            fullName,
            shopName,
            phone,
            whatsappNumber: whatsapp_number || phone,
            activityId: activity_id,
            experience,
            address1,
            address2,
            city,
            pincode,
            profilePhoto,
            availability,
            startTime: start_time,
            endTime: end_time
        };

        vendorModel.createActivityVendor(vendorData, (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Vendor Registration Failed",
                    error: err.message
                });
            }

            const vendorId = result.insertId;

            let plans = [];

            try {
                plans = typeof req.body.plans === "string"
                    ? JSON.parse(req.body.plans)
                    : req.body.plans;
            } catch {
                plans = [];
            }

            if (!plans || plans.length === 0) {
                return res.status(201).json({
                    success: true,
                    message: "Activity Vendor Registered Successfully",
                    vendorId
                });
            }

            vendorModel.insertVendorPlans(vendorId, plans, (err2) => {

                if (err2) {
                    return res.status(500).json({
                        success: false,
                        message: "Vendor created but plans failed"
                    });
                }

                return res.status(201).json({
                    success: true,
                    message: "Activity Vendor Registered Successfully",
                    vendorId
                });

            });

        });

    });

};

export const getActivityCategories = (req, res) => {

    vendorModel.getActivityCategories((err, results) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        return res.status(200).json({
            success: true,
            categories: results
        });

    });

};


export const getActivityVendors = (req, res) => {
    const { activityName } = req.params;

    vendorModel.getActivityVendors(activityName, (err, rows) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error",
                error: err.message,
            });
        }

        const vendors = {};

        rows.forEach((row) => {
            if (!vendors[row.id]) {
                vendors[row.id] = {
                    id: row.id,
                    full_name: row.full_name,
                    shop_name: row.shop_name,
                    phone: row.phone,
                    email: row.email,
                    activity_id: row.activity_id,
                    activity_name: row.activity_name,
                    experience: row.experience,
                    address1: row.address1,
                    address2: row.address2,
                    city: row.city,
                    pincode: row.pincode,
                    business_description: row.business_description,
                    languages_known: row.languages_known,
                    availability: row.availability,
                    start_time: row.start_time,
                    end_time: row.end_time,
                    average_rating: row.average_rating,
                    profile_photo_url: row.profile_photo
                        ? `${req.protocol}://${req.get("host")}/uploads/vendor/profile/${row.profile_photo}`
                        : null,
                    government_id_url: row.government_id
                        ? `${req.protocol}://${req.get("host")}/uploads/vendor/government/${row.government_id}`
                        : null,
                    plans: []
                };
            }

            if (row.plan_id) {
                vendors[row.id].plans.push({
                    id: row.plan_id,
                    plan_name: row.plan_name,
                    amount: row.amount,
                    advance_amount: row.advance_amount
                });
            }
        });

        res.status(200).json({
            success: true,
            vendors: Object.values(vendors)
        });
    });
};


export const registerNearbyStall = async (req, res) => {
    try {
        const {
            shop_name,
            phone,
            whatsapp_number,
            address1,
            address2,
            city,
            pincode,
            description,
            google_map_link,
            latitude,
            longitude,
            opening_time,
            closing_time
        } = req.body;

        // ==========================
        // VALIDATION
        // ==========================

        if (!shop_name) {
            return res.status(400).json({
                success: false,
                message: "Shop name is required"
            });
        }

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Phone number must be 10 digits"
            });
        }

        if (pincode && !/^\d{6}$/.test(pincode)) {
            return res.status(400).json({
                success: false,
                message: "Pincode must be 6 digits"
            });
        }

        // ==========================
        // FILES (Optional)
        // ==========================

        const profile_photo =
            req.files?.profile_photo?.[0]?.filename || null;

        const profile_photo2 =
            req.files?.profile_photo2?.[0]?.filename || null;

        const profile_photo3 =
            req.files?.profile_photo3?.[0]?.filename || null;

        // ==========================
        // CHECK DUPLICATE
        // ==========================

        db.query(
            "SELECT id FROM nearby_stalls WHERE phone = ?",
            [phone],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Database Error",
                        error: err.message
                    });
                }

                if (result.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Phone number already registered"
                    });
                }

                // ==========================
                // INSERT
                // ==========================

                const sql = `
                    INSERT INTO nearby_stalls (
    shop_name,
    phone,
    whatsapp_number,
    address1,
    address2,
    city,
    pincode,
    description,
    google_map_link,
    latitude,
    longitude,
    profile_photo,
    profile_photo2,
    profile_photo3,
    opening_time,
    closing_time,
    status
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                db.query(
                    sql,
                    [
                        shop_name,
                        phone,
                        whatsapp_number || phone,
                        address1,
                        address2,
                        city,
                        pincode,
                        description,
                        google_map_link,
                         latitude,
                         longitude,
                        profile_photo,
                        profile_photo2,
                        profile_photo3,
                        opening_time,
                        closing_time,
                        "pending"
                    ],
                    (err, insertResult) => {

                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: "Registration Failed",
                                error: err.message
                            });
                        }

                        return res.status(201).json({
                            success: true,
                            message: "Nearby Stall Registered Successfully. Waiting for Admin Approval.",
                            stall_id: insertResult.insertId
                        });

                    }
                );
            }
        );

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });

    }
};

export const getNearbyStalls = (req, res) => {

    const sql = `
        SELECT *
        FROM nearby_stalls
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "DB Error"
            });
        }

        const data = result.map((s) => ({
            ...s,
            profile_url: s.profile_photo
                ? `${req.protocol}://${req.get("host")}/uploads/${s.profile_photo}`
                : null,
            profile_url2: s.profile_photo
                ? `${req.protocol}://${req.get("host")}/uploads/${s.profile_photo2}`
                : null,
            profile_url3: s.profile_photo
                ? `${req.protocol}://${req.get("host")}/uploads/${s.profile_photo3}`
                : null,
        }));

        return res.status(200).json({
            success: true,
            stalls: data
        });
    });
};

export const updateStallStatus = (req, res) => {
    const { id, status } = req.body;

    const allowed = ["pending", "approved", "active", "rejected"];

    if (!allowed.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status"
        });
    }

    const sql = `
        UPDATE nearby_stalls
        SET status = ?
        WHERE id = ?
    `;

    db.query(sql, [status, id], (err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "DB Error"
            });
        }

        return res.status(200).json({
            success: true,
            message: `Stall status updated to ${status}`
        });
    });
};

export const getStallDetails = (req, res) => {
    const { id } = req.params;

    db.query(
        `SELECT * FROM nearby_stalls WHERE id = ?`,
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "DB Error"
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Not found"
                });
            }

            const stall = result[0];

            stall.profile_url = stall.profile_photo
                ? `${req.protocol}://${req.get("host")}/uploads/${stall.profile_photo}`
                : null;

            return res.status(200).json({
                success: true,
                stall
            });
        }
    );
};


