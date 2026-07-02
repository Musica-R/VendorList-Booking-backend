import express from "express";

import { createActivityBooking,  getUserActivityBookings, updateActivityBookingStatus,  getAllActivityVendors , nearbyStallList , activityBookingList} from "../controllers/activityBookingController.js";
import { getAllActivityVendorSettlements } from "../controllers/activityVendorSettlementController.js";


const router = express.Router();

router.post("/create", createActivityBooking);

router.get("/user-act/:user_id", getUserActivityBookings);

router.put("/update-status", updateActivityBookingStatus);

router.get("/admin/activity-bookings", getAllActivityVendors); // activity vendor list 

router.get("/nearby-stalls", nearbyStallList);

router.get( "/activity-vendor-settlements", getAllActivityVendorSettlements);

router.get("/activity-bookings", activityBookingList);


export default router;