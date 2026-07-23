import React from "react";
import { Navbar, Topbar } from "./components";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="container bg-[#F7F7F7] h-screen w-full flex">
      {/* Sidebar */}
      <div className="sidebar w-[15%] fixed h-screen bg-white shadow-md">
        <Navbar className="w-full" />
      </div>

      {/* Main Content */}
      <div className="mainpage ml-[15%] w-[85%] overflow-y-auto">
        <Topbar className="fixed" />
        <div className="p-6">
          <Outlet /> {/* This renders the current page content */}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
