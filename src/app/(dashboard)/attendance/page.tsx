"use client";

import { useState } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import {
  useGetMyAttendanceQuery,
  useGetTeamAttendanceQuery,
  useLazyDownloadMyAttendanceQuery,
  useLazyDownloadTeamAttendanceQuery,
} from "@/store/attendance.api";
import { useGetProfileQuery } from "@/store/auth.api";
import { useGetScopeEmployeesQuery } from "@/store/hierarchy.api";
import type { AttendanceRecord, Designation } from "@/types";
import {
  FiMapPin, FiClock, FiChevronLeft, FiChevronRight, FiCalendar,
  FiUsers, FiUser, FiDownload, FiChevronDown,
} from "react-icons/fi";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

const MANAGER_ROLES: Designation[] = [
  "ADMIN", "SALES_COORDINATOR", "VP_SALES", "GM", "DGM",
  "AREA_MANAGER", "SALES_MANAGER", "TEAM_LEAD",
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function getMonthRange(month: number, year: number) {
  const start   = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end     = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate: start, endDate: end };
}

function formatTime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
}

function formatHours(h: number | null | undefined) {
  if (h === null || h === undefined) return "—";
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    PRESENT_FULL: { label: "Full Day", color: COLORS.success, bg: COLORS.successLight },
    FULL_DAY:     { label: "Full Day", color: COLORS.success, bg: COLORS.successLight },
    PRESENT_HALF: { label: "Half Day", color: COLORS.gold,    bg: COLORS.goldLight    },
    HALF_DAY:     { label: "Half Day", color: COLORS.gold,    bg: COLORS.goldLight    },
    ABSENT:       { label: "Absent",   color: COLORS.danger,  bg: COLORS.dangerLight  },
  };
  const s = map[status] ?? { label: status, color: COLORS.mauve, bg: `${COLORS.lavender}30` };
  return (
    <span style={{
      display: "inline-block", padding: "3px 12px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
      border: `1px solid ${s.color}30`,
    }}>
      {s.label}
    </span>
  );
}

// ── Download dropdown ──────────────────────────────────────
type ScopeEmployee = { id: string; firstName: string; lastName: string };

function DropItem({
  icon, label, sublabel, onClick, accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  accent?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 14px", border: "none", cursor: "pointer", textAlign: "left",
        background: hover ? `${COLORS.gold}10` : "transparent",
        fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.12s",
      }}
    >
      <span style={{ color: COLORS.mauve }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: accent ? 700 : 500, color: COLORS.darkIndigo }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: 11, color: COLORS.mauve }}>{sublabel}</div>
        )}
      </div>
    </button>
  );
}

function DownloadMenu({
  tab,
  scopeEmployees,
  onDownloadMine,
  onDownloadEmployee,
  onDownloadAll,
  isDownloading,
}: {
  tab: "my" | "team";
  scopeEmployees?: ScopeEmployee[];
  onDownloadMine: () => void;
  onDownloadEmployee: (id: string, name: string) => void;
  onDownloadAll: () => void;
  isDownloading: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isDownloading}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "9px 16px", borderRadius: 10, border: "none",
          background: isDownloading ? `${COLORS.mauve}40` : COLORS.darkIndigo,
          color: "#fff", cursor: isDownloading ? "not-allowed" : "pointer",
          fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          boxShadow: "0 2px 8px rgba(26,15,46,0.18)", transition: "all 0.15s",
        }}
      >
        <FiDownload size={14} />
        {isDownloading ? "Downloading…" : "Export Excel"}
        <FiChevronDown
          size={13}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
        />
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)",
            background: COLORS.white, borderRadius: 12, minWidth: 230,
            border: `1px solid ${COLORS.lavender}40`,
            boxShadow: "0 8px 32px rgba(26,15,46,0.14)",
            zIndex: 100, overflow: "hidden",
          }}>
            <DropItem
              icon={<FiUser size={13} />}
              label="My Attendance Report"
              onClick={() => { onDownloadMine(); setOpen(false); }}
            />

            {tab === "team" && scopeEmployees && scopeEmployees.length > 0 && (
              <>
                <div style={{
                  padding: "6px 14px 4px",
                  fontSize: 10, fontWeight: 700, color: COLORS.mauve,
                  letterSpacing: "0.6px", textTransform: "uppercase",
                  borderTop: `1px solid ${COLORS.lavender}30`,
                }}>
                  Team Members
                </div>
                <DropItem
                  icon={<FiUsers size={13} />}
                  label="All Team Members"
                  sublabel={`${scopeEmployees.length} employees`}
                  onClick={() => { onDownloadAll(); setOpen(false); }}
                  accent
                />
                {scopeEmployees.map((emp) => (
                  <DropItem
                    key={emp.id}
                    icon={<FiUser size={13} />}
                    label={`${emp.firstName} ${emp.lastName}`}
                    onClick={() => {
                      onDownloadEmployee(emp.id, `${emp.firstName}_${emp.lastName}`);
                      setOpen(false);
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
export default function AttendancePage() {
  const now = new Date();
  const [month, setMonth]               = useState(now.getMonth() + 1);
  const [year, setYear]                 = useState(now.getFullYear());
  const [tab, setTab]                   = useState<"my" | "team">("my");
  const [page, setPage]                 = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const limit = 31;

  const { data: profile }        = useGetProfileQuery();
  const { data: scopeEmployees } = useGetScopeEmployeesQuery();
  const isManager = profile && MANAGER_ROLES.includes(profile.designation);

  const dateRange = getMonthRange(month, year);

  const myResult = useGetMyAttendanceQuery(
    tab === "my" ? { ...dateRange, page, limit } : { startDate: "", endDate: "" },
    { skip: tab !== "my" },
  );
  const teamResult = useGetTeamAttendanceQuery(
    tab === "team" ? { ...dateRange, page, limit } : { startDate: "", endDate: "" },
    { skip: tab !== "team" },
  );

  const [triggerDownloadMine] = useLazyDownloadMyAttendanceQuery();
  const [triggerDownloadTeam] = useLazyDownloadTeamAttendanceQuery();

  const result    = tab === "my" ? myResult : teamResult;
  const records: AttendanceRecord[] = (result.data as AttendanceRecord[]) ?? [];
  const isLoading = result.isLoading;

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setPage(1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setPage(1);
  };

  // ── Blob download helper ──────────────────────────────────
  const saveBlobAs = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href    = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMine = async () => {
    setIsDownloading(true);
    try {
      const blob = await triggerDownloadMine(dateRange).unwrap();
      saveBlobAs(blob, `My_Attendance_${MONTH_NAMES[month - 1]}_${year}.xlsx`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadEmployee = async (employeeId: string, name: string) => {
    setIsDownloading(true);
    try {
      const blob = await triggerDownloadTeam({ ...dateRange, employeeId }).unwrap();
      saveBlobAs(blob, `Attendance_${name}_${MONTH_NAMES[month - 1]}_${year}.xlsx`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      const blob = await triggerDownloadTeam(dateRange).unwrap();
      saveBlobAs(blob, `Team_Attendance_${MONTH_NAMES[month - 1]}_${year}.xlsx`);
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Summary stats ─────────────────────────────────────────
  const fullDays   = records.filter((r) => r.status === "PRESENT_FULL" || r.status === "FULL_DAY").length;
  const halfDays   = records.filter((r) => r.status === "PRESENT_HALF" || r.status === "HALF_DAY").length;
  const absentDays = records.filter((r) => r.status === "ABSENT").length;
  const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);

  return (
    <>
      <TopBar title="Attendance" subtitle="Track check-in, check-out, and working hours">
  <TutorialButton videoUrl={TUTORIALS.attendance} />
</TopBar>

      <div style={{ padding: "24px 32px" }}>
        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Full Days",   value: fullDays,              color: COLORS.success, icon: "✓" },
            { label: "Half Days",   value: halfDays,              color: COLORS.gold,    icon: "½" },
            { label: "Absent",      value: absentDays,            color: COLORS.danger,  icon: "✗" },
            { label: "Total Hours", value: formatHours(totalHours), color: COLORS.mauve, icon: "⏱" },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: COLORS.white, borderRadius: 14, padding: "18px 20px",
                border: `1px solid ${COLORS.lavender}30`,
                boxShadow: "0 2px 8px rgba(26,15,46,0.04)",
                display: "flex", alignItems: "center", gap: 14,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${card.color}12`, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 18, color: card.color, fontWeight: 700,
                border: `1px solid ${card.color}20`,
              }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.darkIndigo }}>{card.value}</div>
                <div style={{ fontSize: 12, color: COLORS.mauve, fontWeight: 600 }}>{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls Row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          {/* Tab Toggle */}
          <div style={{
            display: "flex", background: COLORS.white, borderRadius: 10,
            border: `1px solid ${COLORS.lavender}40`, overflow: "hidden",
          }}>
            <button
              onClick={() => { setTab("my"); setPage(1); }}
              style={{
                padding: "9px 18px", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                background: tab === "my" ? `${COLORS.mauve}15` : "transparent",
                color: tab === "my" ? COLORS.darkIndigo : COLORS.mauve,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <FiUser size={14} /> My Attendance
            </button>
            {isManager && (
              <button
                onClick={() => { setTab("team"); setPage(1); }}
                style={{
                  padding: "9px 18px", border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                  background: tab === "team" ? `${COLORS.mauve}15` : "transparent",
                  color: tab === "team" ? COLORS.darkIndigo : COLORS.mauve,
                  borderLeft: `1px solid ${COLORS.lavender}40`,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <FiUsers size={14} /> Team Attendance
              </button>
            )}
          </div>

          {/* Month Selector */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: COLORS.white, borderRadius: 10, padding: "6px 12px",
            border: `1px solid ${COLORS.lavender}40`,
          }}>
            <button
              onClick={prevMonth}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: COLORS.darkIndigo }}
            >
              <FiChevronLeft size={16} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 140, justifyContent: "center" }}>
              <FiCalendar size={14} color={COLORS.mauve} />
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkIndigo }}>
                {MONTH_NAMES[month - 1]} {year}
              </span>
            </div>
            <button
              onClick={nextMonth}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: COLORS.darkIndigo }}
            >
              <FiChevronRight size={16} />
            </button>
          </div>

          {tab === "team" && scopeEmployees && scopeEmployees.length > 0 && (
            <div style={{ fontSize: 12, color: COLORS.mauve, padding: "8px 0" }}>
              Showing attendance for {scopeEmployees.length} team member{scopeEmployees.length !== 1 ? "s" : ""}
            </div>
          )}

          {/* Export button — pushed to right */}
          <div style={{ marginLeft: "auto" }}>
            <DownloadMenu
              tab={tab}
              scopeEmployees={scopeEmployees as ScopeEmployee[] | undefined}
              onDownloadMine={handleDownloadMine}
              onDownloadEmployee={handleDownloadEmployee}
              onDownloadAll={handleDownloadAll}
              isDownloading={isDownloading}
            />
          </div>
        </div>

        {/* Attendance Table */}
        <div style={{
          background: COLORS.white, borderRadius: 16, overflow: "hidden",
          border: `1px solid ${COLORS.lavender}30`,
          boxShadow: "0 2px 12px rgba(26,15,46,0.04)",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%", borderCollapse: "collapse",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`, color: "#fff" }}>
                  {[
                    ...(tab === "team" ? ["Employee"] : []),
                    "Date", "Check In", "Check In Location",
                    "Check Out", "Check Out Location", "Hours Worked", "Status",
                  ].map((h) => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: "left", fontWeight: 700,
                      fontSize: 12, letterSpacing: "0.3px", whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={tab === "team" ? 8 : 7} style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>
                      Loading attendance records…
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={tab === "team" ? 8 : 7} style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>
                      No attendance records for this period.
                    </td>
                  </tr>
                ) : (
                  records.map((record, i) => (
                    <tr
                      key={record.id}
                      style={{
                        borderBottom: `1px solid ${COLORS.lavender}20`,
                        background: i % 2 === 0 ? "#fff" : `${COLORS.pearl}80`,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = `${COLORS.gold}08`)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : `${COLORS.pearl}80`)}
                    >
                      {tab === "team" && (
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: COLORS.darkIndigo }}>
                          {record.employee
                            ? `${record.employee.firstName} ${record.employee.lastName}`
                            : record.employeeId.slice(0, 8)}
                        </td>
                      )}
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: COLORS.darkIndigo, whiteSpace: "nowrap" }}>
                        {formatDate(record.date)}
                      </td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: record.checkInAt ? COLORS.success : COLORS.mauve }}>
                          <FiClock size={13} />
                          {formatTime(record.checkInAt)}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.mauve, maxWidth: 200 }}>
                        {record.checkInLocation ? (
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                            <FiMapPin size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: 180 }}>
                              {record.checkInLocation}
                            </span>
                          </div>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: record.checkOutAt ? COLORS.danger : COLORS.mauve }}>
                          <FiClock size={13} />
                          {formatTime(record.checkOutAt)}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.mauve, maxWidth: 200 }}>
                        {record.checkOutLocation  ? (
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                            <FiMapPin size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: 180 }}>
                              {record.checkOutLocation}
                            </span>
                          </div>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: COLORS.darkIndigo }}>
                        {formatHours(record.hoursWorked)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <StatusBadge status={record.status ?? ""} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}