import crypto from "crypto";
import { Organization } from "../models/organization.model.js";
import { OrgMembership } from "../models/orgMembership.model.js";
import { OrgInvite } from "../models/orgInvite.model.js";
import { ok, created, fail } from "../utils/response.js";
import { signAccessToken, signRefreshToken } from "../services/token.service.js";
import { User } from "../models/user.model.js";
import { env } from "../config/env.js";

const listOrgs = async (req, res, next) => {
  try {
    const memberships = await OrgMembership.find({ userId: req.user.id })
      .populate("orgId", "name key")
      .sort({ createdAt: 1 });

    const orgs = memberships.map((membership) => ({
      id: membership.orgId?._id,
      name: membership.orgId?.name,
      key: membership.orgId?.key,
      role: membership.role
    }));

    return ok(res, "Organizations", { orgs });
  } catch (error) {
    return next(error);
  }
};

const switchOrg = async (req, res, next) => {
  try {
    const { orgId } = req.body;
    if (!orgId) {
      return fail(res, 400, "orgId is required");
    }

    const membership = await OrgMembership.findOne({ orgId, userId: req.user.id });
    if (!membership) {
      return fail(res, 403, "Not a member of this organization");
    }

    await User.findByIdAndUpdate(req.user.id, { activeOrgId: orgId });

    const accessToken = signAccessToken(req.user, { role: membership.role, orgId });
    const refreshToken = signRefreshToken(req.user, { role: membership.role, orgId });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return ok(res, "Organization switched", {
      user: { id: req.user.id, email: req.user.email, role: membership.role, orgId },
      accessToken,
      refreshToken
    });
  } catch (error) {
    return next(error);
  }
};

const createInvite = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return fail(res, 400, "email is required");
    }

    const orgId = req.user.orgId;
    const code = crypto.randomBytes(8).toString("hex");

    const invite = await OrgInvite.create({
      orgId,
      email: email.toLowerCase(),
      role: role || "agent",
      code,
      createdBy: req.user.id
    });

    return created(res, "Invite created", { invite });
  } catch (error) {
    return next(error);
  }
};

const acceptInvite = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return fail(res, 400, "code is required");
    }

    const invite = await OrgInvite.findOne({ code, status: "pending" });
    if (!invite) {
      return fail(res, 404, "Invite not found or already used");
    }
    if (invite.email && invite.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return fail(res, 403, "Invite email does not match");
    }

    await OrgMembership.findOneAndUpdate(
      { orgId: invite.orgId, userId: req.user.id },
      { role: invite.role },
      { upsert: true, new: true }
    );

    invite.status = "accepted";
    await invite.save();

    await User.findByIdAndUpdate(req.user.id, { activeOrgId: invite.orgId });

    const accessToken = signAccessToken(req.user, { role: invite.role, orgId: invite.orgId });
    const refreshToken = signRefreshToken(req.user, { role: invite.role, orgId: invite.orgId });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return ok(res, "Invite accepted", {
      user: { id: req.user.id, email: req.user.email, role: invite.role, orgId: invite.orgId },
      accessToken,
      refreshToken
    });
  } catch (error) {
    return next(error);
  }
};

const listInvites = async (req, res, next) => {
  try {
    const invites = await OrgInvite.find({ orgId: req.user.orgId })
      .sort({ createdAt: -1 })
      .limit(20);

    return ok(res, "Invites", { invites });
  } catch (error) {
    return next(error);
  }
};

const deleteInvite = async (req, res, next) => {
  try {
    const invite = await OrgInvite.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!invite) {
      return fail(res, 404, "Invite not found");
    }

    await invite.deleteOne();
    return ok(res, "Invite deleted", { inviteId: invite._id });
  } catch (error) {
    return next(error);
  }
};

const createOrg = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return fail(res, 400, "name is required");
    }

    const key = name.trim().toLowerCase().replace(/\s+/g, "-");
    const org = await Organization.create({ name: name.trim(), key });

    await OrgMembership.create({ orgId: org._id, userId: req.user.id, role: "admin" });

    await User.findByIdAndUpdate(req.user.id, { activeOrgId: org._id, orgId: org._id });

    const accessToken = signAccessToken(req.user, { role: "admin", orgId: org._id });
    const refreshToken = signRefreshToken(req.user, { role: "admin", orgId: org._id });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return created(res, "Organization created", {
      org,
      user: { id: req.user.id, email: req.user.email, role: "admin", orgId: org._id },
      accessToken,
      refreshToken
    });
  } catch (error) {
    return next(error);
  }
};

export {
  listOrgs,
  switchOrg,
  createInvite,
  acceptInvite,
  listInvites,
  createOrg,
  deleteInvite
};
