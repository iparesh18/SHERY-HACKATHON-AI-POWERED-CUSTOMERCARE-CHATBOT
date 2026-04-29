import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";
import AuthLayout from "./layouts/AuthLayout.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Chat from "./pages/Chat.jsx";
import Tickets from "./pages/Tickets.jsx";
import TicketDetail from "./pages/TicketDetail.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";

const RequireAuth = ({ children }) => {
  const { user, isInitialized } = useAuth();
  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RequireRole = ({ allowed, children }) => {
  const { user } = useAuth();
  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/app" replace />;
  }
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "customer") return <Navigate to="/app/chat" replace />;
  if (user.role === "admin") return <Navigate to="/app/admin" replace />;
  return <Navigate to="/app/tickets" replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<RoleRedirect />} />
        <Route
          path="chat"
          element={
            <RequireRole allowed={["customer"]}>
              <Chat />
            </RequireRole>
          }
        />
        <Route
          path="tickets"
          element={
            <RequireRole allowed={["agent", "admin"]}>
              <Tickets />
            </RequireRole>
          }
        />
        <Route
          path="tickets/:id"
          element={
            <RequireRole allowed={["agent", "admin"]}>
              <TicketDetail />
            </RequireRole>
          }
        />
        <Route
          path="admin"
          element={
            <RequireRole allowed={["admin"]}>
              <AdminDashboard />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
