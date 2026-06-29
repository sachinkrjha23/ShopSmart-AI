import express from "express";
import rateLimit from "express-rate-limit";
import { addAddress, getAllAddresses, getSingleAddress, editAddress, setDefaultAddress, deleteAddress } from "../controllers/addressControllers.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

const addAddressLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: "Too many requests. Try again later." }
});

router.use(isAuthenticated);

router.get("/", getAllAddresses);
router.post("/add", addAddressLimiter, addAddress);
router.get("/:id",  getSingleAddress);
router.put("/edit/:id",  editAddress);
router.put("/set-default/:id", setDefaultAddress);
router.delete("/delete/:id",   deleteAddress);

export default router;