import express from "express";
import { addAddress, getAddresses, updateAddress, deleteAddress } from "../controllers/addressController.js";

const router = express.Router();

router.post("/add-address", addAddress);

router.get("/user-address/:userId", getAddresses);

router.put("/update-address/:id", updateAddress);

router.delete("/delete-address/:id", deleteAddress);

export default router;