import express from "express";

import { createActivityBooking,  getUserActivityBookings, updateActivityBookingStatus,  getAllActivityVendors , nearbyStallList} from "../controllers/activityBookingController.js";
import { getAllActivityVendorSettlements } from "../controllers/activityVendorSettlementController.js";


const router = express.Router();

router.post("/create", createActivityBooking);

router.get("/user-act/:user_id", getUserActivityBookings);

router.put("/update-status", updateActivityBookingStatus);

router.get("/admin/activity-bookings", getAllActivityVendors);

router.get("/nearby-stalls", nearbyStallList);

router.get( "/activity-vendor-settlements", getAllActivityVendorSettlements);

export default router;