import express from "express";
import rateLimit from "express-rate-limit";
import {
  addAddress,
  getAllAddresses,
  getSingleAddress,
  editAddress,
  setDefaultAddress,
  deleteAddress,
} from "../controllers/addressControllers.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Different limiters for different operations
const addAddressLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many address creation attempts. Try again later.",
  },
});

const editAddressLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many address edit attempts. Try again later.",
  },
});

const deleteAddressLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: "Too many address deletion attempts. Try again later.",
  },
});

const setDefaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many default address update attempts. Try again later.",
  },
});

router.use(isAuthenticated);

router.get("/", getAllAddresses);
router.post("/add", addAddressLimiter, addAddress);
router.get("/:id", getSingleAddress);
router.put("/edit/:id", editAddressLimiter, editAddress);
router.put("/set-default/:id", setDefaultLimiter, setDefaultAddress);
router.delete("/delete/:id", deleteAddressLimiter, deleteAddress);

export default router;
