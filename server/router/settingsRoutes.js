import express from "express";
import { getStoreSettings, updateStoreSettings } from "../controllers/settingsControllers.js";
import { isAuthenticated, authorizedRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getStoreSettings);
router.put("/admin/update", isAuthenticated, authorizedRoles("Admin"), updateStoreSettings);

export default router;