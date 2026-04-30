import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import Button from "./Button.jsx";
import Select from "./Select.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { createInvite, deleteInvite, listInvites } from "../services/org.service.js";

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [invites, setInvites] = useState([]);
  const [showInvites, setShowInvites] = useState(false);

  const links = [
    user?.role === "customer" && { to: "/app/chat", label: "Chat" },
    ["agent", "admin"].includes(user?.role) && { to: "/app/tickets", label: "Tickets" },
    user?.role === "admin" && { to: "/app/admin", label: "Dashboard" }
  ].filter(Boolean);

  const fetchInvites = async () => {
    if (user?.role !== "admin") return;
    try {
      const response = await listInvites();
      setInvites(response.data?.data?.invites || []);
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to load invites", "error");
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [user?.role]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      pushToast("Enter an email", "warning");
      return;
    }

    try {
      await createInvite({ email: inviteEmail.trim(), role: inviteRole });
      pushToast("Invite created", "success");
      setInviteEmail("");
      fetchInvites();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Invite failed", "error");
    }
  };

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      pushToast("Invite code copied", "success");
    } catch {
      pushToast("Copy failed", "error");
    }
  };

  const handleExpire = async (id) => {
    try {
      await deleteInvite(id);
      pushToast("Invite expired", "success");
      fetchInvites();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Expire failed", "error");
    }
  };

  const closeInvites = () => setShowInvites(false);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden transition-opacity duration-200" 
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] h-[100dvh] overflow-y-auto transform transition-transform duration-200 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0 lg:w-full lg:h-full lg:z-auto glass-card flex flex-col rounded-none lg:rounded-3xl p-6`}>
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Support Atlas</p>
        <h1 className="mt-3 text-2xl font-semibold">AI Support Hub</h1>
      </div>
      <nav className="mt-10 flex flex-col gap-3 text-sm">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-xl px-4 py-3 transition ${
                isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      {user?.role === "admin" && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Invite</p>
          <p className="mt-2 text-sm font-semibold">Add teammates</p>
          <div className="mt-3 space-y-2">
            <input
              placeholder="agent@company.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              className="select-field text-sm"
            />
            <Select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
              options={[
                { value: "agent", label: "Agent" },
                { value: "admin", label: "Admin" },
                { value: "customer", label: "Customer" }
              ]}
            />
            <Button onClick={handleInvite} className="w-full">
              Create invite
            </Button>
          </div>
          {invites.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                {invites.slice(0, 3).map((invite) => (
                  <div key={invite._id} className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <p className="text-[11px] font-semibold">{invite.email}</p>
                    <p className="text-[10px] text-white/60">Role: {invite.role}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] text-white/70">{invite.code}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          className="px-2 py-1 text-[10px]"
                          onClick={() => handleCopy(invite.code)}
                        >
                          Copy
                        </Button>
                        <Button
                          variant="danger"
                          className="px-2 py-1 text-[10px]"
                          onClick={() => handleExpire(invite._id)}
                        >
                          Expire
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {invites.length > 3 && (
                <Button variant="ghost" className="w-full" onClick={() => setShowInvites(true)}>
                  View all invites
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      <div className="mt-auto pt-8 text-xs text-white/50">
        <p>Realtime: Socket ready</p>
        <p className="mt-2">Powered by Support Atlas</p>
      </div>
      {showInvites && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-6">
          <div className="glass-card max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Invites</p>
                <h3 className="mt-2 text-lg font-semibold">All invite codes</h3>
              </div>
              <Button variant="ghost" onClick={closeInvites}>
                Close
              </Button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
              {invites.length === 0 ? (
                <p className="text-sm text-muted">No invites yet.</p>
              ) : (
                <div className="space-y-3">
                  {invites.map((invite) => (
                    <div key={invite._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{invite.email}</p>
                          <p className="text-xs text-muted">Role: {invite.role} · Status: {invite.status}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" onClick={() => handleCopy(invite.code)}>
                            Copy code
                          </Button>
                          <Button variant="danger" onClick={() => handleExpire(invite._id)}>
                            Expire
                          </Button>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-white/70">{invite.code}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
    </>
  );
};

export default Sidebar;
