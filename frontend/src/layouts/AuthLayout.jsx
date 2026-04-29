import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="glass-card rounded-3xl p-10">
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Support Atlas</p>
          <h1 className="mt-4 text-4xl font-semibold">AI-powered support, built for humans.</h1>
          <p className="mt-4 text-sm text-muted">
            Chat with an AI concierge, escalate complex issues to agents, and keep every ticket in one place.
          </p>
          <div className="mt-10 grid gap-4 text-sm text-muted">
            <div className="glass-card rounded-2xl px-4 py-3">
              Instant AI responses with smart escalation.
            </div>
            <div className="glass-card rounded-2xl px-4 py-3">Multi-role workspace for agents and admins.</div>
            <div className="glass-card rounded-2xl px-4 py-3">Realtime ticket updates when it matters.</div>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
