import { FaSearch } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa";
import React from "react";
import GoogleTranslate from "../googleTrans/googleTrans";
import TimeDateDisplay from "../timeDateDisplay/timeDateDisplay";
import { images } from "../../constants";
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import axios from 'axios';

const API_BASE = 'http://localhost/Readora_API';

const Topbar = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [searchText, setSearchText] = useState(searchParams.get('q') || '');
  const [categories, setCategories] = useState(['All']);

  // Fetch categories from the API on mount
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/books.php`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        const cats = [...new Set(data.map((b) => b.category).filter(Boolean))];
        setCategories(['All', ...cats]);
      })
      .catch(() => {
        setCategories(['All']);
      });
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category && category !== 'All') params.set('category', category);
    if (searchText.trim()) params.set('q', searchText.trim());
    const qs = params.toString();
    navigate(qs ? `/search?${qs}` : '/search');
  };

  return (
    <div className="topbar__search grid min-w-0 grid-cols-2 items-center gap-3 px-4 py-3 sm:px-6 lg:flex lg:justify-between lg:px-10 lg:py-0">
      <form
        onSubmit={handleSearch}
        className="topbar__search-caty col-span-2 flex min-w-0 w-full overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm transition focus-within:border-orange-200 focus-within:ring-2 focus-within:ring-orange-100 lg:mx-4 lg:my-5 lg:w-96 lg:flex-shrink-0"
      >
        <div className="relative w-[38%] min-w-[110px] max-w-[170px] flex-shrink-0 border-r border-gray-100 sm:min-w-[130px]">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="w-full cursor-pointer appearance-none truncate bg-gray-50 py-2.5 pl-3 pr-7 text-xs font-semibold text-gray-600 outline-none sm:text-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <FaChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs pointer-events-none" />
        </div>

        <input
          type="text"
          aria-label="Search books"
          placeholder="Search books..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full min-w-0 border-none px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none sm:px-4"
        />

        <button type="submit" aria-label="Submit book search" className="border-none bg-white px-4 py-2.5 text-[#F76B56] transition hover:bg-orange-50">
          <FaSearch />
        </button>
      </form>
      <div className="topbar__googleTrans min-w-0 justify-self-start lg:justify-self-auto">
        <GoogleTranslate />
      </div>
      <div className="topbar__timeDateDisplay min-w-0 max-w-full justify-self-end">
        <TimeDateDisplay />
      </div>
      <div className="topbar__sign-log_btn col-span-2 flex min-w-0 items-center justify-end gap-3 lg:col-span-1">
        {
          user ? (
            <div className="relative inline-block" ref={ref}>
              <div
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 px-2 py-1 bg-[#F7F7FA] rounded-full shadow-md cursor-pointer"
              >
                <img
                  src={images.profile}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="max-w-[35vw] truncate text-sm font-medium text-[#4D4D4D] sm:max-w-48 lg:text-lg">
                  {user.name}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${open ? "rotate-180" : ""
                  }`}
                />
              </div>

              {open && (
                <div className="absolute right-1 mt-3 w-55 bg-white stroke-[#D1D1D1] rounded-2xl shadow-xl p-5 space-y-3 z-10">
                  <div
                    className="text-[#4D4D4D] text-lg cursor-pointer hover:text-black"
                    onClick={() => {
                      setOpen(false);
                      navigate('/profile');
                    }}
                  >
                    Profile
                  </div>
                  <div
                    className="text-[#4D4D4D] text-lg cursor-pointer hover:text-red-500"
                    onClick={logout}
                  >
                    Logout
                  </div>
                </div>
              )}
            </div>
          ) :
            (
              <div className="flex items-center justify-center gap-2">
                <Link to="/login">
                  <button className="px-6 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-full transition">
                    Sign In
                  </button>
                </Link>
                <Link to="/register">
                  <button className="px-6 py-2 text-sm text-red-500 border border-red-500 hover:bg-red-500 hover:text-white rounded-full transition">
                    Register
                  </button>
                </Link>
              </div>
            )
        }
      </div>
    </div>
  );
};

export default Topbar;