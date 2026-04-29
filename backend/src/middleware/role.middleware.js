import { fail } from "../utils/response.js";

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, 403, "Forbidden", null);
    }

    return next();
  };
};

export { authorizeRoles };
