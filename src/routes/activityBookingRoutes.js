import express from "express";

import {
  createActivityBooking,
  getUserActivityBookings,
  updateActivityBookingStatus,
} from "../controllers/activityBookingController.js";

const router = express.Router();

router.post("/create", createActivityBooking);

router.get("/user-act/:user_id", getUserActivityBookings);

router.put("/update-status", updateActivityBookingStatus);

export default router;