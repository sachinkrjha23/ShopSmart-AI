import express from "express";
import rateLimit from "express-rate-limit";
import {
  submitContactMessage,
  adminGetAllContactMessages,
  adminDeleteContactMessage,
} from "../controllers/contactControllers.js";
import { isAuthenticated, authorizedRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many messages sent. Please try again after an hour.",
  },
});

router.post("/", contactLimiter, submitContactMessage);

router.get("/admin/all", isAuthenticated, authorizedRoles("Admin"), adminGetAllContactMessages);
router.delete("/admin/:id", isAuthenticated, authorizedRoles("Admin"), adminDeleteContactMessage);

export default router;