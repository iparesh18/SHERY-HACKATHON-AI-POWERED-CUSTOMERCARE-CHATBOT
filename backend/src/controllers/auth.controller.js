import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { Organization } from "../models/organization.model.js";
import { OrgMembership } from "../models/orgMembership.model.js";
import { OrgInvite } from "../models/orgInvite.model.js";
import { ok, created, fail } from "../utils/response.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../services/token.service.js";
import { env } from "../config/env.js";

const normalizeOrgKey = (name) => (name || "").trim().toLowerCase();

const ensureOrganization = async (name) => {
  const safeName = name?.trim() || "Default Workspace";
  const key = normalizeOrgKey(safeName) || "default-workspace";

  const existing = await Organization.findOne({ key });
  if (existing) return existing;

  return Organization.create({ name: safeName, key });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, organization, inviteCode } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return fail(res, 409, "Email already registered");
    }

    let org = null;
    let finalRole = role;

    if (inviteCode) {
      const invite = await OrgInvite.findOne({ code: inviteCode, status: "pending" });
      if (!invite) {
        return fail(res, 404, "Invite not found or already used");
      }
      if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
        return fail(res, 403, "Invite email does not match");
      }
      org = await Organization.findById(invite.orgId);
      finalRole = invite.role;
      invite.status = "accepted";
      await invite.save();
    } else {
      org = await ensureOrganization(organization);
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: finalRole,
      orgId: org?._id,
      activeOrgId: org?._id
    });

    if (org?._id) {
      await OrgMembership.create({ orgId: org._id, userId: user._id, role: finalRole || "customer" });
    }

    const accessToken = signAccessToken(user, { role: finalRole, orgId: org?._id });
    const refreshToken = signRefreshToken(user, { role: finalRole, orgId: org?._id });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return created(res, "User registered", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: finalRole || user.role,
        orgId: org?._id || user.orgId
      },
      accessToken
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return fail(res, 401, "Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return fail(res, 401, "Invalid credentials");
    }

    let activeOrgId = user.activeOrgId || user.orgId;
    if (!activeOrgId) {
      const org = await ensureOrganization();
      user.orgId = org._id;
      user.activeOrgId = org._id;
      await user.save();
      activeOrgId = org._id;
    }

    let membership = await OrgMembership.findOne({ orgId: activeOrgId, userId: user._id });
    if (!membership) {
      membership = await OrgMembership.create({
        orgId: activeOrgId,
        userId: user._id,
        role: user.role || "customer"
      });
    }

    const accessToken = signAccessToken(user, { role: membership.role, orgId: activeOrgId });
    const refreshToken = signRefreshToken(user, { role: membership.role, orgId: activeOrgId });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return ok(res, "Login successful", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: membership.role,
        orgId: activeOrgId
      },
      accessToken
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie("refreshToken");
    return ok(res, "Logged out", null);
  } catch (error) {
    return next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return fail(res, 401, "Unauthorized");
    }

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      return fail(res, 401, "Unauthorized");
    }

    const activeOrgId = user.activeOrgId || user.orgId;
    let membership = null;
    if (activeOrgId) {
      membership = await OrgMembership.findOne({ orgId: activeOrgId, userId: user._id });
    }
    const role = membership?.role || user.role;

    const accessToken = signAccessToken(user, { role, orgId: activeOrgId });
    return ok(res, "Token refreshed", { accessToken });
  } catch (error) {
    return fail(res, 401, "Unauthorized");
  }
};

export { register, login, logout, refresh };
