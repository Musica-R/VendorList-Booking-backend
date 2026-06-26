import db from "../config/db.js";

const createVendor = (vendorData, callback) => {
  const sql = `
    INSERT INTO vendors (
      full_name,
      shop_name,
      phone,
      whatsapp_number,
      email,
      password,
      category_id,
      experience,
      address1,
      address2,
      city,
      pincode,
      profile_photo,
      government_id,
      business_description,
      languages_known,
      availability,
      start_time,
      end_time,
      terms_accepted,
      terms_accepted_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      vendorData.fullName,
      vendorData.shopName,
      vendorData.phone,
      vendorData.whatsappNumber,
      vendorData.email,
      vendorData.password,
      vendorData.categoryId,
      vendorData.experience,
      vendorData.address1,
      vendorData.address2,
      vendorData.city,
      vendorData.pincode,
      vendorData.profilePhoto,
      vendorData.governmentId,
      vendorData.businessDescription,
      vendorData.languagesKnown,
      vendorData.availability,
      vendorData.startTime,
      vendorData.endTime,
      vendorData.termsAccepted,
      vendorData.termsAcceptedAt,
    ],
    callback
  );
};


const findVendorByEmail = (email, callback) => {
  const sql = `
    SELECT *
    FROM vendors
    WHERE email = ?
  `;

  db.query(sql, [email], callback);
};

const getVendorById = (vendorId, callback) => {
  const sql = `
    SELECT *
    FROM vendors
    WHERE id = ?
  `;

  db.query(sql, [vendorId], callback);
};

const findVendorByEmailOrPhone = (email, phone, callback) => {
  const sql = `
    SELECT * FROM vendors
    WHERE email = ? OR phone = ?
  `;

  db.query(sql, [email, phone], callback);
};


// list the vendors

const getAllVendors = (callback) => {
  const sql = `
    SELECT
      v.id,
      v.full_name,
      v.shop_name,
      v.phone,
      v.whatsapp_number,
      v.email,
      v.category_id,
      sc.category_name,
      v.experience,
      v.address1,
      v.address2,
      v.city,
      v.pincode,
      v.profile_photo,
      v.government_id,
      v.business_description,
      v.languages_known,
      v.availability,
      v.start_time,
      v.end_time,
      v.rating,
      v.created_at,
      v.terms_accepted
    FROM vendors v
    LEFT JOIN service_categories sc
      ON v.category_id = sc.id
    ORDER BY v.id DESC
  `;

  db.query(sql, callback);
};

export const getServiceCategories = (callback) => {
  const sql = `
        SELECT id, category_name
        FROM service_categories
        ORDER BY id
    `;

  db.query(sql, callback);
};

export const getSubServicesByCategoryId = (categoryId, callback) => {
  const sql = `
    SELECT id, service_name
    FROM sub_services
    WHERE category_id = ?
    ORDER BY id
  `;

  db.query(sql, [categoryId], callback);
};

export const getCategoryById = (categoryId, callback) => {
  const sql = `
    SELECT id, category_name 
    FROM service_categories 
    WHERE id = ?
  `;

  db.query(sql, [categoryId], callback);
};

const insertVendorServices = (vendorId, services, callback) => {
  // services = [{ sub_service_id, price }, ...]

  const sql = `
    INSERT INTO vendor_services (vendor_id, sub_service_id, price)
    VALUES ?
  `;

  const values = services.map((s) => [
    vendorId,
    s.sub_service_id,
    s.price,
  ]);

  db.query(sql, [values], callback);
};

// for the single vendor completed details 4 Tables used to get this data 

const getVendorDetails = (vendorId, callback) => {
  const sql = `
        SELECT
            v.id AS vendor_id, 
            v.full_name,
            v.shop_name,
            v.phone,
            v.whatsapp_number,
            v.email,
            v.experience,
            v.address1,
            v.address2,
            v.city,
            v.pincode,
            v.profile_photo,
            v.government_id,
            v.business_description,
            v.languages_known,
            v.availability,
            v.start_time,
            v.end_time,

            s.id AS category_id,
            s.category_name,

            ss.id AS sub_service_id,
            ss.service_name,

            vs.price

        FROM vendors v

        LEFT JOIN service_categories s  
            ON s.id = v.category_id

        LEFT JOIN vendor_services vs
            ON vs.vendor_id = v.id

        LEFT JOIN sub_services ss
            ON ss.id = vs.sub_service_id

        WHERE v.id = ?
    `;

  db.query(sql, [vendorId], callback);
};

// List the vendors based on their category

const getVendorsByCategoryId = (categoryId, callback) => {
  const sql = `
    SELECT
      id,
      full_name,
      shop_name,
      phone,
      whatsapp_number,
      email,
      category_id,
      experience,
      address1,
      address2,
      city,
      pincode,
      profile_photo,
      business_description,
      availability,
      start_time,
      end_time
    FROM vendors
    WHERE category_id = ?
    ORDER BY id DESC
  `;

  db.query(sql, [categoryId], callback);
};

// Find vendor by email
const findVendorByEmailS = (email, callback) => {
  const sql = `
    SELECT * FROM vendors
    WHERE email = ?
  `;
  db.query(sql, [email], callback);
};

// Save OTP
const saveVendorOtp = (email, otp, expires, callback) => {
  const sql = `
    UPDATE vendors
    SET otp_code = ?, otp_expires = ?
    WHERE email = ?
  `;
  db.query(sql, [otp, expires, email], callback);
};

// Reset password
const updateVendorPassword = (email, newPassword, callback) => {
  const sql = `
    UPDATE vendors
    SET password = ?,
        otp_code = NULL,
        otp_expires = NULL
    WHERE email = ?
  `;
  db.query(sql, [newPassword, email], callback);
};

const updateVendorUpiId = (vendorId, upiId, callback) => {
  const sql = `
    UPDATE vendors
    SET upi_id = ?
    WHERE id = ?
  `;

  db.query(sql, [upiId, vendorId], callback);
};

const getVendorUpi = (vendorId, callback) => {
  const sql = `
    SELECT upi_id
    FROM vendors
    WHERE id = ?
  `;

  db.query(sql, [vendorId], callback);
};

const getTopRatedVendors = (callback) => {
  const sql = `
    SELECT
      v.id,
      v.full_name,
      v.shop_name,
      v.phone,
      v.whatsapp_number,
      v.email,
      v.category_id,
      sc.category_name,
      v.experience,
      v.address1,
      v.address2,
      v.city,
      v.pincode,
      v.profile_photo,
      v.government_id,
      v.business_description,
      v.languages_known,
      v.availability,
      v.start_time,
      v.end_time,
      v.rating,
      v.terms_accepted
    FROM vendors v
    LEFT JOIN service_categories sc
      ON v.category_id = sc.id
    ORDER BY v.rating DESC, v.id DESC
    LIMIT 3
  `;

  db.query(sql, callback);
};

const createActivityVendor = (vendorData, callback) => {

  const sql = `
        INSERT INTO activity_vendors (
            full_name,
            shop_name,
            phone,
            whatsapp_number,
            email,
            password,
            activity_id,
            experience,
            address1,
            address2,
            city,
            pincode,
            profile_photo,
            government_id,
            business_description,
            languages_known,
            availability,
            start_time,
            end_time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

  db.query(
    sql,
    [
      vendorData.fullName,
      vendorData.shopName,
      vendorData.phone,
      vendorData.whatsappNumber,
      vendorData.email,
      vendorData.password,
      vendorData.activityId,
      vendorData.experience,
      vendorData.address1,
      vendorData.address2,
      vendorData.city,
      vendorData.pincode,
      vendorData.profilePhoto,
      vendorData.governmentId,
      vendorData.businessDescription,
      vendorData.languagesKnown,
      vendorData.availability,
      vendorData.startTime,
      vendorData.endTime
    ],
    callback
  );
};

const insertVendorPlans = (vendorId, plans, callback) => {

  const sql = `
        INSERT INTO activity_vendor_plans
        (
            vendor_id,
            plan_name,
            amount,
            advance_amount
        )
        VALUES ?
    `;

  const values = plans.map(plan => [

    vendorId,

    plan.plan_name,

    plan.amount,

    plan.advance_amount

  ]);

  db.query(sql, [values], callback);

};

const getActivityCategories = (callback) => {

  const sql = `
        SELECT
            id,
            activity_name
        FROM activity_categories
        ORDER BY activity_name ASC
    `;

  db.query(sql, callback);

};


const findActivityVendorByEmailOrPhone = (email, phone, callback) => {

  const sql = `
        SELECT *
        FROM activity_vendors
        WHERE email = ? OR phone = ?
    `;

  db.query(sql, [email, phone], callback);
};


export const getActivityVendors = (activityName, callback) => {
  const sql = `
        SELECT
            av.*,
            ac.activity_name,
            ap.id AS plan_id,
            ap.plan_name,
            ap.amount,
            ap.advance_amount
        FROM activity_vendors av
        INNER JOIN activity_categories ac
            ON av.activity_id = ac.id
        LEFT JOIN activity_vendor_plans ap
            ON av.id = ap.vendor_id
        WHERE ac.activity_name = ?
        ORDER BY av.id DESC, ap.id ASC
    `;

  db.query(sql, [activityName], callback);
};

const findSubServiceByName = (
  categoryId,
  serviceName,
  callback
) => {

  const sql = `
      SELECT id
      FROM sub_services
      WHERE category_id = ?
      AND service_name = ?
      LIMIT 1
  `;

  db.query(
    sql,
    [categoryId, serviceName],
    callback
  );

};

const addCustomSubService = (
  categoryId,
  serviceName,
  callback
) => {

  const sql = `
      INSERT INTO sub_services
      (
          category_id,
          service_name
      )
      VALUES (?, ?)
  `;

  db.query(
    sql,
    [
      categoryId,
      serviceName
    ],
    callback
  );

};

const addVendorService = (
  vendorId,
  subServiceId,
  price,
  callback
) => {

  const sql = `
      INSERT INTO vendor_services
      (
          vendor_id,
          sub_service_id,
          price
      )
      VALUES (?, ?, ?)
  `;

  db.query(
    sql,
    [
      vendorId,
      subServiceId,
      price
    ],
    callback
  );

};

export default {
  createVendor,
  findVendorByEmailOrPhone,
  findVendorByEmail,
  getAllVendors,
  getServiceCategories,
  getSubServicesByCategoryId,
  getCategoryById,
  insertVendorServices,
  getVendorDetails,
  getVendorsByCategoryId,
  getVendorById,
  findVendorByEmailS,
  saveVendorOtp,
  updateVendorPassword,
  updateVendorUpiId,
  getVendorUpi,
  getTopRatedVendors,
  insertVendorPlans,
  getActivityCategories,
  createActivityVendor,
  findActivityVendorByEmailOrPhone,
  getActivityVendors,
  findSubServiceByName,
  addCustomSubService,
  addVendorService
};