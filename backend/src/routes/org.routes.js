import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { body } from "express-validator";
import {
  listOrgs,
  switchOrg,
  createInvite,
  acceptInvite,
  listInvites,
  createOrg,
  deleteInvite
} from "../controllers/org.controller.js";

const router = express.Router();

router.get("/", authMiddleware, listOrgs);
router.post("/switch", authMiddleware, [body("orgId").notEmpty()], validateRequest, switchOrg);
router.post("/create", authMiddleware, [body("name").notEmpty()], validateRequest, createOrg);
router.get("/invites", authMiddleware, authorizeRoles("admin"), listInvites);
router.post(
  "/invites",
  authMiddleware,
  authorizeRoles("admin"),
  [body("email").isEmail(), body("role").optional().isIn(["customer", "agent", "admin"])],
  validateRequest,
  createInvite
);
router.delete("/invites/:id", authMiddleware, authorizeRoles("admin"), deleteInvite);
router.post("/invites/accept", authMiddleware, [body("code").notEmpty()], validateRequest, acceptInvite);

const orgRoutes = router;

export { orgRoutes };
