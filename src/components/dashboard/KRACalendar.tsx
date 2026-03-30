"use client";

import { useState } from "react";
import { COLORS } from "@/lib/colors";
import { useGetDailyCallActivityQuery } from "@/store/reports.api";
import { useAppSelector } from "@/store";
import { useGetScopeEmployeesQuery } from "@/store/hierarchy.api";

interface DayData {
  date: string;
  callsMade: number;
  callTarget: number;
}

/* Shows "Daily Activity — Staff Name" based on selected staff */
function KRASubtitle({ staffId, employee }: { staffId?: string; employee: any }) {
  const { data: scopeEmployees } = useGetScopeEmployeesQuery();
  let displayName = employee ? `${employee.firstName} ${employee.lastName}` : "";
  if (staffId && scopeEmployees) {
    const found = scopeEmployees.find((e: any) => e.id === staffId);
    if (found) displayName = `${found.firstName} ${found.lastName}`;
  } else if (!staffId) {
    displayName = employee ? `${employee.firstName} ${employee.lastName}` : "All Staff";
  }
  return (
    <div style={{ fontSize: 12, color: COLORS.mauve, marginTop: 2 }}>
      Daily Activity — <span style={{ fontWeight: 700 }}>{displayName}</span>
    </div>
  );
}

/* ── Daily Call Detail Modal ────────────────────────────────────── */
function DailyCallModal({
  dayData,
  dateStr,
  onClose,
}: {
  dayData: DayData;
  dateStr: string;
  onClose: () => void;
}) {
  const achieved = dayData.callsMade >= dayData.callTarget && dayData.callTarget > 0;
  const pct = dayData.callTarget > 0
    ? Math.min(Math.round((dayData.callsMade / dayData.callTarget) * 100), 999)
    : 0;

  // Format date nicely
  const d = new Date(dateStr);
  const day = d.getDate();
  const suffix = [, "st", "nd", "rd"][day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10 ? day % 10 : 0)] || "th";
  const formatted = `${day}${suffix} ${d.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(26,15,46,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, padding: 28, width: 340,
          boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14, background: "none",
            border: "none", cursor: "pointer", fontSize: 18, color: COLORS.mauve,
          }}
        >
          ✕
        </button>

        {/* Date */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 13, color: COLORS.mauve, fontWeight: 600, marginBottom: 2 }}>Daily Summary</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.darkIndigo, fontFamily: "'Playfair Display', Georgia, serif" }}>
            {formatted}
          </div>
        </div>

        {/* Stats boxes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div style={{
            padding: "14px 16px", borderRadius: 12, textAlign: "center",
            background: `${COLORS.mauve}08`, border: `1px solid ${COLORS.mauve}20`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.mauve, fontWeight: 600, marginBottom: 4 }}>Daily Target</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.darkIndigo, fontFamily: "'Playfair Display', serif" }}>
              {dayData.callTarget}
            </div>
          </div>
          <div style={{
            padding: "14px 16px", borderRadius: 12, textAlign: "center",
            background: achieved ? `${COLORS.success}08` : `${COLORS.danger}08`,
            border: `1px solid ${achieved ? `${COLORS.success}20` : `${COLORS.danger}20`}`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.mauve, fontWeight: 600, marginBottom: 4 }}>Calls Made</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: achieved ? COLORS.success : COLORS.danger, fontFamily: "'Playfair Display', serif" }}>
              {dayData.callsMade}
            </div>
          </div>
        </div>

        {/* Achievement status */}
        <div style={{
          padding: "12px 16px", borderRadius: 12, textAlign: "center", marginBottom: 14,
          background: achieved ? `${COLORS.success}10` : `${COLORS.danger}10`,
          border: `1.5px solid ${achieved ? `${COLORS.success}30` : `${COLORS.danger}30`}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{achieved ? "✅" : "🔥"}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: achieved ? COLORS.success : COLORS.danger }}>
              {achieved ? "Target Achieved!" : "Target Not Met"}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: COLORS.mauve, fontWeight: 600 }}>Completion</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: achieved ? COLORS.success : COLORS.danger }}>{pct}%</span>
          </div>
          <div style={{ height: 10, borderRadius: 99, background: `${COLORS.lavender}30`, overflow: "hidden" }}>
            <div style={{
              width: `${Math.min(pct, 100)}%`, height: "100%", borderRadius: 99,
              background: achieved
                ? `linear-gradient(90deg, ${COLORS.success}, #2ECC71)`
                : `linear-gradient(90deg, ${COLORS.danger}, #E74C3C)`,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: 11, borderRadius: 10, border: "none",
            background: COLORS.darkIndigo, color: "#fff", fontSize: 13,
            fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ── Main KRA Calendar ─────────────────────────────────────────── */
export default function KRACalendar({ staffId }: { staffId?: string } = {}) {
  const [month, setMonth] = useState(() => new Date().getMonth()); // 0-indexed
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<{ data: DayData; dateStr: string } | null>(null);
  const employee = useAppSelector((s) => s.auth.employee);

  const queryParams: { month: number; year: number; employeeId?: string } = { month: month + 1, year };
  if (staffId) queryParams.employeeId = staffId;
  const { data, isLoading } = useGetDailyCallActivityQuery(queryParams);

  // Build day data map from API response
  const dayMap: Record<number, DayData> = {};
  const dayStatuses: Record<number, "achieved" | "not_met" | "no_data"> = {};
  if (data && typeof data === "object" && "buckets" in data) {
    const buckets = (data as { buckets: DayData[] }).buckets;
    if (Array.isArray(buckets)) {
      buckets.forEach((b: DayData) => {
        const d = new Date(b.date);
        const day = d.getDate();
        dayMap[day] = b;
        if (b.callsMade >= b.callTarget && b.callTarget > 0) {
          dayStatuses[day] = "achieved";
        } else if (b.callTarget > 0) {
          dayStatuses[day] = "not_met";
        } else {
          dayStatuses[day] = "no_data";
        }
      });
    }
  }

  const today = new Date();
  const todayDay = today.getMonth() === month && today.getFullYear() === year ? today.getDate() : -1;
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const handleDayClick = (day: number) => {
    const d = dayMap[day];
    if (d) {
      setSelectedDay({ data: d, dateStr: d.date });
    }
  };

  return (
    <>
      <div
        style={{
          background: COLORS.white, borderRadius: 18, padding: 24,
          border: `1px solid ${COLORS.lavender}40`,
          boxShadow: "0 2px 12px rgba(26,15,46,0.04)",
          animation: "fadeSlideIn 0.6s ease 0.5s both",
          opacity: isLoading ? 0.6 : 1,
          transition: "opacity 0.3s",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div>
            <h3
              style={{
                fontSize: 18, fontWeight: 800, color: COLORS.darkIndigo, margin: 0,
                fontFamily: "'Playfair Display', Georgia, serif",
              }}
            >
              KRA Activity
            </h3>
            <KRASubtitle staffId={staffId} employee={employee} />
          </div>
        </div>

        {/* Month nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 12px" }}>
          <button
            onClick={prevMonth}
            style={{
              background: `${COLORS.lavender}30`, border: "none", width: 30, height: 30,
              borderRadius: 8, cursor: "pointer", fontSize: 14, color: COLORS.darkIndigo,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ‹
          </button>
          <span
            style={{
              fontSize: 14, fontWeight: 700, color: COLORS.darkIndigo,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            style={{
              background: `${COLORS.lavender}30`, border: "none", width: 30, height: 30,
              borderRadius: 8, cursor: "pointer", fontSize: 14, color: COLORS.darkIndigo,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              style={{
                textAlign: "center", fontSize: 11, fontWeight: 700,
                color: COLORS.mauve, padding: "4px 0",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {days.map((day, i) => {
            if (!day) return <div key={i} />;
            const isToday = day === todayDay;
            const isFuture = isCurrentMonth && day > today.getDate();
            const isPast = !isCurrentMonth || day < today.getDate();
            const status = dayStatuses[day] || "no_data";
            const hasData = !!dayMap[day];

            let bg: string;
            let textColor: string;
            let border: string;
            let shadow = "none";

            if (isToday) {
              // Today: special gold styling with status ring
              if (status === "achieved") {
                bg = COLORS.success;
                textColor = COLORS.white;
                border = "none";
                shadow = `0 2px 8px ${COLORS.success}60`;
              } else if (status === "not_met") {
                bg = COLORS.danger;
                textColor = COLORS.white;
                border = "none";
                shadow = `0 2px 8px ${COLORS.danger}60`;
              } else {
                bg = `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`;
                textColor = COLORS.white;
                border = "none";
                shadow = `0 2px 8px ${COLORS.gold}40`;
              }
            } else if (status === "achieved") {
              // Green for past achieved, light green for future
              bg = isPast ? "#27AE60" : "#27AE6018";
              textColor = isPast ? "#fff" : "#27AE60";
              border = isPast ? "none" : `1.5px solid #27AE6040`;
            } else if (status === "not_met") {
              // Red for past not met, light red for future
              bg = isPast ? "#E74C3C" : "#E74C3C12";
              textColor = isPast ? "#fff" : "#E74C3C";
              border = isPast ? "none" : `1.5px solid #E74C3C30`;
            } else {
              // No data
              if (isPast && !isFuture) {
                bg = `${COLORS.lavender}25`;
                textColor = `${COLORS.mauve}80`;
                border = `1px solid ${COLORS.lavender}30`;
              } else {
                bg = `${COLORS.lavender}10`;
                textColor = `${COLORS.mauve}50`;
                border = `1px solid ${COLORS.lavender}20`;
              }
            }

            return (
              <div
                key={i}
                onClick={() => hasData && handleDayClick(day)}
                style={{
                  textAlign: "center", padding: "6px 2px",
                  borderRadius: 8, fontSize: 12,
                  fontWeight: isToday ? 800 : 600,
                  color: textColor, background: bg, border,
                  cursor: hasData ? "pointer" : "default",
                  transition: "all 0.2s",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: shadow,
                  opacity: isFuture && !hasData ? 0.4 : 1,
                  position: "relative",
                }}
              >
                {day}
                {/* Small dot indicator for days with data (non-today) */}
                {hasData && !isToday && status !== "no_data" && (
                  <div style={{
                    position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)",
                    width: 3, height: 3, borderRadius: "50%",
                    background: isPast ? "rgba(255,255,255,0.7)" : (status === "achieved" ? "#27AE60" : "#E74C3C"),
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginTop: 16, justifyContent: "center" }}>
          {[
            { color: "#27AE60", label: "Achieved" },
            { color: "#E74C3C", label: "Not Met" },
            { color: COLORS.lavender, label: "No Data" },
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: COLORS.mauve }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>

        <div
          style={{
            textAlign: "center", marginTop: 10, fontSize: 10.5,
            color: `${COLORS.mauve}90`, fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Month: {year}-{String(month + 1).padStart(2, "0")} | Days: {daysInMonth}
        </div>
      </div>

      {/* Daily Call Modal */}
      {selectedDay && (
        <DailyCallModal
          dayData={selectedDay.data}
          dateStr={selectedDay.dateStr}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </>
  );
}
