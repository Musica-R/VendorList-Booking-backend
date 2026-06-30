import cron from "node-cron";
import { syncSettlement } from "./settlementController.js";

// mrg 8 am its trigger

cron.schedule("0 8 * * *", () => {

    console.log("Checking Razorpay Settlement...");

    syncSettlement();

});


// cron.schedule("*/1 * * * *", () => {

//     console.log("Checking Razorpay Settlement...");

//     syncSettlement();

// });