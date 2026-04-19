import React, { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  User,
  Folder,
  Users,
  HelpCircle,
  Download,
  CalendarDays,
  ChevronRight,
  Plus,
  HardDrive,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Sidebar Nav Item ────────────────────────────────────────────────────────
const SidebarItem = ({ icon: Icon, label, path, active, onClick }) => (
  <Link
    to={path}
    onClick={onClick}
    className="sidebar-item-link"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "10px 14px",
      borderRadius: "10px",
      textDecoration: "none",
      transition: "all 0.2s ease",
      position: "relative",
      marginBottom: "2px",
      background: active
        ? "linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.2) 100%)"
        : "transparent",
      boxShadow: active ? "0 0 16px rgba(99,102,241,0.25)" : "none",
      border: active
        ? "1px solid rgba(99,102,241,0.3)"
        : "1px solid transparent",
      color: active ? "#c7d2fe" : "rgba(148,163,184,0.85)",
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = "rgba(99,102,241,0.12)";
        e.currentTarget.style.color = "#c7d2fe";
        e.currentTarget.style.border = "1px solid rgba(99,102,241,0.15)";
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "rgba(148,163,184,0.85)";
        e.currentTarget.style.border = "1px solid transparent";
      }
    }}
  >
    <Icon
      size={17}
      style={{
        color: active ? "#818cf8" : "rgba(148,163,184,0.7)",
        flexShrink: 0,
      }}
    />
    <span
      style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
        fontSize: "13.5px",
        letterSpacing: "0.01em",
      }}
    >
      {label}
    </span>
    {active && (
      <motion.div
        layoutId="active-indicator"
        style={{
          position: "absolute",
          left: 0,
          top: "20%",
          height: "60%",
          width: "3px",
          background: "linear-gradient(180deg, #818cf8, #6366f1)",
          borderRadius: "0 4px 4px 0",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
    )}
  </Link>
);

// ── Section Label ────────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <p
    style={{
      fontFamily: "Inter, sans-serif",
      fontSize: "10px",
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "rgba(100,116,139,0.7)",
      padding: "0 14px",
      marginBottom: "6px",
      marginTop: "4px",
    }}
  >
    {children}
  </p>
);

// ── Main Layout ──────────────────────────────────────────────────────────────
const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Folder, label: "All Projects", path: "/projects" },
  ];

  if (user?.role === "admin") {
    menuItems.push({ icon: Users, label: "Team Management", path: "/team" });
  }

  const sidebarGradient =
    "linear-gradient(180deg, #0F172A 0%, #1a1040 55%, #1E1B4B 100%)";

  const SidebarContent = ({ onItemClick }) => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Navigation */}
      <nav style={{ flex: 1, padding: "20px 12px", overflowY: "auto" }}>
        <SectionLabel>Main Menu</SectionLabel>
        {menuItems.map((item) => (
          <SidebarItem
            key={item.path}
            {...item}
            active={location.pathname === item.path}
            onClick={onItemClick}
          />
        ))}
      </nav>

      {/* Bottom Section */}
      <div
        style={{
          padding: "12px 12px 16px",
          borderTop: "1px solid rgba(99,102,241,0.12)",
        }}
      >
        {/* Storage widget */}
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            background: "rgba(15,23,42,0.6)",
            border: "1px solid rgba(99,102,241,0.15)",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <HardDrive size={13} style={{ color: "rgba(148,163,184,0.6)" }} />
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                color: "rgba(148,163,184,0.7)",
                fontWeight: 500,
              }}
            >
              Storage Usage
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                color: "#818cf8",
                fontWeight: 600,
              }}
            >
              84%
            </span>
          </div>
          <div
            style={{
              height: "4px",
              background: "rgba(99,102,241,0.15)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "84%",
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>

        {/* New Project Button */}
        <button
          onClick={() => navigate("/projects")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            width: "100%",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            border: "none",
            cursor: "pointer",
            color: "white",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
            transition: "all 0.2s ease",
            marginBottom: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              "0 6px 20px rgba(99,102,241,0.55)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(99,102,241,0.4)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Plus size={15} />
          New Project
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            padding: "9px 14px",
            borderRadius: "10px",
            background: "transparent",
            border: "1px solid transparent",
            cursor: "pointer",
            color: "rgba(148,163,184,0.6)",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: "13px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
            e.currentTarget.style.color = "#fca5a5";
            e.currentTarget.style.border = "1px solid rgba(239,68,68,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(148,163,184,0.6)";
            e.currentTarget.style.border = "1px solid transparent";
          }}
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#f8fafc",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Responsive sidebar style */}
      <style>{`
        .sidebar-desktop {
          display: none;
          width: 240px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #0F172A 0%, #1a1040 55%, #1E1B4B 100%);
          border-right: 1px solid rgba(99,102,241,0.15);
          position: relative;
          z-index: 10;
          box-shadow: 4px 0 24px rgba(15,23,42,0.3);
        }
        @media (min-width: 768px) {
          .sidebar-desktop { display: flex; flex-direction: column; }
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "#000",
                zIndex: 40,
              }}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "240px",
                background: sidebarGradient,
                zIndex: 50,
                boxShadow: "8px 0 32px rgba(15,23,42,0.5)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <button
                onClick={() => setIsSidebarOpen(false)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "rgba(99,102,241,0.15)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                <X size={18} />
              </button>
              <SidebarContent onItemClick={() => setIsSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Subtle gradient blobs in background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-15%",
              left: "-5%",
              width: "50%",
              height: "50%",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-15%",
              right: "-5%",
              width: "50%",
              height: "50%",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, rgba(139,92,246,0.05) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>

        {/* Top Navbar */}
        <header
          style={{
            height: "70px",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(226,232,240,0.8)",
            position: "sticky",
            top: 0,
            zIndex: 50,
            boxShadow: "0 1px 12px rgba(15,23,42,0.06)",
            flexShrink: 0,
          }}
        >
          {/* Left side */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                    color: "#1e293b",
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
                    color: "#94a3b8",
                  }}
                >
                  Orchestrator
                </span>
              </div>
            </div>
            {/* Mobile menu button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                padding: "6px",
              }}
            >
              <Menu size={22} />
            </button>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Date range */}
            <button
              className="hidden md:flex"
              style={{
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                cursor: "pointer",
                color: "#374151",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                display: "flex",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <CalendarDays size={14} style={{ color: "#6366f1" }} />
              Last 30 Days
            </button>

            {/* Export */}
            <button
              className="hidden md:flex"
              style={{
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                color: "#fff",
                fontSize: "13px",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                display: "flex",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 14px rgba(99,102,241,0.45)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(99,102,241,0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Download size={14} />
              Export
            </button>

            {/* Divider */}
            <div
              style={{
                width: "1px",
                height: "28px",
                background: "#e2e8f0",
                margin: "0 4px",
              }}
              className="hidden md:block"
            />

            {/* Help icon */}
            <button
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "10px",
                color: "#64748b",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.color = "#6366f1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              <HelpCircle size={19} />
            </button>

            {/* Divider */}
            <div
              style={{
                width: "1px",
                height: "28px",
                background: "#e2e8f0",
                margin: "0 4px",
              }}
              className="hidden md:block"
            />

            {/* User Avatar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                paddingLeft: "2px",
              }}
            >
              <div className="hidden sm:block" style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#1e293b",
                    margin: 0,
                    lineHeight: 1.3,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {user?.fullName || user?.name || "Admin"}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    margin: 0,
                    fontFamily: "Inter, sans-serif",
                    textTransform: "capitalize",
                  }}
                >
                  {user?.role || "User"}
                </p>
              </div>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "14px",
                  boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
                  fontFamily: "Inter, sans-serif",
                  flexShrink: 0,
                }}
              >
                {user?.fullName || user?.name ? (
                  (user.fullName || user.name).charAt(0).toUpperCase()
                ) : (
                  <User size={18} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "28px 32px",
            position: "relative",
            zIndex: 10,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
