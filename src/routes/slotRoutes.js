import express from "express";
import {
  getVendorDates,
  getVendorSlots,
  manageDate,
  manageSlot
} from "../controllers/slotController.js";

const router = express.Router();


// ==========================
// 🔵 VENDOR APIs
// ==========================

// Get next 10 vendor dates
router.get("/vendor-dates/:vendorId", getVendorDates);

// Get slots for selected date
router.get("/vendor-slots/:vendorId/:date", getVendorSlots);

// Disable / Enable date
router.post("/manage-date", manageDate);

// Disable / Enable slot
router.post("/manage-slot", manageSlot);

// Get available dates for booking
router.get("/booking/available-dates/:vendorId", getVendorDates);

// Get available slots for booking
router.get("/booking/available-slots/:vendorId/:date", getVendorSlots);


export default router;