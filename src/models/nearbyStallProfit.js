import db from "../config/db.js";

const getNearbyStall = (razorpayPaymentId, callback) => {

    const sql = `
        SELECT
            id,
            listing_fee,
            payment_status,
            razorpay_payment_id
        FROM nearby_stalls
        WHERE razorpay_payment_id = ?
    `;

    db.query(sql, [razorpayPaymentId], callback);

};

const getSettlement = (razorpayPaymentId, callback) => {

    const sql = `
        SELECT
            razorpay_settlement_id,
            razorpay_payment_id,
            fee,
            tax,
            net_amount,
            settled_at
        FROM razorpay_settlements
        WHERE razorpay_payment_id = ?
    `;

    db.query(sql, [razorpayPaymentId], callback);

};

const checkProfitExists = (stallId, callback) => {

    const sql = `
        SELECT id
        FROM nearby_stall_profits
        WHERE stall_id = ?
    `;

    db.query(sql, [stallId], callback);

};

const createProfit = (
    stallId,
    settlementId,
    paymentId,
    listingFee,
    razorpayFee,
    razorpayTax,
    platformProfit,
    settledAt,
    callback
) => {

    const sql = `
        INSERT INTO nearby_stall_profits
        (
            stall_id,
            razorpay_settlement_id,
            razorpay_payment_id,
            listing_fee,
            razorpay_fee,
            razorpay_tax,
            platform_profit,
            settled_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            stallId,
            settlementId,
            paymentId,
            listingFee,
            razorpayFee,
            razorpayTax,
            platformProfit,
            settledAt
        ],
        callback
    );

};

const getAllNearbyStallProfits = (callback) => {

    const sql = `
        SELECT
            nsp.id,

            ns.id AS stall_id,
            ns.shop_name,
            ns.phone,
            ns.email,

            nsp.razorpay_settlement_id,
            nsp.razorpay_payment_id,

            nsp.listing_fee,
            nsp.razorpay_fee,
            nsp.razorpay_tax,
            nsp.platform_profit,

            nsp.settled_at,
            nsp.created_at

        FROM nearby_stall_profits nsp

        INNER JOIN nearby_stalls ns
            ON nsp.stall_id = ns.id

        ORDER BY nsp.id DESC
    `;

    db.query(sql, callback);

};


const getNearbyStallProfitByStallId = (stallId, callback) => {

    const sql = `
        SELECT
            nsp.id,
            nsp.stall_id,

            ns.shop_name,
            ns.phone,
            ns.email,
            ns.address1,
            ns.address2,

            nsp.razorpay_settlement_id,
            nsp.razorpay_payment_id,

            nsp.listing_fee,
            nsp.razorpay_fee,
            nsp.razorpay_tax,
            nsp.platform_profit,

            nsp.settled_at,
            nsp.created_at

        FROM nearby_stall_profits nsp

        INNER JOIN nearby_stalls ns
            ON nsp.stall_id = ns.id

        WHERE nsp.stall_id = ?
    `;

    db.query(sql, [stallId], callback);

};

const getNearbyStallProfitList = (callback) => {
    const query = `
        SELECT
            nsp.id,
            nsp.stall_id,
            ns.shop_name,
            ns.phone,
            ns.whatsapp_number,
            nsp.razorpay_settlement_id,
            nsp.razorpay_payment_id,
            nsp.listing_fee,
            nsp.razorpay_fee,
            nsp.razorpay_tax,
            nsp.platform_profit,
            nsp.settled_at,
            nsp.created_at
        FROM nearby_stall_profits nsp
        INNER JOIN nearby_stalls ns
            ON nsp.stall_id = ns.id
        ORDER BY nsp.created_at DESC
    `;

    db.query(query, callback);
};

const getPlatformProfitSummary = (callback) => {
    const sql = `
        SELECT
            (
                SELECT COALESCE(SUM(platform_commission_amount), 0)
                FROM vendor_settlements
            ) AS vendor_profit,

            (
                SELECT COALESCE(SUM(platform_commission_amount), 0)
                FROM activity_vendor_settlements
            ) AS activity_profit,

            (
                SELECT COALESCE(SUM(amount), 0)
                FROM platform_profits
            ) AS cancellation_profit,

            (
                SELECT COALESCE(SUM(platform_profit), 0)
                FROM nearby_stall_profits
            ) AS nearby_stall_profit
    `;

    db.query(sql, callback);
};


export default {
    getNearbyStall,
    getSettlement,
    checkProfitExists,
    createProfit,
    getAllNearbyStallProfits,
    getNearbyStallProfitByStallId,
    getNearbyStallProfitList,
    getPlatformProfitSummary,
};