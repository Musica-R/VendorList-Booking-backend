import express from "express";
import { razorpayWebhook } from "../controllers/razorpayWebhookController.js";

const router = express.Router();

router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

export default router;