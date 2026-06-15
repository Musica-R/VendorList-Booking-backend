import express from "express";
import {
    toggleFavoriteVendor,
    getFavoriteVendors,
    checkFavoriteVendor
} from "../controllers/favoriteController.js";

const router = express.Router();

router.post("/toggle", toggleFavoriteVendor);

router.get("/user/:user_id", getFavoriteVendors);

router.get("/check", checkFavoriteVendor);

export default router;