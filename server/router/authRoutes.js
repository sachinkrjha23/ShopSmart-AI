import express from "express";
import rateLimit from "express-rate-limit";
import {getUser,login,logout,register, forgotPassword, resetPassword, updatePassword, updateProfile, googleLogin, googleSignup, verifyEmail, resendVerification, deleteMyAccount} from "../controllers/authControllers.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import { confirmEmailChange } from "../controllers/authControllers.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again after an hour."
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again after an hour."
  },
});

router.post("/register", registerLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google/login", authLimiter, googleLogin);
router.post("/google/signup", authLimiter, googleSignup);
router.post("/password/forgot", forgotPasswordLimiter, forgotPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.get("/email-change/confirm/:token", confirmEmailChange);

router.get("/me", isAuthenticated, getUser);
router.get("/logout", isAuthenticated, logout);
router.delete("/account/delete", isAuthenticated, deleteMyAccount);
router.put("/password/reset/:token", resetPassword);
router.put("/password/update", isAuthenticated, updatePassword);
router.put("/profile/update", isAuthenticated, updateProfile);

export default router;