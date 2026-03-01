import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

const Header: React.FC = () => {
  const { user, business } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="
        top-0 z-50
        bg-gradient-to-r 
        from-blue-600 via-indigo-600 to-blue-500
        dark:from-[#0f172a] dark:via-[#111827] dark:to-black
        text-white
        shadow-lg
        transition-all duration-300
      "
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              HAVY AI Services
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {!user ? (
              <>
                <Link className="nav-link" to="/">
                  Home
                </Link>
                <Link className="nav-link" to="/#pricing">
                  Pricing
                </Link>
                <Link className="nav-link" to="/login">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link className="nav-link" to="/dashboard">
                  Dashboard
                </Link>
                <Link className="nav-link" to="/integrations">
                  Integrations
                </Link>

                {/* Business Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setOpen(!open)}
                    className="
                      flex items-center space-x-2
                      px-3 py-2 rounded-lg
                      hover:bg-white/40 dark:hover:bg-white/10
                      transition
                    "
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {business?.business_name || "My Business"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Animated Dropdown */}
                  <div
                    className={`
                      absolute right-0 mt-3 w-56
                      rounded-xl
                      backdrop-blur-xl
                      bg-white/80 dark:bg-zinc-800/80
                      border border-gray-200 dark:border-zinc-700
                      shadow-xl
                      transform transition-all duration-200
                      ${
                        open
                          ? "opacity-100 translate-y-0 scale-100"
                          : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
                      }
                    `}
                  >
                    <div className="py-2">
                      <DropdownItem
                        label="Update Business"
                        onClick={() => navigate("/dashboard/business")}
                      />
                      <DropdownItem
                        label="Integrations"
                        onClick={() => navigate("/dashboard/integrations")}
                      />
                      <DropdownItem
                        label="Subscription"
                        onClick={() => navigate("/dashboard/billing")}
                      />

                      <div className="border-t border-gray-200 dark:border-zinc-700 my-2" />

                      <DropdownItem
                        label="Logout"
                        danger
                        onClick={handleLogout}
                      />
                    </div>
                  </div>
                </div>

                {/* Keep logout visible */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-red-500 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

const DropdownItem = ({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`
      w-full text-left px-4 py-2 text-sm
      transition
      ${
        danger
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700"
      }
    `}
  >
    {label}
  </button>
);

export default Header;