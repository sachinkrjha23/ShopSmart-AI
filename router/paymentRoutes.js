import express from "express";
import { createOrder, verifyPayment, handleWebhook, getMyOrders, getSingleOrder, adminGetAllOrders, adminUpdateOrderStatus, adminInitiateRefund, cancelOrder, adminCancelOrder, } 
from "../controllers/paymentControllers.js";

import { isAuthenticated, authorizedRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/webhook",express.raw({ type: "application/json" }),handleWebhook);

router.use(express.json());

// USER ROUTES 
router.post("/create-order", isAuthenticated, createOrder);
router.post("/verify", isAuthenticated, verifyPayment);
router.get("/my-orders", isAuthenticated, getMyOrders);
router.get("/order/:orderId", isAuthenticated, getSingleOrder);
router.delete("/cancel/:orderId",        isAuthenticated, cancelOrder);


// ADMIN ROUTES 
router.get("/admin/all-orders", isAuthenticated, authorizedRoles("Admin"), adminGetAllOrders);
router.put("/admin/order/:orderId", isAuthenticated, authorizedRoles("Admin"), adminUpdateOrderStatus);
router.post("/admin/refund", isAuthenticated, authorizedRoles("Admin"), adminInitiateRefund);
router.delete("/admin/cancel/:orderId",  isAuthenticated, authorizedRoles("Admin"), adminCancelOrder);


export default router;