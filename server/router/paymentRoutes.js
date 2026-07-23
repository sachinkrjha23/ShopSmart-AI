import express from "express";
import rateLimit from "express-rate-limit";
import { isAuthenticated, authorizedRoles } from "../middlewares/authMiddleware.js";
import {
  createOrder, verifyPayment, handleWebhook, getMyOrders, getSingleOrder,
  adminGetAllOrders, adminGetSingleOrder, adminUpdateOrderStatus,
  adminInitiateRefund, cancelOrder, adminCancelOrder,
  getOrderInvoice, adminUpdateItemFulfillmentStatus
} from "../controllers/paymentControllers.js";

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many payment attempts. Please try again after 15 minutes." }
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many verification attempts. Please try again after 15 minutes." }
});

const router = express.Router();

// Webhook (raw body)
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

router.use(express.json());

// ============================================================
// USER ROUTES
// ============================================================
router.post("/create-order", isAuthenticated, paymentLimiter, createOrder);
router.post("/verify", isAuthenticated, verifyLimiter, verifyPayment);
router.get("/my-orders", isAuthenticated, getMyOrders);

// ✅ IMPORTANT: Specific route BEFORE the catch-all
router.get("/order/:orderId/invoice", isAuthenticated, getOrderInvoice);
router.get("/order/:orderId", isAuthenticated, getSingleOrder);

router.delete("/cancel/:orderId", isAuthenticated, cancelOrder);

// ============================================================
// ADMIN ROUTES
// ============================================================
router.get("/admin/all-orders", isAuthenticated, authorizedRoles("Admin"), adminGetAllOrders);
router.get("/admin/order/:orderId", isAuthenticated, authorizedRoles("Admin"), adminGetSingleOrder);
router.put("/admin/order/:orderId", isAuthenticated, authorizedRoles("Admin"), adminUpdateOrderStatus);
router.put("/admin/order-item/:itemId/fulfillment-status", isAuthenticated, authorizedRoles("Admin"), adminUpdateItemFulfillmentStatus);
router.post("/admin/refund", isAuthenticated, authorizedRoles("Admin"), adminInitiateRefund);
router.delete("/admin/cancel/:orderId", isAuthenticated, authorizedRoles("Admin"), adminCancelOrder);


export default router;