import { useEffect, useState } from "react";
import Button from "./Button.jsx";
import Select from "./Select.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { getOrgs, switchOrg } from "../services/org.service.js";
import { useToast } from "../hooks/useToast.js";

const Topbar = () => {
  const { user, logout, setSession } = useAuth();
  const { pushToast } = useToast();
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");

  const fetchOrgs = async () => {
    try {
      const response = await getOrgs();
      const list = response.data?.data?.orgs || [];
      setOrgs(list);
      if (user?.orgId) {
        setSelectedOrg(user.orgId);
      } else if (list[0]?.id) {
        setSelectedOrg(list[0].id);
      }
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to load orgs", "error");
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, [user?.id]);

  const handleSwitch = async (event) => {
    const orgId = event.target.value;
    setSelectedOrg(orgId);
    try {
      const response = await switchOrg(orgId);
      const data = response.data?.data;
      if (data?.user && data?.accessToken) {
        setSession(data.user, data.accessToken);
        pushToast("Organization switched", "success");
      }
    } catch (error) {
      pushToast(error?.response?.data?.message || "Switch failed", "error");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Workspace</p>
        <h2 className="mt-2 text-2xl font-semibold">Welcome back, {user?.name || "User"}</h2>
        <p className="text-sm text-muted">Role: {user?.role}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {orgs.length > 0 && (
          <Select
            label="Organization"
            value={selectedOrg}
            onChange={handleSwitch}
            options={orgs.map((org) => ({
              value: org.id,
              label: `${org.name} (${org.role})`
            }))}
          />
        )}
        <Button variant="ghost" onClick={() => logout()}>
          Log out
        </Button>
      </div>
    </div>
  );
};

export default Topbar;
