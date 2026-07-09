import express from "express";
import { getAllUsers, deleteUser, dashboardStats} from "../controllers/adminControllers.js";
import { authorizedRoles, isAuthenticated,} from "../middlewares/authMiddleware.js";
import { setAdminSecret } from "../controllers/adminControllers.js";

const router = express.Router();

router.get("/getallusers", isAuthenticated, authorizedRoles("Admin"), getAllUsers,); // DASHBOARD

router.delete("/delete/:id",isAuthenticated,authorizedRoles("Admin"),deleteUser,);

router.get("/fetch/dashboard-stats",isAuthenticated,authorizedRoles("Admin"),dashboardStats,);

router.put("/set-secret", isAuthenticated, authorizedRoles("Admin"), setAdminSecret);

export default router;
