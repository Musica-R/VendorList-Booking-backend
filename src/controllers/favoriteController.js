import {
  addFavorite, removeFavorite,
  checkFavorite,
  getUserFavorites
} from "../models/favoriteModel.js";

export const toggleFavoriteVendor = async (req, res) => {
  try {
    const { user_id, vendor_id } = req.body;

    if (!user_id || !vendor_id) {
      return res.status(400).json({
        success: false,
        message: "user_id and vendor_id are required"
      });
    }

    const exists = await checkFavorite(user_id, vendor_id);

    if (exists) {
      await removeFavorite(user_id, vendor_id);

      return res.status(200).json({
        success: true,
        is_favorite: 0,
        message: "Vendor removed from favorites"
      });
    }

    await addFavorite(user_id, vendor_id);

    return res.status(200).json({
      success: true,
      is_favorite: 1,
      message: "Vendor added to favorites"
    });

  } catch (error) {
    console.error("toggleFavoriteVendor:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};

export const checkFavoriteVendor = async (req, res) => {
  try {
    const { user_id, vendor_id } = req.query;

    const exists = await checkFavorite(user_id, vendor_id);

    return res.status(200).json({
      success: true,
      is_favorite: exists
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};

export const getFavoriteVendors = async (req, res) => {
  try {
    const { user_id } = req.params;

    const vendors = await getUserFavorites(user_id);

    const formattedVendors = vendors.map((vendor) => ({
      id: vendor.id,
      full_name: vendor.full_name,
      rating: vendor.rating,
      category_id: vendor.category_id,
      category_name: vendor.category_name,
      saved_at: vendor.saved_at,
      profile_url: vendor.profile_photo
        ? `${req.protocol}://${req.get("host")}/uploads/${vendor.profile_photo}`
        : null,
    }));

    return res.status(200).json({
      success: true,
      count: formattedVendors.length,
      data: formattedVendors,
    });
  } catch (error) {
    console.error("getFavoriteVendors:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


import db from "../config/db.js";

export const searchCategory = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search text is required"
      });
    }

    const keyword = `%${q.trim()}%`;

    // Search service category
    const [services] = await db.promise().query(
      `SELECT id, category_name
     FROM service_categories
     WHERE category_name LIKE ?
     LIMIT 1`,
      [keyword]
    );

    if (services.length > 0) {
      return res.json({
        success: true,
        type: "service",
        id: services[0].id,
        name: services[0].category_name
      });
    }

    // Search activity category
    const [activities] = await db.promise().query(
      `SELECT id, activity_name
             FROM activity_categories
             WHERE activity_name LIKE ?
             LIMIT 1`,
      [keyword]
    );

    if (activities.length > 0) {
      return res.json({
        success: true,
        type: "activity",
        id: activities[0].id,
        name: activities[0].activity_name
      });
    }

    return res.json({
      success: false,
      message: "No service or activity found"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};