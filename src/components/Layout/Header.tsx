import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { ThemeContext } from "../../contexts/ThemeContext";
import { ThemeMode } from "../../utils/timeTheme";

// ─── 3-Position Sliding Theme Toggle ─────────────────────────────────────────

const MODES: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: "light", icon: "☀️", label: "Light" },
  { mode: "dark", icon: "🌙", label: "Dark" },
  { mode: "time", icon: "🕐", label: "Auto" },
];

const ThemeToggle: React.FC = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) return null;
  const { mode, setMode } = ctx;
  const idx = MODES.findIndex(m => m.mode === mode);

  return (
    <div className="relative flex items-center">
      {/* Track */}
      <div className="
        relative flex items-center
        bg-white/10 backdrop-blur-sm
        border border-white/20
        rounded-full p-0.5
        shadow-inner
        select-none
      ">
        {/* Animated thumb */}
        <div
          className="
            absolute h-7 rounded-full
            bg-white/25 border border-white/40
            shadow-md backdrop-blur-sm
            transition-all duration-300 ease-in-out
          "
          style={{
            width: "calc(33.333% - 2px)",
            left: `calc(${idx * 33.333}% + 1px)`,
          }}
        />

        {/* Mode buttons */}
        {MODES.map(({ mode: m, icon, label }, i) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-label={`Switch to ${label} mode`}
            title={label}
            className={`
              relative z-10 flex items-center gap-1 px-2.5 py-1
              rounded-full text-xs font-semibold
              transition-colors duration-200 whitespace-nowrap
              ${idx === i ? "text-white" : "text-white/55 hover:text-white/85"}
            `}
          >
            <span className={`text-sm leading-none transition-transform duration-200 ${idx === i ? "scale-110" : ""}`}>
              {icon}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
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
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="
      top-0 z-50
      bg-gradient-to-r
      from-[#0f1729] via-[#1a2540] to-[#0f1729]
      dark:from-[#070b14] dark:via-[#0d1220] dark:to-[#070b14]
      border-b border-white/8
      text-white
      shadow-[0_2px_24px_rgba(0,0,0,0.35)]
      backdrop-blur-md
      transition-all duration-300
    ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Bot className="w-8 h-8 text-indigo-400" />
            <span className="text-xl font-bold text-white tracking-tight">HAVY AI Services</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <NavLink to="/">Home</NavLink>
                <NavLink to="/#pricing">Pricing</NavLink>
                <NavLink to="/login">Login</NavLink>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all duration-200 shadow-sm"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/integrations">Integrations</NavLink>

                {/* Business Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setOpen(!open)}
                    className="
                      flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                      text-white/80 hover:text-white hover:bg-white/8
                      transition-all duration-200
                    "
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">{business?.business_name || "My Business"}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                  </button>

                  <div className={`
                    absolute right-0 mt-3 w-56 rounded-xl
                    bg-[#1a2540]/90 backdrop-blur-xl
                    border border-white/10
                    shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                    transform transition-all duration-200
                    ${open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95 pointer-events-none"}
                  `}>
                    <div className="py-2">
                      <DropdownItem label="Update Business" onClick={() => navigate("/dashboard/business")} />
                      <DropdownItem label="Integrations" onClick={() => navigate("/dashboard/integrations")} />
                      <DropdownItem label="Subscription" onClick={() => navigate("/dashboard/billing")} />
                      <div className="border-t border-white/10 my-2" />
                      <DropdownItem label="Logout" danger onClick={handleLogout} />
                    </div>
                  </div>
                </div>

                {/* Logout pill */}
                <button
                  onClick={handleLogout}
                  className="
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    border border-white/15 bg-white/8
                    hover:bg-red-500/70 hover:border-red-400/60
                    text-white/70 hover:text-white
                    text-sm font-medium
                    transition-all duration-200
                  "
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            )}

            {/* ── Theme Slider – always last ── */}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <Link
    to={to}
    className="text-sm text-white/70 hover:text-white font-medium transition-colors duration-150"
  >
    {children}
  </Link>
);

const DropdownItem = ({
  label, onClick, danger = false,
}: { label: string; onClick: () => void; danger?: boolean }) => (
  <button
    onClick={onClick}
    className={`
      w-full text-left px-4 py-2 text-sm transition-colors duration-150
      ${danger
        ? "text-red-400 hover:bg-red-500/20"
        : "text-white/75 hover:text-white hover:bg-white/8"
      }
    `}
  >
    {label}
  </button>
);

export default Header;