import express from "express";
import {
  registerVendor, getVendorList, getServiceCategories, getSubServices, getVendorDetails,
  getVendorsByCategory, vendorLogin, getVendorBookings, updateBookingStatus, 
 vendorForgotPassword,vendorVerifyResetOtp ,vendorResetPassword } from "../controllers/vendorController.js";
import { uploadGovId } from "../middlewares/upload.js";

const router = express.Router();

router.post(
  "/vendorregister",
  uploadGovId.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "governmentId", maxCount: 1 }
  ]),
  registerVendor
); // register the vendor

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


export default router;

