import express from "express";
import { isAuthenticated, authorizedRoles, isApprovedSeller } from "../middlewares/authMiddleware.js";
import {
  createReturnRequest,
  getSellerReturnRequests,
  resolveReturnRequestBySeller,
  getAdminReturnRequests,
  resolveReturnRequestByAdmin,
  retryReturnRefundByAdmin,
  retryReturnRefundBySeller,
} from "../controllers/returnControllers.js";

const router = express.Router();

router.post("/request", isAuthenticated, createReturnRequest);
router.get("/seller", isAuthenticated, isApprovedSeller, getSellerReturnRequests);
router.patch("/seller/:returnId", isAuthenticated, isApprovedSeller, resolveReturnRequestBySeller);
router.get("/admin", isAuthenticated, authorizedRoles("Admin"), getAdminReturnRequests);
router.patch("/admin/:returnId", isAuthenticated, authorizedRoles("Admin"), resolveReturnRequestByAdmin);

router.post("/admin/:returnId/refund", isAuthenticated, authorizedRoles("Admin"), retryReturnRefundByAdmin);
router.post("/seller/:returnId/refund", isAuthenticated, isApprovedSeller, retryReturnRefundBySeller);

export default router;