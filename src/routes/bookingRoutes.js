import express from "express";
import { verifyPaymentAndCreateBooking } from "../controllers/paymentController.js";
import { updateBookingStatus, getUserBookingsFull, getAllBookings, getUserWalletBalance, createBooking } from "../controllers/bookingController.js";

const router = express.Router();

// Payment verify + booking create
router.post("/verify-payment", verifyPaymentAndCreateBooking);

router.post("/update-status", updateBookingStatus);

router.get("/booking-list/:user_id", getUserBookingsFull);

router.get("/bookings-admin", getAllBookings);

router.get("/wallet/balance/:user_id", getUserWalletBalance);

router.post("/create", createBooking);

export default router;