import nearbyStallProfitModel from "../models/nearbyStallProfit.js";

export const processNearbyStallProfit = (razorpayPaymentId) => {

    nearbyStallProfitModel.getNearbyStall(
        razorpayPaymentId,
        (err, result) => {

            if (err) {
                console.log(err);
                return;
            }

            if (result.length === 0) {
                return;
            }

            const stall = result[0];

            if (stall.payment_status !== "paid") {
                return;
            }

            nearbyStallProfitModel.getSettlement(
                razorpayPaymentId,
                (err2, settlementResult) => {

                    if (err2) {
                        console.log(err2);
                        return;
                    }

                    if (settlementResult.length === 0) {
                        return;
                    }

                    const settlement = settlementResult[0];

                    nearbyStallProfitModel.checkProfitExists(
                        stall.id,
                        (err3, existing) => {

                            if (err3) {
                                console.log(err3);
                                return;
                            }

                            if (existing.length > 0) {
                                return;
                            }

                            nearbyStallProfitModel.createProfit(

                                stall.id,

                                settlement.razorpay_settlement_id,
                                settlement.razorpay_payment_id,

                                stall.listing_fee,

                                settlement.fee,
                                settlement.tax,

                                settlement.net_amount,

                                settlement.settled_at,

                                (err4) => {

                                    if (err4) {
                                        console.log(err4);
                                        return;
                                    }

                                    console.log(
                                        `Nearby Stall Profit Created for Stall ${stall.id}`
                                    );

                                }

                            );

                        }
                    );

                }
            );

        }
    );

};

export const getAllNearbyStallProfits = (req, res) => {

    nearbyStallProfitModel.getAllNearbyStallProfits(
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to fetch nearby stall profits"
                });
            }

            res.status(200).json({
                success: true,
                message: "Nearby stall profits fetched successfully",
                data: results
            });

        }
    );

};


export const getNearbyStallProfitList = (req, res) => {

    nearbyStallProfitModel.getNearbyStallProfitList((err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch nearby stall profit list."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Nearby stall profit list fetched successfully.",
            data: results
        });
    });

};



export const getPlatformProfitSummary = (req, res) => {

    nearbyStallProfitModel.getPlatformProfitSummary((err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch platform profit summary."
            });
        }

        const data = results[0];

        const totalProfit =
            Number(data.vendor_profit) +
            Number(data.activity_profit) +
            Number(data.cancellation_profit) +
            Number(data.nearby_stall_profit);

        return res.status(200).json({
            success: true,
            data: {
                vendor_profit: Number(data.vendor_profit),
                activity_profit: Number(data.activity_profit),
                cancellation_profit: Number(data.cancellation_profit),
                nearby_stall_profit: Number(data.nearby_stall_profit),
                total_platform_profit: Number(totalProfit.toFixed(2))
            }
        });

    });

};