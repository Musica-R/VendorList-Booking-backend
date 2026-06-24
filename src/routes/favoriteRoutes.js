import express from "express";
import {
    toggleFavoriteVendor,
    getFavoriteVendors,
    checkFavoriteVendor,
    searchCategory
} from "../controllers/favoriteController.js";

const router = express.Router();

router.post("/toggle", toggleFavoriteVendor);

router.get("/user/:user_id", getFavoriteVendors);

router.get("/check", checkFavoriteVendor);

router.get("/search", searchCategory);

export default router;