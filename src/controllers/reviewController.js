import {
  checkReviewExists,
  createReview,
  updateVendorRating,
} from "../models/reviewModel.js";

export const addReview = (req, res) => {
  const {
    booking_id,
    vendor_id,
    user_id,
    rating,
    review,
  } = req.body;

  if (
    !booking_id ||
    !vendor_id ||
    !user_id ||
    !rating
  ) {
    return res.status(400).json({
      success: false,
      message: "All required fields are mandatory",
    });
  }

  checkReviewExists(booking_id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }

    if (result.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Review already submitted",
      });
    }

    const reviewData = {
      booking_id,
      vendor_id,
      user_id,
      rating,
      review,
    };

    createReview(reviewData, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      updateVendorRating(vendor_id, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message,
          });
        }

        return res.status(201).json({
          success: true,
          message: "Review submitted successfully",
        });
      });
    });
  });
};

import { getVendorReviews } from "../models/reviewModel.js";

export const vendorReviewList = (req, res) => {
  const { vendorId } = req.params;

  getVendorReviews(vendorId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  });
};