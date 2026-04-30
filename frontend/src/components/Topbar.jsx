import { useEffect, useState } from "react";
import Button from "./Button.jsx";
import Select from "./Select.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { getOrgs, switchOrg } from "../services/org.service.js";
import { useToast } from "../hooks/useToast.js";

const Topbar = ({ onMenuClick }) => {
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
    <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button 
          className="lg:hidden p-2 -ml-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Workspace</p>
          <h2 className="mt-2 text-xl sm:text-2xl font-semibold break-words">Welcome back, {user?.name || "User"}</h2>
          <p className="text-sm text-muted">Role: {user?.role}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
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
