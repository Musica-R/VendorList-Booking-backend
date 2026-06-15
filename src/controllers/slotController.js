import {
  getBookedSlots,
  getDisabledSlots,
} from "../models/slotModel.js";

//1. GENERATE TIME SLOTS

export const generateSlots = (startTime, endTime) => {
  const slots = [];

  let start = new Date(`2024-01-01 ${startTime}`);
  const end = new Date(`2024-01-01 ${endTime}`);

  while (start < end) {
    const time = start.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    slots.push(time);

    start.setMinutes(start.getMinutes() + 90); // 90 min slot
  }

  return slots;
};

//2. MERGE SLOT STATUS LOGIC

export const buildSlotResponse = (slots, booked, disabled) => {
  const bookedSet = new Set(booked.map(b => b.booking_time));
  const disabledSet = new Set(disabled.map(d => d.slot_time));

  return slots.map(time => {
    let status = "available";

    if (bookedSet.has(time)) status = "booked";
    else if (disabledSet.has(time)) status = "disabled";

    return { time, status };
  });
};

//API 1 — Vendor Dates

import db from "../config/db.js";
import { getDisabledDates } from "../models/slotModel.js";

export const getVendorDates = (req, res) => {
  const vendorId = req.params.vendorId;

  const sql = `SELECT availability FROM vendors WHERE id = ?`;

  db.query(sql, [vendorId], (err, result) => {
    if (err) return res.json({ success: false, error: err });

    if (result.length === 0) {
      return res.json({
        success: false,
        message: "Vendor not found",
      });
    }

    const availability = result[0].availability;

    getDisabledDates(vendorId, (err2, disabledRows) => {
      if (err2) {
        return res.json({ success: false, error: err2 });
      }

      console.log("DISABLED DATES:", disabledRows);

      const disabledSet = new Set(
        disabledRows.map(row => row.date)
      );

      const today = new Date();
      const dates = [];

      for (let i = 0; i < 10; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);

        const dateStr = d.toISOString().split("T")[0];
        const day = d.getDay();

        let isValid = false;

        if (availability === "all_days") {
          isValid = true;
        }

        if (availability === "weekdays") {
          isValid = day >= 1 && day <= 5;
        }

        if (availability === "weekends") {
          isValid = day === 0 || day === 6;
        }

        let status = isValid ? "available" : "disabled";

        // If manually disabled in DB, force disabled
        if (disabledSet.has(dateStr)) {
          status = "disabled";
        }

        dates.push({
          date: dateStr,
          status,
        });
      }

      res.json({
        success: true,
        data: dates,
      });
    });
  });
};
//API 2 — Vendor Slots 


export const getVendorSlots = (req, res) => {
  const { vendorId, date } = req.params;

  const vendorSql = `
    SELECT start_time, end_time
    FROM vendors
    WHERE id = ?
  `;

  db.query(vendorSql, [vendorId], (err, vendorResult) => {
    if (err) {
      return res.json({ success: false, error: err });
    }

    if (vendorResult.length === 0) {
      return res.json({
        success: false,
        message: "Vendor not found"
      });
    }

    const { start_time, end_time } = vendorResult[0];

    const slots = generateSlots(
      start_time.slice(0, 5),
      end_time.slice(0, 5)
    );

    getBookedSlots(vendorId, date, (err, booked) => {
      if (err) return res.json({ success: false, err });

      getDisabledSlots(vendorId, date, (err2, disabled) => {
        if (err2) return res.json({ success: false, err: err2 });

        const result = buildSlotResponse(
          slots,
          booked,
          disabled
        );

        res.json({
          success: true,
          data: result
        });
      });
    });
  });
};

//API 3 — Manage Date

import { disableDate, enableDate, checkDateBookings } from "../models/slotModel.js";

export const manageDate = (req, res) => {
  const { vendor_id, date, action, reason } = req.body;

  console.log("DATE RECEIVED:", date);


  if (action === "disable") {

    checkDateBookings(vendor_id, date, (err, rows) => {

      if (rows[0].total > 0) {
        return res.status(400).json({
          success: false,
          message: "This date cannot be disabled because bookings already exist for it."
        });
      }

      disableDate({ vendor_id, date, reason }, () => {
        res.json({
          success: true,
          message: "Date Disabled Successfully"
        });
      });

    });

  }
  else {
    enableDate(vendor_id, date, (err, result) => {

      console.log("ENABLE DATE RESULT:", result);

      res.json({
        success: true,
        affectedRows: result.affectedRows
      });

    });
  }
};

//API 4 — Manage Slot

import { disableSlot, enableSlot } from "../models/slotModel.js";

export const manageSlot = (req, res) => {
  const { vendor_id, date, slot_time, action, reason } = req.body;
  console.log(req.body);

  if (action === "disable") {
    disableSlot({ vendor_id, date, slot_time, reason }, () => {
      res.json({ success: true, message: "Slot Disabled Successfully" });
    });
  } else {
    enableSlot(vendor_id, date, slot_time, (err, result) => {

      console.log("DELETE RESULT", result);


      res.json({
        success: true,
        affectedRows: result.affectedRows
      });

    });
  }
};

//API 5 — SAFE BOOKING CHECK (CRITICAL)

export const checkSlotAvailable = (vendorId, date, time, callback) => {
  const sql = `
    SELECT id
    FROM bookings
    WHERE vendor_id = ?
    AND booking_date = ?
    AND booking_time = ?
    AND booking_status != 'cancelled'
    LIMIT 1
  `;

  db.query(sql, [vendorId, date, time], callback);
};

