import { OrgMembership } from "../models/orgMembership.model.js";
import { ok } from "../utils/response.js";

const listAgents = async (req, res, next) => {
  try {
    const query = (req.query.query || "").trim();
    const membershipFilter = { role: "agent", orgId: req.user.orgId };

    const memberships = await OrgMembership.find(membershipFilter)
      .populate("userId", "name email")
      .limit(50);

    const agents = memberships
      .map((membership) => membership.userId)
      .filter(Boolean)
      .filter((user) => {
        if (!query) return true;
        const lower = query.toLowerCase();
        return (
          user.name?.toLowerCase().includes(lower) ||
          user.email?.toLowerCase().includes(lower)
        );
      })
      .slice(0, 20)
      .map((user) => ({ _id: user._id, name: user.name, email: user.email }));

    return ok(res, "Agents fetched", { agents });
  } catch (error) {
    return next(error);
  }
};

export { listAgents };
