import express from "express";
import rateLimit from "express-rate-limit";
import { createProduct , fetchAllProducts, updateProduct, deleteProduct, fetchSingleProduct, postProductReview, deleteReview , fetchAIFilteredProducts, getCategories, getTopReviews, adminGetAllProducts, adminGetSingleProduct, adminGetAllReviews, adminDeleteReview, checkProductsAvailability, aiPolishDescription } from "../controllers/productControllers.js";

import { authorizedRoles, isAuthenticated} from "../middlewares/authMiddleware.js";

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { success: false, message: "Too many AI search requests. Please try again after 15 minutes." },
});

router.post("/admin/create", isAuthenticated, authorizedRoles("Admin"), createProduct);

router.get("/", fetchAllProducts);

router.get("/categories", getCategories); 

router.get("/reviews/top", getTopReviews); 

router.get("/singleProduct/:productId", fetchSingleProduct);

router.put("/admin/update/:productId", isAuthenticated, authorizedRoles("Admin"), updateProduct);

router.delete("/admin/delete/:productId", isAuthenticated, authorizedRoles("Admin"), deleteProduct);

router.put("/post-new/review/:productId", isAuthenticated, postProductReview);

router.delete("/delete/review/:productId", isAuthenticated, deleteReview);

router.post("/ai/recommend", isAuthenticated, aiLimiter,  fetchAIFilteredProducts);

router.post("/ai/polish-description", isAuthenticated, aiPolishDescription);

router.get("/admin/all", isAuthenticated, authorizedRoles("Admin"), adminGetAllProducts);

router.get("/admin/single/:productId", isAuthenticated, authorizedRoles("Admin"), adminGetSingleProduct);


router.get("/admin/reviews", isAuthenticated, authorizedRoles("Admin"), adminGetAllReviews);

router.delete("/admin/reviews/:reviewId", isAuthenticated, authorizedRoles("Admin"), adminDeleteReview);

router.post("/check-availability", isAuthenticated, checkProductsAvailability);

export default router;