"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store";
import { clearAuth } from "@/store/authSlice";
import { useLogoutMutation, useGetProfileQuery } from "@/store/auth.api";
import { COLORS } from "@/lib/colors";
import {
  FiHome, FiClipboard, FiDatabase, FiStar, FiUserPlus,
  FiDollarSign, FiTarget, FiPackage, FiUsers, FiMapPin,
  FiUser, FiBarChart2, FiLayers, FiFileText, FiGitBranch,
  FiShield, FiLogOut, FiChevronLeft, FiChevronRight,
  FiMessageSquare,
} from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";

const NAV_ITEMS = [
  { icon: FiHome, label: "Home", path: "/dashboard" },
  { icon: FiClipboard, label: "Attendance", path: "/attendance" },
  { icon: FiDatabase, label: "Leads Bank", path: "/leads" },
  { icon: FiStar, label: "New Leads", path: "/new-leads" },
  { icon: FiMessageSquare, label: "WhatsApp Template", path: "/whatsapp-template" },
  { icon: FiUserPlus, label: "Add Employee", path: "/employees", roles: ["ADMIN", "SALES_COORDINATOR"] },
  { icon: TbCurrencyRupee, label: "Expense", path: "/expenses", roles: ["ADMIN", "SALES_COORDINATOR"] },
  { icon: FiTarget, label: "Target Vs Achieve", path: "/targets" },
  { icon: FiPackage, label: "Inventory", path: "/inventory" },
  { icon: FiUsers, label: "Customers", path: "/customers" },
  { icon: FiMapPin, label: "Staff Location", path: "/staff-location", roles: ["ADMIN"] },
  { icon: FiUser, label: "Profile", path: "/profile" },
  { icon: FiBarChart2, label: "Reports", path: "/reports" },
  { icon: FiLayers, label: "Project Details", path: "/projects", roles: ["ADMIN"] },
  { icon: FiFileText, label: "Terms & Conditions", path: "/terms" },
  { icon: FiGitBranch, label: "Hierarchy", path: "/hierarchy" },
  { icon: FiShield, label: "Privacy Policy", path: "/privacy" },
];

export default function Sidebar({ onCollapseChange }: { onCollapseChange?: (collapsed: boolean) => void } = {}) {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { employee } = useAppSelector((s) => s.auth);
  const { data: profile } = useGetProfileQuery();
  const [doLogout] = useLogoutMutation();
  const designation = profile?.designation || employee?.designation;

  useEffect(() => {
    onCollapseChange?.(collapsed);
  }, [collapsed, onCollapseChange]);

  const filteredNav = NAV_ITEMS.filter(
    (item) => !item.roles || (designation && item.roles.includes(designation))
  );

  const handleLogout = async () => {
    try { await doLogout().unwrap(); } catch { /* ignore */ }
    dispatch(clearAuth());
    router.push("/login");
  };

  return (
    <div
      style={{
        width: collapsed ? 72 : 250,
        minHeight: "100vh",
        background: `linear-gradient(195deg, ${COLORS.darkIndigo} 0%, #2D1B4E 50%, ${COLORS.mauveDark} 100%)`,
        transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0, top: 0, bottom: 0,
        zIndex: 100,
        overflow: "hidden",
        boxShadow: "4px 0 24px rgba(26,15,46,0.3)",
      }}
    >
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 40 }} className ={"flex justify-center items-center mt-4 ml-1 mr-1"}>
          <img
            src="/property360squareNoBg.png"
            alt="Property 360 - A Higher Form of Realty"
            style={{
              maxWidth: 280,
              width: "100%",
              height: "auto",
              filter: "brightness(0) invert(1)",  // Makes logo white to show on dark background
              objectFit: "contain",
            }}
          />
        </div>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "none", color: COLORS.lavender,
          padding: "10px", margin: "8px 12px", borderRadius: 8,
          cursor: "pointer", fontSize: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "all 0.2s",
        }}
      >
        {collapsed ? <FiChevronRight /> : <><FiChevronLeft /> Collapse</>}
      </button>

      {/* Nav */}
      <div
        style={{
          flex: 1, overflowY: "auto", padding: "8px",
          scrollbarWidth: "thin",
          scrollbarColor: `${COLORS.mauve} transparent`,
        }}
      >
        {filteredNav.map((item, i) => {
          const active = pathname === item.path || pathname.startsWith(item.path + "/");
          const Icon = item.icon;
          return (
            <div
              key={item.path}
              onClick={() => router.push(item.path)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: collapsed ? "12px 16px" : "11px 16px",
                margin: "2px 0", borderRadius: 10,
                cursor: "pointer",
                background: active
                  ? `linear-gradient(135deg, ${COLORS.gold}22 0%, ${COLORS.gold}11 100%)`
                  : hovered === i ? "rgba(255,255,255,0.06)" : "transparent",
                borderLeft: active ? `3px solid ${COLORS.gold}` : "3px solid transparent",
                transition: "all 0.2s ease",
                position: "relative",
              }}
            >
              <Icon
                size={18}
                style={{
                  flexShrink: 0,
                  color: active ? COLORS.gold : "rgba(255,255,255,0.6)",
                }}
              />
              {!collapsed && (
                <span
                  style={{
                    fontSize: 13.5, fontWeight: active ? 700 : 500,
                    color: active ? COLORS.gold : "rgba(255,255,255,0.7)",
                    letterSpacing: "0.2px", whiteSpace: "nowrap",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {item.label}
                </span>
              )}
              {active && (
                <div
                  style={{
                    position: "absolute", right: 12, width: 6, height: 6,
                    borderRadius: "50%", background: COLORS.gold,
                    boxShadow: `0 0 8px ${COLORS.gold}`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom user section */}
      <div
        style={{
          borderTop: "1px solid rgba(201,168,192,0.15)",
          padding: 0,
        }}
      >
        {/* Logout button */}
        <button
          onClick={handleLogout}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(192,57,43,0.15)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: collapsed ? "12px 16px" : "11px 16px",
            margin: 0, border: "none", cursor: "pointer", borderRadius: 0,
            background: "transparent", color: COLORS.dangerLight,
            transition: "all 0.2s", fontSize: 13.5,
          }}
        >
          <FiLogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontWeight: 600 }}>Logout</span>}
        </button>

        {/* User info */}
        <div
          style={{
            padding: collapsed ? "16px 12px" : "16px 20px",
            display: "flex", alignItems: "center", gap: 10,
            borderTop: "1px solid rgba(201,168,192,0.1)",
          }}
        >
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${COLORS.mauve}, ${COLORS.lavender})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: COLORS.white, flexShrink: 0,
            }}
          >
            {employee?.firstName?.[0] || "P"}
            {employee?.lastName?.[0] || "3"}
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white }}>
                {employee ? `${employee.firstName} ${employee.lastName}` : "PROPERTY 360"}
              </div>
              <div style={{ fontSize: 11, color: COLORS.lavender }}>
                {designation?.replace(/_/g, " ") || ""}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
