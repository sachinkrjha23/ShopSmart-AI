import express from "express";
import rateLimit from "express-rate-limit";
import { validateCoupon, createCoupon, getAllCoupons, updateCoupon, toggleCoupon, deleteCoupon} from "../controllers/couponControllers.js";
import { isAuthenticated, authorizedRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

const validateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: "Too many coupon attempts. Try again later." }
});

// User route
router.post("/validate", isAuthenticated, validateLimiter, validateCoupon);

// Admin routes
router.use(isAuthenticated, authorizedRoles("Admin"));

router.get("/admin/all", getAllCoupons);
router.post("/admin/create", createCoupon);  // for invalid create as admin and valifste as user
router.put("/admin/update/:id",  updateCoupon);
router.put("/admin/toggle/:id",  toggleCoupon);
router.delete("/admin/delete/:id",  deleteCoupon);

export default router;