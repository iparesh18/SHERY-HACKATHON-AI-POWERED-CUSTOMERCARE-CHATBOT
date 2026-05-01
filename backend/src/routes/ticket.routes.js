import express from "express";
import { body } from "express-validator";
import {
  listTickets,
  getTicket,
  takeTicket,
  assignTicket,
  updateStatus,
  replyToTicket,
  deleteTicket,
  getAnalytics,
  getSuggestions,
  submitRating
} from "../controllers/ticket.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, authorizeRoles("agent", "admin"), listTickets);
router.get("/analytics", authMiddleware, authorizeRoles("admin"), getAnalytics);
router.get("/:id/suggestions", authMiddleware, authorizeRoles("agent", "admin"), getSuggestions);
router.get("/:id", authMiddleware, authorizeRoles("agent", "admin"), getTicket);
router.patch("/:id/take", authMiddleware, authorizeRoles("agent"), takeTicket);
router.patch(
  "/:id/assign",
  authMiddleware,
  authorizeRoles("admin"),
  [body("agentId").notEmpty()],
  validateRequest,
  assignTicket
);
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("agent", "admin"),
  [body("status").isIn(["open", "in-progress", "resolved"])],
  validateRequest,
  updateStatus
);
router.post(
  "/:id/reply",
  authMiddleware,
  authorizeRoles("agent", "admin"),
  [body("message").notEmpty().isString()],
  validateRequest,
  replyToTicket
);
router.post(
  "/:id/feedback",
  authMiddleware,
  authorizeRoles("customer"),
  [body("rating").isInt({ min: 1, max: 5 }), body("ratingText").optional().isString()],
  validateRequest,
  submitRating
);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteTicket);

const ticketRoutes = router;

export { ticketRoutes };
