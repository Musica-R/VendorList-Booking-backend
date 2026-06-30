import activityVendorSettlementModel from "../models/activitysettlement.js";

export const processActivitySettlement = (razorpayPaymentId) => {

    activityVendorSettlementModel.getActivityBooking(
        razorpayPaymentId,
        (err, result) => {

            if (err) {
                console.log(err);
                return;
            }

            if (result.length === 0) {
                return;
            }

            const booking = result[0];

            // Payment must be paid
            if (booking.payment_status !== "paid") {
                return;
            }

            activityVendorSettlementModel.getSettlement(
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

                    activityVendorSettlementModel.checkSettlementExists(
                        booking.id,
                        (err3, existing) => {

                            if (err3) {
                                console.log(err3);
                                return;
                            }

                            if (existing.length > 0) {
                                return;
                            }

                            const totalReceived = Number(settlement.net_amount);

                            const commission =
                                +(totalReceived * 0.10).toFixed(2);

                            const vendorAmount =
                                +(totalReceived - commission).toFixed(2);

                            activityVendorSettlementModel.createSettlement(
                                booking.id,
                                booking.activity_vendor_id,
                                totalReceived,
                                commission,
                                vendorAmount,
                                (err4) => {

                                    if (err4) {
                                        console.log(err4);
                                        return;
                                    }

                                    console.log(
                                        `Activity Vendor Settlement Created for Booking ${booking.id}`
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


export const getAllActivityVendorSettlements = (req, res) => {
    activityVendorSettlementModel.getAllActivityVendorSettlements((err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch settlements",
            });
        }

        res.status(200).json({
            success: true,
            message: "Settlements fetched successfully",
            data: results,
        });
    });
};