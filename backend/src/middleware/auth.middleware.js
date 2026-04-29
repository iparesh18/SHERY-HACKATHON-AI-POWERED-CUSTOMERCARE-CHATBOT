import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { fail } from "../utils/response.js";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const tokenFromHeader = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const token = tokenFromHeader || req.cookies?.accessToken;

    if (!token) {
      return fail(res, 401, "Unauthorized", null);
    }

    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, role: payload.role, email: payload.email, orgId: payload.orgId };

    return next();
  } catch (error) {
    return fail(res, 401, "Unauthorized", null);
  }
};

export { authMiddleware };
