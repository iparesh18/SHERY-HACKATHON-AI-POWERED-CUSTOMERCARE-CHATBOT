import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-8">
      <div className="page-grid relative">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex flex-col gap-6 w-full max-w-full min-w-0">
          <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
