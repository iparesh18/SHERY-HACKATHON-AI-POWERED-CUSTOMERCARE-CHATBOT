import express from "express";
import { body } from "express-validator";
import { sendMessage, getThread } from "../controllers/chat.controller.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/send",
  authMiddleware,
  [body("message").notEmpty().isString()],
  validateRequest,
  sendMessage
);

router.get("/:userId", authMiddleware, getThread);

const chatRoutes = router;

export { chatRoutes };
