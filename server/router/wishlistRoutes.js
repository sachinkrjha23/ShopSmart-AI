import express from "express";
import {addToWishlist, removeFromWishlist, getWishlist, clearWishlist, checkWishlist} from "../controllers/wishlistControllers.js";

import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All wishlist routes require login
router.use(isAuthenticated);

router.get("/",  getWishlist);
router.post("/add/:productId", addToWishlist);
router.delete("/remove/:productId", removeFromWishlist);
router.delete("/clear", clearWishlist);
router.get("/check/:productId", checkWishlist);

export default router;