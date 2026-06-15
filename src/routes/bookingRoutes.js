import express from "express";
import { verifyPaymentAndCreateBooking } from "../controllers/paymentController.js";
import { updateBookingStatus ,getUserBookingsFull } from "../controllers/bookingController.js";

const router = express.Router();

// Payment verify + booking create
router.post("/verify-payment", verifyPaymentAndCreateBooking);

// Update booking status (vendor/admin)
router.post("/update-status", updateBookingStatus);

router.get("/booking-list/:user_id", getUserBookingsFull);

export default router;