import express from "express";
import { createOrder, createBalanceOrder, verifyBalancePayment ,getUserPayments , getVendorPayments} from "../controllers/paymentController.js";

const router = express.Router();

// Create Razorpay Order
router.post("/create-order", createOrder);

router.post("/balance/order", createBalanceOrder);

// Verify Razorpay payment and update booking
router.post("/balance/verify", verifyBalancePayment);


// User payment history
router.get("/user-pay-history/:user_id", getUserPayments);

// Vendor payment history
router.get("/vendor-pay-history/:vendor_id", getVendorPayments);


export default router;