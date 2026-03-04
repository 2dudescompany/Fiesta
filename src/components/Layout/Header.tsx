import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { ThemeContext } from "../../contexts/ThemeContext";
import { ThemeMode } from "../../utils/timeTheme";

// ─── Theme Toggle ────────────────────────────────────────────────────────────

const modeConfig: Record<
  ThemeMode,
  { icon: string; label: string; next: ThemeMode; tooltip: string; color: string }
> = {
  light: {
    icon: "🌤",
    label: "Light",
    next: "dark",
    tooltip: "Switch to Dark mode",
    color: "bg-amber-400/20 border-amber-300/40 hover:bg-amber-400/30",
  },
  dark: {
    icon: "🌑",
    label: "Dark",
    next: "time",
    tooltip: "Switch to Auto (time-based)",
    color: "bg-indigo-600/30 border-indigo-400/40 hover:bg-indigo-600/40",
  },
  time: {
    icon: "✨",
    label: "Auto",
    next: "light",
    tooltip: "Switch to Light mode",
    color: "bg-violet-500/25 border-violet-400/40 hover:bg-violet-500/35",
  },
};

const ThemeToggle: React.FC = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) return null;
  const { mode, setMode } = ctx;
  const config = modeConfig[mode];

  return (
    <div className="relative group">
      <button
        onClick={() => setMode(config.next)}
        aria-label={`Theme: ${config.label}. ${config.tooltip}`}
        className={`
          flex items-center gap-1.5
          px-3 py-1.5 rounded-full
          text-sm font-semibold text-white
          border backdrop-blur-sm
          shadow-sm hover:shadow-md
          transition-all duration-200 select-none
          ${config.color}
        `}
      >
        <span className="text-base leading-none transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" aria-hidden>
          {config.icon}
        </span>
        <span className="hidden sm:inline tracking-wide">{config.label}</span>
      </button>

      {/* Tooltip */}
      <div className="
        pointer-events-none absolute right-0 top-full mt-2
        px-2.5 py-1 rounded-lg
        bg-gray-900/90 text-white text-xs whitespace-nowrap
        opacity-0 group-hover:opacity-100
        translate-y-1 group-hover:translate-y-0
        transition-all duration-150 shadow-lg z-50
      ">
        {config.tooltip}
      </div>
    </div>
  );
};

// ─── Header ──────────────────────────────────────────────────────────────────

const Header: React.FC = () => {
  const { user, business } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

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

          {/* Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            {!user ? (
              <>
                <Link className="nav-link" to="/">Home</Link>
                <Link className="nav-link" to="/#pricing">Pricing</Link>
                <Link className="nav-link" to="/login">Login</Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link className="nav-link" to="/dashboard">Dashboard</Link>
                <Link className="nav-link" to="/integrations">Integrations</Link>

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
                      className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  <div
                    className={`
                      absolute right-0 mt-3 w-56
                      rounded-xl backdrop-blur-xl
                      bg-white/80 dark:bg-zinc-800/80
                      border border-gray-200 dark:border-zinc-700
                      shadow-xl
                      transform transition-all duration-200
                      ${open
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
                      }
                    `}
                  >
                    <div className="py-2">
                      <DropdownItem label="Update Business" onClick={() => navigate("/dashboard/business")} />
                      <DropdownItem label="Integrations" onClick={() => navigate("/dashboard/integrations")} />
                      <DropdownItem label="Subscription" onClick={() => navigate("/dashboard/billing")} />
                      <div className="border-t border-gray-200 dark:border-zinc-700 my-2" />
                      <DropdownItem label="Logout" danger onClick={handleLogout} />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg
                    border border-white/30 bg-white/10 hover:bg-red-500/80 hover:border-red-400
                    text-white text-sm font-medium
                    transition-all duration-200 backdrop-blur-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            )}
            {/* ── Theme Toggle – always last ── */}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
};

// ─── Dropdown Item ────────────────────────────────────────────────────────────

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
      w-full text-left px-4 py-2 text-sm transition
      ${danger
        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700"
      }
    `}
  >
    {label}
  </button>
);

export default Header;