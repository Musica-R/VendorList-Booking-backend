import {
  addFavorite,
  removeFavorite,
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