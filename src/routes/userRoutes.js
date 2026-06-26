import express from "express";
import { registerUser, loginUser, updateUserProfile, forgotPassword, verifyResetOtp, resetPassword, getUsers, getUserDashboard, userWalletHistory } from "../controllers/userController.js";
import { uploadGovId } from "../middlewares/upload.js";
import { addReview, vendorReviewList } from "../controllers/reviewController.js";


const router = express.Router();

// Register
router.post("/register", uploadGovId.single("profileImage"), registerUser);

// Login
router.post("/login", loginUser);

// Update Profile
router.put("/update/:id", updateUserProfile);

// Forgot Password - Send OTP
router.post("/forgot-password", forgotPassword);

// Verify Reset OTP
router.post("/verify-reset-otp", verifyResetOtp);

// Reset Password
router.post("/reset-password", resetPassword);

router.post("/add-review", addReview);

router.get("/vendor-rating/:vendorId", vendorReviewList);

// admin list 
router.get("/users-admin-list", getUsers);

// user dashboard count list 

router.get("/dashboard/:user_id", getUserDashboard);

router.get("/wallet-history/:user_id", userWalletHistory);

export default router;