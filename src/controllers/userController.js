import userModel from "../models/userModel.js";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import db from "../config/db.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// console.log("EMAIL_USER:", process.env.EMAIL_USER);
// console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

// 1. Resgister logic

export const registerUser = (req, res) => {
  const { name, email, password, phone, location } = req.body;
  const profileImage = req.file ? req.file.filename : null;

  // Validation
  if (!name || !email || !password || !phone || !location) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  // Password validation
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  // Phone validation
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "Phone number must be exactly 10 digits",
    });
  }

  // Check existing email or phone
  userModel.findUserByEmailOrPhone(email, phone, async (err, existingUsers) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database Error",
      });
    }

    if (existingUsers.length > 0) {
      const user = existingUsers[0];

      if (user.email === email) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }

      if (user.phone === phone) {
        return res.status(400).json({
          success: false,
          message: "Phone number already registered",
        });
      }
    }

    try {
      // 🔐 HASH PASSWORD (FIXED)
      const hashedPassword = await bcrypt.hash(password, 10);

      const userData = {
        name,
        email,
        password: hashedPassword, // ✅ IMPORTANT FIX
        phone,
        location,
        profileImage,
      };

      userModel.createUser(userData, (err, result) => {
        if (err) {
          console.log(err);

          return res.status(500).json({
            success: false,
            message: "Registration Failed",
          });
        }

        return res.status(201).json({
          success: true,
          message: "User Registered Successfully",
          userId: result.insertId,
        });
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Password hashing failed",
      });
    }
  });
};

// 2. Login Function 

export const loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and Password are required",
    });
  }

  userModel.findUserByEmail(email, async (err, users) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database Error",
      });
    }

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    const user = users[0];

    try {
      // 🔐 COMPARE HASHED PASSWORD
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid Password",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Login Successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          profileImage: user.profileImage
            ? `${req.protocol}://${req.get("host")}/uploads/${user.profileImage}`
            : null,
        },
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Login error",
      });
    }
  });
};
// 3. update Profile Function

export const updateUserProfile = (req, res) => {
  const userId = req.params.id;
  const { name, email, phone, location } = req.body;

  if (!name || !email || !phone || !location) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "Phone number must be exactly 10 digits",
    });
  }

  const userData = {
    name,
    email,
    phone,
    location,
  };

  userModel.updateUser(userId, userData, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Profile Update Failed",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
    });
  });
};

// 4. VERIFY REGISTER OTP API

export const verifyRegisterOtp = (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  userModel.findUserByEmail(email, (err, users) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database Error",
      });
    }

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    if (user.otp_code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (new Date(user.otp_expires) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP Expired",
      });
    }

    userModel.verifyUser(email, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Verification Failed",
        });
      }

      res.status(200).json({
        success: true,
        message: "Email Verified Successfully",
      });
    });
  });
};


// 5. FORGOT PASSWORD API

export const forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  userModel.findUserByEmail(email, async (err, users) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database Error",
      });
    }

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    userModel.saveOtp(
      email,
      otp,
      otpExpires,
      async (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to save OTP",
          });
        }

        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset OTP",
            html: `
              <h2>Password Reset</h2>
              <p>Your OTP is:</p>
              <h1>${otp}</h1>
              <p>This OTP is valid for 10 minutes.</p>
            `,
          });

          res.status(200).json({
            success: true,
            message: "OTP sent successfully",
          });
        } catch (error) {
          console.log(error);

          res.status(500).json({
            success: false,
            message: "Failed to send email",
          });
        }
      }
    );
  });
};

// 6. VERIFY RESET OTP API

export const verifyResetOtp = (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  userModel.findUserByEmail(email, (err, users) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database Error",
      });
    }

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    if (user.otp_code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (new Date(user.otp_expires) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP Expired",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP Verified Successfully",
    });
  });
};

// 7. RESET PASSWORD API (Needed After Verify OTP)

export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Email and New Password are required",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    userModel.updatePassword(email, hashedPassword, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Password Update Failed",
        });
      }

      res.status(200).json({
        success: true,
        message: "Password Updated Successfully",
      });
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Hashing failed",
    });
  }
};

export const getUsers = (req, res) => {
  userModel.getAllUsers((err, users) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database Error"
      });
    }

    const updatedUsers = users.map((user) => ({
      ...user,
      profileImageUrl: user.profileImage
        ? `${req.protocol}://${req.get("host")}/uploads/${user.profileImage}`
        : null
    }));

    return res.status(200).json({
      success: true,
      totalUsers: updatedUsers.length,
      users: updatedUsers
    });
  });
};

// user dashboard count table 

export const getUserDashboard = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Total Bookings
    const [totalBookings] = await db.promise().query(
      `SELECT COUNT(*) AS totalBookings
       FROM bookings
       WHERE user_id = ?`,
      [user_id]
    );

    // Completed Bookings
    const [completedBookings] = await db.promise().query(
      `SELECT COUNT(*) AS completedBookings
       FROM bookings
       WHERE user_id = ?
       AND booking_status = 'completed'`,
      [user_id]
    );

    // Saved Vendors
    const [savedVendors] = await db.promise().query(
      `SELECT COUNT(*) AS savedVendors
       FROM favorite_vendors
       WHERE user_id = ?`,
      [user_id]
    );

    // Wallet Balance
    const [wallet] = await db.promise().query(
      `SELECT
          COALESCE(
            SUM(
              CASE
                WHEN type = 'credit' THEN amount
                WHEN type = 'debit' THEN -amount
                ELSE 0
              END
            ),
          0) AS walletAmount
       FROM user_wallet
       WHERE user_id = ?
       AND status = 'completed'`,
      [user_id]
    );

    return res.status(200).json({
      success: true,
      data: {
        totalBookings: totalBookings[0].totalBookings,
        completedBookings: completedBookings[0].completedBookings,
        savedVendors: savedVendors[0].savedVendors,
        walletAmount: wallet[0].walletAmount
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

// user wallet histoty 


import { getUserWalletHistory } from "../models/userModel.js";

export const userWalletHistory = (req, res) => {
  const { user_id } = req.params;

  getUserWalletHistory(user_id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database Error",
        error: err,
      });
    }

    return res.status(200).json({
      success: true,
      total_transactions: result.length,
      wallet_history: result,
    });
  });
};