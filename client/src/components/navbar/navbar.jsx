import React from "react";
import { images } from "../../constants";
import { IoMdHome, IoMdSearch } from "react-icons/io";
import { MdShoppingCart } from "react-icons/md";
import { RiBookShelfLine } from "react-icons/ri";
import { FaDonate } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const navbar = () => {
  return (
    <div className="app__navbar container  bg-white text-[#8A8A8A] h-screen py-10 px-6 flex flex-col items-center border justify-between">
      <div className="app__navMenu flex flex-col gap-14 ">
        <div className="app__navMenu-logo w-full">
          <img src={images.logo} alt="logo" className="w-60" />
        </div>
        <div className="app__navMenu-links text-start px-8">
          <nav className="list-none mt-5">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `hover:text-[#4D4D4D] flex items-center gap-2 ${
                  isActive ? "text-[#4D4D4D] font-semibold" : "text-[#8A8A8A]"
                }`
              }
            >
              <IoMdHome />
              Home
            </NavLink>
             <NavLink
              to="/search"
              end
              className={({ isActive }) =>
                `hover:text-[#4D4D4D] flex items-center gap-2 my-5 ${
                  isActive ? "text-[#4D4D4D] font-semibold" : "text-[#8A8A8A]"
                }`
              }
            >
               <IoMdSearch />
              Search
            </NavLink>
             <NavLink
              to="/shelf"
              end
              className={({ isActive }) =>
                `hover:text-[#4D4D4D] flex items-center gap-2 my-5 ${
                  isActive ? "text-[#4D4D4D] font-semibold" : "text-[#8A8A8A]"
                }`
              }
            >
              <RiBookShelfLine />
              My Shelf
            </NavLink>
          </nav>
        </div>
      </div>
      <div className="app__navFooter w-full text-start px-8 text-sm">
                  <nav className="list-none mt-5">
            <NavLink
              to="/about"
              end
              className={({ isActive }) =>
                `hover:text-[#4D4D4D] flex items-center gap-2 ${
                  isActive ? "text-[#4D4D4D] font-semibold" : "text-[#8A8A8A]"
                }`
              }
            >
              About
            </NavLink>
             <NavLink
              to="/shop"
              end
              className={({ isActive }) =>
                `hover:text-[#4D4D4D] flex items-center gap-2 my-5 ${
                  isActive ? "text-[#4D4D4D] font-semibold" : "text-[#8A8A8A]"
                }`
              }
            >

              Support
            </NavLink>
             <NavLink
              to="shop"
              end
              className={({ isActive }) =>
                `hover:text-[#4D4D4D] flex items-center gap-2 my-5 ${
                  isActive ? "text-[#4D4D4D] font-semibold" : "text-[#8A8A8A]"
                }`
              }
            >
              Terms & condition
            </NavLink>
          </nav>

      </div>
    </div>
  );
};

export default navbar;
