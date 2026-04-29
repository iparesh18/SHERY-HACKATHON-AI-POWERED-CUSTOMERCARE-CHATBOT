import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

const AppLayout = () => {
  return (
    <div className="min-h-screen px-6 py-8">
      <div className="page-grid">
        <Sidebar />
        <div className="flex flex-col gap-6">
          <Topbar />
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
