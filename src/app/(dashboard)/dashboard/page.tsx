"use client";

import { useState, useRef, useEffect } from "react";
import { COLORS } from "@/lib/colors";
import { useAppSelector } from "@/store";
import { useGetProfileQuery } from "@/store/auth.api";
import { useGetScopeEmployeesQuery } from "@/store/hierarchy.api";
import { useGetTodaysFollowupsQuery } from "@/store/leads.api";
import TopBar from "@/components/layout/TopBar";
import CheckInBanner from "@/components/dashboard/CheckInBanner";
import AlertTicker from "@/components/dashboard/AlertTicker";
import LeadCards from "@/components/dashboard/LeadCards";
import QuickAccess from "@/components/dashboard/QuickAccess";
import KRACalendar from "@/components/dashboard/KRACalendar";
import TodaysFollowupModal from "@/components/dashboard/TodaysFollowupModal";
import TargetInfo from "@/components/dashboard/TargetInfo";
import { FiCalendar, FiChevronDown, FiUser } from "react-icons/fi";
import SpecialDayBadge from "@/components/dashboard/SpecialDayBadge";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

/* Designations that can see the staff filter (manager+ roles) */
const MANAGER_DESIGNATIONS = [
  "ADMIN", "VP_SALES", "SALES_COORDINATOR", "GM", "DGM", "AREA_MANAGER", "SALES_MANAGER", "TEAM_LEAD",
];

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ─── Date Range Picker ─── */
function DashboardDatePicker({
  dateRange,
  onChange,
}: {
  dateRange: { startDate: string; endDate: string };
  onChange: (range: { startDate: string; endDate: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const isSame = dateRange.startDate === dateRange.endDate;
  const isToday = isSame && dateRange.startDate === today;
  const displayText = isSame
    ? formatDateShort(dateRange.startDate)
    : `${formatDateShort(dateRange.startDate)} – ${formatDateShort(dateRange.endDate)}`;

  const presets = [
    { label: "Today", get: () => ({ startDate: today, endDate: today }) },
    {
      label: "Yesterday", get: () => {
        const d = new Date(); d.setDate(d.getDate() - 1);
        const s = d.toISOString().split("T")[0];
        return { startDate: s, endDate: s };
      },
    },
    {
      label: "Last 7 Days", get: () => {
        const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 6);
        return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] };
      },
    },
    {
      label: "This Month", get: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] };
      },
    },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", borderRadius: 10,
          border: `1.5px solid ${isToday ? "#27AE6050" : `${COLORS.lavender}60`}`,
          background: isToday ? "#27AE600A" : COLORS.white,
          cursor: "pointer", fontSize: 13, fontWeight: 600,
          color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.2s",
        }}
      >
        <FiCalendar size={14} color={isToday ? "#27AE60" : COLORS.mauve} />
        {displayText}
        <FiChevronDown size={13} color={COLORS.mauve} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
          background: "#fff", borderRadius: 14, padding: 16, minWidth: 280,
          border: `1px solid ${COLORS.lavender}30`,
          boxShadow: "0 12px 36px rgba(26,15,46,0.12)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo, marginBottom: 10 }}>Quick Select</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => { onChange(p.get()); setOpen(false); }}
                style={{
                  padding: "7px 12px", borderRadius: 8, border: `1px solid ${COLORS.lavender}40`,
                  background: COLORS.pearl, cursor: "pointer", fontSize: 12, fontWeight: 600,
                  color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo, marginBottom: 8 }}>Custom Range</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => onChange({ ...dateRange, startDate: e.target.value })}
              style={{
                flex: 1, padding: "7px 10px", borderRadius: 8,
                border: `1px solid ${COLORS.lavender}50`, fontSize: 12,
                fontFamily: "'DM Sans', sans-serif", color: COLORS.darkIndigo,
              }}
            />
            <span style={{ fontSize: 12, color: COLORS.mauve }}>to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => onChange({ ...dateRange, endDate: e.target.value })}
              style={{
                flex: 1, padding: "7px 10px", borderRadius: 8,
                border: `1px solid ${COLORS.lavender}50`, fontSize: 12,
                fontFamily: "'DM Sans', sans-serif", color: COLORS.darkIndigo,
              }}
            />
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: "100%", padding: "8px 0", borderRadius: 8, border: "none",
              background: `linear-gradient(135deg, ${COLORS.mauve}, ${COLORS.mauveDark || COLORS.mauve})`,
              color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Dashboard Page ─── */
export default function DashboardPage() {
  const employee = useAppSelector((s) => s.auth.employee);
  const { data: profile } = useGetProfileQuery();
  const { data: scopeEmployees } = useGetScopeEmployeesQuery();
  const { data: todaysFollowups = [], isLoading: followupsLoading } = useGetTodaysFollowupsQuery();

  const isManager = profile?.designation && MANAGER_DESIGNATIONS.includes(profile.designation);

  const today = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({ startDate: today, endDate: today });
  const [staffId, setStaffId] = useState("");
  const [followupModalOpen, setFollowupModalOpen] = useState(false);

  // Auto-open the today's followup modal on every dashboard visit
  useEffect(() => {
    if (!followupsLoading && todaysFollowups.length > 0) {
      setFollowupModalOpen(true);
    }
  }, [followupsLoading, todaysFollowups.length]);

  return (
    <>
      <TopBar
        title="Property 360 Dashboard"
        subtitle={`Welcome back${employee ? `, ${employee.firstName}` : ""}! Here's what's happening today.`}
      >
        <TutorialButton videoUrl={TUTORIALS.dashboard} />
        <SpecialDayBadge />
        <TargetInfo />
        <CheckInBanner />
      </TopBar>

      <div style={{ padding: "24px 32px" }}>
        {/* Alert ticker */}
        <div style={{ marginBottom: 24, animation: "fadeSlideIn 0.4s ease 0.1s both" }}>
          <AlertTicker />
        </div>

        {/* Lead Management Section */}
        <div
          style={{
            background: COLORS.white,
            borderRadius: 20, padding: 28,
            marginBottom: 28,
            border: `1px solid ${COLORS.lavender}30`,
            boxShadow: "0 2px 16px rgba(26,15,46,0.04)",
            animation: "fadeSlideIn 0.5s ease 0.15s both",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Decorative top gradient line */}
          <div
            style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 4,
              background: `linear-gradient(90deg, ${COLORS.mauve}, ${COLORS.gold}, ${COLORS.mauve})`,
              borderRadius: "20px 20px 0 0",
            }}
          />

          {/* Header with filters */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 20, flexWrap: "wrap", gap: 12,
          }}>
            <h2
              style={{
                margin: 0, fontSize: 22, fontWeight: 800,
                fontFamily: "'Playfair Display', Georgia, serif",
                color: COLORS.darkIndigo,
              }}
            >
              Lead Management
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {/* Date Range Filter */}
              {/* <DashboardDatePicker dateRange={dateRange} onChange={setDateRange} /> */}

              {/* Staff Member Filter */}
              {isManager && scopeEmployees && scopeEmployees.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FiUser size={14} color={COLORS.mauve} />
                  <select
                    value={staffId}
                    onChange={e => setStaffId(e.target.value)}
                    style={{
                      padding: "8px 12px", borderRadius: 10,
                      border: `1.5px solid ${COLORS.lavender}60`,
                      fontSize: 13, fontWeight: 600,
                      background: COLORS.white, color: COLORS.darkIndigo,
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      minWidth: 160,
                    }}
                  >
                    <option value="">All Staff</option>
                    {scopeEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                        {emp.id === employee?.id ? " (You)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <LeadCards onTodaysFollowupClick={() => setFollowupModalOpen(true)} staffId={staffId || undefined} />
        </div>

        {/* Quick Access + KRA */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 28,
          }}
        >
          <QuickAccess />
          <KRACalendar staffId={staffId || undefined} />
        </div>
      </div>

      <TodaysFollowupModal open={followupModalOpen} onClose={() => setFollowupModalOpen(false)} />
    </>
  );
}
