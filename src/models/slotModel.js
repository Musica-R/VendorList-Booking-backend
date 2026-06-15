import db from "../config/db.js";

//GET DISABLED DATES

export const getDisabledDates = (vendorId, callback) => {
  const sql = `
    SELECT DATE_FORMAT(date,'%Y-%m-%d') as date
    FROM vendor_disabled_dates
    WHERE vendor_id = ?
  `;

  db.query(sql, [vendorId], callback);
};

//2. GET DISABLED SLOTS

export const getDisabledSlots = (vendorId, date, callback) => {
  const sql = `
    SELECT slot_time 
    FROM vendor_disabled_slots 
    WHERE vendor_id = ? AND date = ?
  `;

  db.query(sql, [vendorId, date], callback);
};

//3. DISABLE DATE

export const disableDate = (data, callback) => {
  const sql = `
    INSERT INTO vendor_disabled_dates (vendor_id, date, reason)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [data.vendor_id, data.date, data.reason], callback);
};

//4. ENABLE DATE

export const enableDate = (vendorId, date, callback) => {
  const sql = `
    DELETE FROM vendor_disabled_dates
    WHERE vendor_id = ? AND date = ?
  `;

  db.query(sql, [vendorId, date], callback);
};

//5. DISABLE SLOT

export const disableSlot = (data, callback) => {
  const sql = `
    INSERT INTO vendor_disabled_slots (vendor_id, date, slot_time, reason)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [data.vendor_id, data.date, data.slot_time, data.reason], callback);
};

//6. ENABLE SLOT

export const enableSlot = (vendorId, date, slot_time, callback) => {
  const sql = `
    DELETE FROM vendor_disabled_slots
    WHERE vendor_id = ? AND date = ? AND slot_time = ?
  `;

  db.query(sql, [vendorId, date, slot_time], callback);
};

//7. GET BOOKINGS (IMPORTANT)

export const getBookedSlots = (vendorId, date, callback) => {
  const sql = `
    SELECT booking_time 
    FROM bookings
    WHERE vendor_id = ?
    AND booking_date = ?
    AND booking_status != 'cancelled'
  `;

  db.query(sql, [vendorId, date], callback);
};


//check the date is booked are not  to disable

export const checkDateBookings = (vendorId, date, callback) => {
  const sql = `
    SELECT COUNT(*) as total
    FROM bookings
    WHERE vendor_id = ?
    AND booking_date = ?
    AND booking_status != 'cancelled'
  `;

  db.query(sql, [vendorId, date], callback);
};