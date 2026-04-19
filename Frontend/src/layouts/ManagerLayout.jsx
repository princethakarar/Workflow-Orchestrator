import React, { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Avatar from "../components/common/Avatar";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Folder,
  Users,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SidebarItem = ({ icon: Icon, label, path, active, onClick }) => (
  <Link
    to={path}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
      active
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
        : "hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
    }`}
    style={{ color: active ? "#fff" : "var(--text-secondary)" }}
  >
    <Icon size={20} style={{ color: active ? "#fff" : "var(--text-muted)" }} />
    <span className="font-medium">{label}</span>
    {active && (
      <motion.div
        layoutId="active-pill-manager"
        className="absolute left-0 w-1 h-8 bg-indigo-600 rounded-r-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
    )}
  </Link>
);

const ManagerLayout = () => {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/manager/dashboard" },
    { icon: Folder, label: "My Projects", path: "/manager/projects" },
    { icon: Users, label: "My Team", path: "/manager/team" },
  ];

  const sidebarStyle = {
    background: "var(--bg-sidebar)",
    borderRight: "1px solid var(--border)",
  };

  const headerStyle = {
    background: "var(--bg-header)",
    borderBottom: "1px solid var(--border)",
    backdropFilter: "blur(12px)",
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden font-sans"
      style={{ background: "var(--bg-page)" }}
    >
      {/* Top Header (full width) */}
      <header
        className="h-16 px-6 flex items-center justify-between relative z-50 shrink-0"
        style={headerStyle}
      >
        <div className="flex items-center gap-3">
          <img
            src="/workflow-orchestrator-icon.svg"
            alt="Workflow Orchestrator"
            style={{ height: "40px", width: "auto", flexShrink: 0 }}
          />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: "15px",
                letterSpacing: "0.01em",
                color: "var(--text-header)",
              }}
            >
              Workflow
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: "13px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              Orchestrator
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{
              color: "var(--text-secondary)",
              background: "transparent",
            }}
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* ── Theme Toggle ── */}
          <motion.button
            onClick={toggle}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isDark
                ? "rgba(99,102,241,0.15)"
                : "rgba(99,102,241,0.08)",
              border: "1px solid var(--border)",
              color: "#6366f1",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.span
                  key="sun"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun size={17} />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon size={17} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <div
            className="h-8 w-px hidden md:block"
            style={{ background: "var(--border)" }}
          />

          {/* Profile Avatar dropdown/link */}
          <Link
            to="/manager/profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              padding: "4px 8px",
              borderRadius: "10px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = isDark
                ? "rgba(99,102,241,0.1)"
                : "rgba(99,102,241,0.06)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold" style={{ color: "var(--text-header)" }}>
                {user?.fullName || user?.name}
              </p>
              <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                Project Manager
              </p>
            </div>
            <div
              title="View Profile"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                overflow: "hidden",
                boxShadow: "0 2px 6px rgba(99,102,241,0.25)",
                flexShrink: 0,
              }}
            >
              <Avatar
                name={
                  user?.fullName ||
                  user?.username ||
                  user?.email ||
                  user?.name
                }
                imageUrl={user?.avatar}
                seed={user?._id || user?.id || user?.email || user?.username}
                size={40}
              />
            </div>
          </Link>
        </div>
      </header>

      {/* Body (sidebar starts after header) */}
      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside
        className="hidden md:flex flex-col w-64 relative z-10"
        style={sidebarStyle}
      >
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              {...item}
              active={location.pathname === item.path}
            />
          ))}
        </nav>

        <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
            style={{ color: "var(--text-secondary)" }}
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-16 bottom-0 w-64 shadow-2xl z-50 md:hidden flex flex-col"
              style={sidebarStyle}
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/workflow-orchestrator-logo.svg"
                    alt="Workflow Orchestrator"
                    className="h-16 w-auto"
                  />
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 700,
                        fontSize: "15px",
                        letterSpacing: "0.01em",
                        color: "var(--text-header)",
                      }}
                    >
                      Workflow
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 600,
                        fontSize: "13px",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                      }}
                    >
                      Orchestrator
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  style={{ color: "var(--text-secondary)" }}
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item) => (
                  <SidebarItem
                    key={item.path}
                    {...item}
                    active={location.pathname === item.path}
                    onClick={() => setIsSidebarOpen(false)}
                  />
                ))}
              </nav>

              <div
                className="p-4"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div
            className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] ${isDark ? "bg-indigo-900/10" : "bg-indigo-50/50"}`}
          />
          <div
            className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] ${isDark ? "bg-blue-900/10" : "bg-blue-50/50"}`}
          />
        </div>

        {/* Page Content */}
        <main className="h-full overflow-auto p-6 relative z-10">
          <Outlet />
        </main>
      </div>
      </div>
    </div>
  );
};

export default ManagerLayout;
