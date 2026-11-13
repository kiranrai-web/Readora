import React from "react";
import { Navbar, Topbar } from "./components";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="min-h-screen w-full bg-[#F7F7F7] lg:flex">
      <aside className="fixed inset-x-0 bottom-0 z-50 h-16 w-full bg-white shadow-md lg:inset-y-0 lg:bottom-auto lg:h-screen lg:w-[15%]">
        <Navbar className="w-full" />
      </aside>

      <div className="mainpage min-w-0 w-full overflow-x-hidden lg:ml-[15%] lg:w-[85%] lg:overflow-y-auto">
        <Topbar />
        <div className="min-w-0 p-4 pb-24 sm:p-6 sm:pb-24 lg:pb-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
