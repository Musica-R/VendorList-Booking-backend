import axios from "axios";
import settlementModel from "../cron/settlementModel.js";
import { checkAndCreateVendorSettlement } from "../controllers/vendorSettlementController.js";
import { processSettlement } from "../controllers/vendorSettlementController.js"
import { processActivitySettlement } from "../controllers/activityVendorSettlementController.js"
import { processNearbyStallProfit } from "../controllers/nearbyStallProfitController.js";

export const syncSettlement = async () => {

    try {
        console.log("Settlement Sync Started");
        const today = new Date();

        // const year = today.getFullYear();
        // const month = String(today.getMonth() + 1).padStart(2, "0");
        // const day = String(today.getDate()).padStart(2, "0");

        const year = 2026;
        const month = "02";
        // const day = "26";

        const response = await axios.get(

            "https://api.razorpay.com/v1/settlements/recon/combined",

            {
                params: {
                    year,
                    month,
                },

                auth: {
                    username: process.env.RAZORPAY_KEY_ID,
                    password: process.env.RAZORPAY_KEY_SECRET
                }
            }

        );

        const settlements = response.data.items;
        console.log("settlements", settlements);

        for (const settlement of settlements) {

            const paymentId = settlement.entity_id;

            settlementModel.checkSettlementExists(
                paymentId,
                (err, exists) => {

                    if (err) return;

                    if (exists.length > 0) {

                        console.log("Already Exists");

                        return;
                    }

                    settlementModel.getPaymentDetails(
                        paymentId,
                        (err2, payment) => {

                            if (err2) return;

                            if (payment.length === 0) {

                                settlementModel.getActivityBookingByPaymentId(
                                    paymentId,
                                    (err4, activity) => {

                                        if (err4) return;

                                        if (activity.length === 0) {

                                            // 👇 Paste the entire Nearby Stall code here

                                            settlementModel.getNearbyStallByPaymentId(
                                                paymentId,
                                                (err5, stall) => {

                                                    if (err5) return;

                                                    if (stall.length === 0) {
                                                        console.log("Payment Not Found");
                                                        return;
                                                    }

                                                    const stallInfo = stall[0];

                                                    const data = {

                                                        razorpaySettlementId: settlement.settlement_id,

                                                        razorpayPaymentId: paymentId,

                                                        bookingId: stallInfo.id,

                                                        bookingType: "nearby_stall",

                                                        vendorId: null,

                                                        userId: null,

                                                        grossAmount: settlement.amount / 100,

                                                        fee: settlement.fee / 100,

                                                        tax: settlement.tax / 100,

                                                        netAmount: settlement.credit / 100,

                                                        settledAt: new Date(
                                                            settlement.settled_at * 1000
                                                        )

                                                    };

                                                    settlementModel.insertSettlement(
                                                        data,
                                                        (err6) => {

                                                            if (err6) {
                                                                console.log(err6);
                                                                return;
                                                            }

                                                            console.log(
                                                                `Nearby Stall Settlement Saved : ${paymentId}`
                                                            );

                                                            processNearbyStallProfit(paymentId);

                                                        }
                                                    );

                                                }
                                            );

                                            return;

                                        }

                                        const activityInfo = activity[0];

                                        const data = {

                                            razorpaySettlementId: settlement.settlement_id,

                                            razorpayPaymentId: paymentId,

                                            bookingId: activityInfo.id,

                                            bookingType: "activity",

                                            vendorId: activityInfo.activity_vendor_id,

                                            userId: activityInfo.user_id,

                                            grossAmount: settlement.amount / 100,

                                            fee: settlement.fee / 100,

                                            tax: settlement.tax / 100,

                                            netAmount: settlement.credit / 100,

                                            settledAt: new Date(
                                                settlement.settled_at * 1000
                                            )

                                        };

                                        settlementModel.insertSettlement(
                                            data,
                                            (err5) => {

                                                if (err5) {
                                                    console.log(err5);
                                                    return;
                                                }

                                                console.log(
                                                    `Activity Settlement Saved : ${paymentId}`
                                                );

                                                processActivitySettlement(paymentId);

                                            }
                                        );

                                    }
                                );

                                return;
                            }

                            const paymentInfo = payment[0];

                            const data = {

                                razorpaySettlementId: settlement.settlement_id,

                                razorpayPaymentId: paymentId,

                                bookingId: paymentInfo.booking_id,

                                bookingType: "service",

                                vendorId: paymentInfo.vendor_id,

                                userId: paymentInfo.user_id,

                                grossAmount: settlement.amount / 100,

                                fee: settlement.fee / 100,

                                tax: settlement.tax / 100,

                                netAmount: settlement.credit / 100,

                                settledAt: new Date(
                                    settlement.settled_at * 1000
                                )

                            };

                            settlementModel.insertSettlement(
                                data,
                                (err3) => {

                                    if (err3) {

                                        console.log(err3);

                                        return;
                                    }

                                    console.log(
                                        `Settlement Saved : ${paymentId}`
                                    );

                                    processSettlement(paymentInfo.booking_id);
                                }
                            );

                        }
                    );

                }
            );

        }

    } catch (error) {

        console.log(error.response?.data || error.message);

    }

};