import express from "express";
import { isAuthenticated, authorizedRoles } from "../middlewares/authMiddleware.js";
import { createReport, adminGetReports, adminResolveReport } from "../controllers/reportControllers.js";

const router = express.Router();

router.post("/request", isAuthenticated, createReport);
router.get("/admin", isAuthenticated, authorizedRoles("Admin"), adminGetReports);
router.patch("/admin/:reportId", isAuthenticated, authorizedRoles("Admin"), adminResolveReport);

export default router;