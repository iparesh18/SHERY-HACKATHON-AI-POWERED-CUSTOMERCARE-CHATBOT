import { validationResult } from "express-validator";
import { fail } from "../utils/response.js";

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 422, "Validation failed", errors.array());
  }

  return next();
};

export { validateRequest };
