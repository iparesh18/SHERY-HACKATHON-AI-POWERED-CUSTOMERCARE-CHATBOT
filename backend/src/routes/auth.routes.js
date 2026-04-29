import express from "express";
import { body } from "express-validator";
import { register, login, logout, refresh } from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("role").optional().isIn(["customer", "agent", "admin"]),
    body("organization").optional({ checkFalsy: true }).isString().isLength({ min: 2 }),
    body("inviteCode").optional({ checkFalsy: true }).isString().isLength({ min: 6 })
  ],
  validateRequest,
  register
);

router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  validateRequest,
  login
);

router.post("/logout", authMiddleware, logout);
router.post("/refresh", refresh);

const authRoutes = router;

export { authRoutes };
