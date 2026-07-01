import { checkAndCreateVendorSettlement ,createPlatformProfit ,creditUserWallet } from "../controllers/vendorSettlementController.js"
import { processActivitySettlement } from "../controllers/activityVendorSettlementController.js";
import { processNearbyStallProfit } from "../controllers/nearbyStallProfitController.js";

// checkAndCreateVendorSettlement(20);
// // createPlatformProfit(3);
// creditUserWallet(15);
processActivitySettlement("pay_T5nqfW2oM0yL7s");
processNearbyStallProfit("pay_T8AxiYUHMsqJ1U");