import express from "express";
import {
  registerVendor, getVendorList, getServiceCategories, getSubServices, getVendorDetails,
  getVendorsByCategory, vendorLogin, getVendorBookings, updateBookingStatus,
  vendorForgotPassword, vendorVerifyResetOtp, vendorResetPassword, updateVendorUpiId, getVendorUpi,
  getTopRatedVendorList, registerActivityVendor, getActivityCategories, getActivityVendors,
  registerNearbyStall, getNearbyStalls, updateStallStatus, getStallDetails
} from "../controllers/vendorController.js";

import { uploadGovId } from "../middlewares/upload.js";
import { adminLogin } from "../controllers/adminController.js";
import {
  getAllCompletedVendorSettlements, getPlatformProfitList,
  getUserWalletList, updateVendorSettlementStatus,
  updateActivityVendorSettlementStatus
} from "../controllers/vendorSettlementController.js";
import { compressImage } from "../middlewares/compressImage.js";

import { getNearbyStallProfitList ,getPlatformProfitSummary } from "../controllers/nearbyStallProfitController.js"

const router = express.Router();

router.post( "/vendorregister", uploadGovId.fields([{ name: "profilePhoto", maxCount: 1 },]), compressImage, registerVendor); // register the vendor

router.post( "/register-activity", uploadGovId.fields([{ name: "profilePhoto", maxCount: 1 }]), compressImage, registerActivityVendor);

router.post("/vendor/login", vendorLogin);

router.get("/list-vendors", getVendorList); // List all vendors

router.get("/list-categories", getServiceCategories); //List for the categories

router.get("/sub-services/:categoryId", getSubServices); // List for the subservice based on the category id 

router.get("/single-vendor/:vendorId", getVendorDetails); // vendor id based vendor list

router.get("/vendors/category/:categoryId", getVendorsByCategory); // category id based vendor list 

router.get("/bookings-user/:vendor_id", getVendorBookings);  // vendor id based vendor booking list

router.put("/booking-status/:booking_id", updateBookingStatus); // vendor id based vendor booking list

router.post("/vendor/forgot-password", vendorForgotPassword);

router.post("/vendor/verify-reset-otp", vendorVerifyResetOtp);

router.post("/vendor/reset-password", vendorResetPassword);

router.post("/super-login", adminLogin);

router.post("/update-upi", updateVendorUpiId);

router.get("/upi/:vendorId", getVendorUpi);

router.get("/admin/vendor-settlements", getAllCompletedVendorSettlements);

router.get("/platform-profit-list", getPlatformProfitList);

router.get("/user-wallet-list", getUserWalletList);

router.get("/top-rated-vendors", getTopRatedVendorList);

router.get(
  "/activity-categories",
  getActivityCategories
);

router.get("/activity-vendors/:activityName", getActivityVendors);


router.post( "/near-register", uploadGovId.fields([ { name: "profile_photo", maxCount: 1 }, { name: "profile_photo2", maxCount: 1 }, { name: "profile_photo3", maxCount: 1 }]), compressImage, registerNearbyStall);



router.get("/near-list", getNearbyStalls);

router.get( "/nearby-stall-profit-list", getNearbyStallProfitList);

router.get("/platform-profit-summary", getPlatformProfitSummary);

router.get("/:id", getStallDetails);

router.put("/status-near", updateStallStatus);

router.put("/vendor-settlement/pay/:bookingId", updateVendorSettlementStatus);

router.put("/activity-vendor-settlement/pay/:bookingId", updateActivityVendorSettlementStatus);



export default router;

