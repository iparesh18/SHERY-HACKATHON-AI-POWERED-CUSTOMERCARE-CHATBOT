import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const signAccessToken = (user, options = {}) => {
  const userId = user._id || user.id;
  const role = options.role || user.role;
  const orgId = options.orgId || user.activeOrgId || user.orgId;
  return jwt.sign(
    { sub: userId.toString(), role, email: user.email, orgId },
    env.jwtSecret,
    { expiresIn: env.accessTokenTtl }
  );
};

const signRefreshToken = (user, options = {}) => {
  const userId = user._id || user.id;
  const role = options.role || user.role;
  const orgId = options.orgId || user.activeOrgId || user.orgId;
  return jwt.sign(
    { sub: userId.toString(), role, email: user.email, orgId },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTokenTtl }
  );
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwtRefreshSecret);
};

export { signAccessToken, signRefreshToken, verifyRefreshToken };
