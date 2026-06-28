import express from "express";
import rateLimit from "express-rate-limit";
import { isAuthenticated, authorizedRoles } from "../middlewares/authMiddleware.js";
import { createOrder, verifyPayment, handleWebhook, getMyOrders, getSingleOrder, adminGetAllOrders, adminUpdateOrderStatus, adminInitiateRefund, cancelOrder, adminCancelOrder, } 
from "../controllers/paymentControllers.js";


const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,
  message: { success: false, message: "Too many payment attempts. Please try again after 15 minutes." }
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many verification attempts. Please try again after 15 minutes." }
});

const router = express.Router();

router.post("/webhook",express.raw({ type: "application/json" }),handleWebhook);

router.use(express.json());

// USER ROUTES 
router.post("/create-order", isAuthenticated, paymentLimiter, createOrder);
router.post("/verify",       isAuthenticated, verifyLimiter,  verifyPayment);
router.get("/my-orders", isAuthenticated, getMyOrders);
router.get("/order/:orderId", isAuthenticated, getSingleOrder);
router.delete("/cancel/:orderId",        isAuthenticated, cancelOrder);


// ADMIN ROUTES 
router.get("/admin/all-orders", isAuthenticated, authorizedRoles("Admin"), adminGetAllOrders);
router.put("/admin/order/:orderId", isAuthenticated, authorizedRoles("Admin"), adminUpdateOrderStatus);
router.post("/admin/refund", isAuthenticated, authorizedRoles("Admin"), adminInitiateRefund);
router.delete("/admin/cancel/:orderId",  isAuthenticated, authorizedRoles("Admin"), adminCancelOrder);


export default router;