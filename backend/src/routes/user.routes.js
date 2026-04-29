import express from "express";
import { listAgents } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/agents", authMiddleware, authorizeRoles("admin"), listAgents);

const userRoutes = router;

export { userRoutes };
