import { sendMail } from "../models/sendMail.js";

export const razorpayWebhook = async (req, res) => {
    try {

        const body = req.body.toString();

        console.log(body);

        await sendMail(
            "Razorpay Webhook Received",
            body
        );

        return res.status(200).json({
            success: true
        });

    } catch (error) {

        await sendMail(
            "Webhook Error",
            error.stack
        );

        return res.status(500).json({
            success: false
        });
    }
};