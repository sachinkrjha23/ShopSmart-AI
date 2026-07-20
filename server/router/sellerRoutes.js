import express from "express";
import { isAuthenticated, authorizedRoles, isApprovedSeller } from "../middlewares/authMiddleware.js";
import {
  applyToBecomeSeller,
  getMySellerProfile,
  adminGetAllSellers,
  adminGetSingleSeller,
  adminApproveSeller,
  adminRejectSeller,
  adminSuspendSeller,
  getSellerDashboardStats,
  getSellerProducts,
  toggleSellerProduct,
  getSellerOrders,
  getSellerOrderDetail,
  createSellerProduct,
  updateSellerProduct,
  getSellerSingleProduct,
  updateFulfillmentStatus,
  getPublicSellerProfile,
  cancelOrderItemBySeller,
  createSellerCoupon,
  getSellerCoupons,
  updateSellerCoupon,
  toggleSellerCoupon,
  deleteSellerCoupon,
  rateSeller,
  getMySellerRating
} from "../controllers/sellerControllers.js";

const router = express.Router();

// Seller-facing — application
router.post("/apply", isAuthenticated, applyToBecomeSeller);
router.get("/me", isAuthenticated, getMySellerProfile);

// Seller-facing — dashboard/products/orders (approved sellers only)
router.get("/dashboard", isAuthenticated, isApprovedSeller, getSellerDashboardStats);
router.get("/products", isAuthenticated, isApprovedSeller, getSellerProducts);
router.put("/products/toggle/:productId", isAuthenticated, isApprovedSeller, toggleSellerProduct);
router.post("/products", isAuthenticated, isApprovedSeller, createSellerProduct);
router.get("/products/:productId", isAuthenticated, isApprovedSeller, getSellerSingleProduct);
router.put("/products/:productId", isAuthenticated, isApprovedSeller, updateSellerProduct);
router.get("/orders", isAuthenticated, isApprovedSeller, getSellerOrders);
router.get("/orders/:orderId", isAuthenticated, isApprovedSeller, getSellerOrderDetail);
router.put("/orders/item/:itemId/status", isAuthenticated, isApprovedSeller, updateFulfillmentStatus);
router.put("/orders/item/:itemId/cancel", isAuthenticated, isApprovedSeller, cancelOrderItemBySeller);
router.get("/public/:id", getPublicSellerProfile);

// Seller-facing — coupons (approved sellers only)
router.post("/coupons", isAuthenticated, isApprovedSeller, createSellerCoupon);
router.get("/coupons", isAuthenticated, isApprovedSeller, getSellerCoupons);
router.put("/coupons/:couponId", isAuthenticated, isApprovedSeller, updateSellerCoupon);
router.put("/coupons/toggle/:couponId", isAuthenticated, isApprovedSeller, toggleSellerCoupon);
router.delete("/coupons/:couponId", isAuthenticated, isApprovedSeller, deleteSellerCoupon);

router.put("/rate/:sellerId", isAuthenticated, rateSeller);
router.get("/rate/:sellerId/mine", isAuthenticated, getMySellerRating);

// Admin-facing
router.get("/admin/all", isAuthenticated, authorizedRoles("Admin"), adminGetAllSellers);
router.get("/admin/:id", isAuthenticated, authorizedRoles("Admin"), adminGetSingleSeller);
router.put("/admin/approve/:id", isAuthenticated, authorizedRoles("Admin"), adminApproveSeller);
router.put("/admin/reject/:id", isAuthenticated, authorizedRoles("Admin"), adminRejectSeller);
router.put("/admin/suspend/:id", isAuthenticated, authorizedRoles("Admin"), adminSuspendSeller);

export default router;