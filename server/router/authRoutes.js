import express from "express";
import rateLimit from "express-rate-limit";
import {getUser,login,logout,register, forgotPassword, resetPassword, updatePassword, updateProfile} from "../controllers/authControllers.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rate limiters for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: {
    success: false,
    message: "Too many registration attempts. Please try again after an hour."
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 forgot password requests per hour
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again after an hour."
  },
});


router.post("/register",registerLimiter, register);
router.post("/login",authLimiter, login);
router.post("/password/forgot",forgotPasswordLimiter, forgotPassword);


router.get("/me",isAuthenticated, getUser);
router.get("/logout", isAuthenticated, logout);
router.put("/password/reset/:token", resetPassword);
router.put("/password/update", isAuthenticated, updatePassword);
router.put("/profile/update", isAuthenticated, updateProfile);

export default router;