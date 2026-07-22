import express from "express";
import { isAuthenticated, authorizedRoles } from "../middlewares/authMiddleware.js";
import {
  createBroadcastNotification,
  getMyNotifications,
  markNotificationRead,
  dismissNotification,
} from "../controllers/notificationControllers.js";

const router = express.Router();

router.post("/admin/broadcast", isAuthenticated, authorizedRoles("Admin"), createBroadcastNotification);
router.get("/my", isAuthenticated, getMyNotifications);
router.patch("/:id/read", isAuthenticated, markNotificationRead);
router.patch("/:id/dismiss", isAuthenticated, dismissNotification);

export default router;