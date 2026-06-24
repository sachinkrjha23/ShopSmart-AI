import express from "express";
import { createProduct , fetchAllProducts, updateProduct, deleteProduct /* , fetchSingleProduct, postProductReview, deleteReview, fetchAIFilteredProducts */ } from "../controllers/productControllers.js";

import { authorizedRoles, isAuthenticated} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/admin/create", isAuthenticated, authorizedRoles("Admin"), createProduct);

router.get("/", fetchAllProducts);

router.put("/admin/update/:productId", isAuthenticated, authorizedRoles("Admin"), updateProduct);

router.delete("/admin/delete/:productId", isAuthenticated, authorizedRoles("Admin"), deleteProduct);


export default router;