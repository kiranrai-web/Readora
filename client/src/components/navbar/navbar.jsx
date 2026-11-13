import React from "react";
import { images } from "../../constants";
import { IoMdHome, IoMdSearch } from "react-icons/io";
import { RiBookShelfLine } from "react-icons/ri";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", icon: <IoMdHome />, end: true },
  { to: "/search", label: "Search", icon: <IoMdSearch />, end: true },
  { to: "/shelf", label: "My Shelf", icon: <RiBookShelfLine />, end: true },
];

const Navbar = () => {
  const linkClass = ({ isActive }) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[10px] transition-colors sm:text-xs lg:flex-row lg:flex-none lg:justify-start lg:gap-2 lg:px-3 lg:py-3 lg:text-base ${
      isActive
        ? "bg-orange-50 font-semibold text-[#4D4D4D] lg:bg-transparent"
        : "text-[#8A8A8A] hover:text-[#4D4D4D]"
    }`;

  return (
    <div className="flex h-full w-full items-center justify-center border-t bg-white px-3 py-2 text-[#8A8A8A] lg:flex-col lg:items-stretch lg:justify-between lg:border lg:px-6 lg:py-10">
      <div className="flex w-full items-center justify-center lg:block">
        <div className="mb-10 hidden w-full lg:block">
          <img src={images.logo} alt="Readora" className="w-full max-w-[190px]" />
        </div>
        <nav aria-label="Main navigation" className="flex w-full items-center justify-around lg:flex-col lg:items-stretch lg:gap-1">
          {links.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <span className="h-5 w-5" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <nav aria-label="More information" className="hidden w-full text-sm lg:block">
        <NavLink to="/about" className={linkClass}>About</NavLink>
        <NavLink to="/terms" className={linkClass}>Terms &amp; condition</NavLink>
      </nav>
    </div>
  );
};

export default Navbar;
