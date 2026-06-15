import addressModel from "../models/addressModel.js";

//1. Add Address

export const addAddress = (req, res) => {
  const {
    user_id,
    address_type,
    flat,
    area,
    city,
    state,
    pincode,
  } = req.body;

  if (
    !user_id ||
    !address_type ||
    !flat ||
    !area ||
    !city ||
    !state ||
    !pincode
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  addressModel.addAddress(req.body, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Address creation failed",
      });
    }

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      addressId: result.insertId,
    });
  });
};

// 2.Get Addresses

export const getAddresses = (req, res) => {
  const userId = req.params.userId;

  addressModel.getAddressesByUserId(userId, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch addresses",
      });
    }

    res.status(200).json({
      success: true,
      addresses: results,
    });
  });
};


// 3. Update Address

export const updateAddress = (req, res) => {
  const addressId = req.params.id;

  addressModel.updateAddress(
    addressId,
    req.body,
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Address update failed",
        });
      }

      res.status(200).json({
        success: true,
        message: "Address updated successfully",
      });
    }
  );
};

//4.Delete Address

export const deleteAddress = (req, res) => {
  const addressId = req.params.id;

  addressModel.deleteAddress(addressId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Address delete failed",
      });
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  });
};