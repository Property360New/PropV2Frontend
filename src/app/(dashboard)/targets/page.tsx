"use client";

import { useState, useMemo } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import {
  useGetTargetSummaryQuery,
  useGetTodayStatsQuery,
  useGetMyTargetSeriesQuery,
  useGetTeamTargetsQuery,
  useGetQuarterlyIncentivesQuery,
  type Period,
} from "@/store/targets.api";
import { useGetProfileQuery } from "@/store/auth.api";
import { useGetScopeEmployeesQuery } from "@/store/hierarchy.api";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import {
  FiPhone, FiUsers, FiUser,
  FiCalendar, FiAward, FiChevronLeft, FiChevronRight,
  FiTarget, FiStar, FiFilter,
} from "react-icons/fi";

import type { Designation } from "@/types";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

// ─── Constants ────────────────────────────────────────────────────────────────

const MANAGER_ROLES: Designation[] = [
  "ADMIN", "SALES_COORDINATOR", "VP_SALES", "GM", "DGM", "AREA_MANAGER", "SALES_MANAGER", "TEAM_LEAD",
];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const PERIODS: { key: Period; label: string }[] = [
  { key: "1M", label: "This Month" },
  { key: "3M", label: "3 Months"   },
  { key: "6M", label: "6 Months"   },
  { key: "1Y", label: "1 Year"     },
];
const DESIG_COLORS: Record<string, string> = {
  ADMIN: "#E74C3C", SALES_COORDINATOR: "#8E44AD", VP_SALES: "#2980B9",
  GM: "#27AE60", DGM: "#16A085", AREA_MANAGER: "#E67E22",
  SALES_MANAGER: COLORS.gold, TEAM_LEAD: "#3498DB", SALES_EXECUTIVE: COLORS.mauve,
};

/** Quarter definitions — label + which months (1-indexed) belong to each */
const QUARTERS = [
  { key: "Q1", label: "JFM", months: [1, 2, 3],  color: "#3498DB" },
  { key: "Q2", label: "AMJ", months: [4, 5, 6],  color: "#27AE60" },
  { key: "Q3", label: "JAS", months: [7, 8, 9],  color: "#E67E22" },
  { key: "Q4", label: "OND", months: [10,11,12], color: "#8E44AD" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(a: number, t: number) { if (!t) return 0; return Math.min(Math.round((a / t) * 100), 999); }
function fmtCurrency(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}
function pctColor(p: number) { if (p >= 100) return "#27AE60"; if (p >= 60) return COLORS.gold; return "#E74C3C"; }

/** Returns the fiscal-year for a given calendar year & month (Apr–Mar cycle) */
function fiscalYear(year: number, month: number) {
  return month >= 4 ? year : year - 1;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ value, max, color, height = 8 }: { value: number; max: number; color: string; height?: number }) {
  const p = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ background: `${COLORS.lavender}30`, borderRadius: 99, height, overflow: "hidden", width: "100%" }}>
      <div style={{ width: `${p}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
    </div>
  );
}

function KpiCard({ label, value, target, icon: Icon, color, fmt = String, subtitle }: {
  label: string; value: number; target?: number; icon: any; color: string;
  fmt?: (n: number) => string; subtitle?: string;
}) {
  const p = target ? pct(value, target) : null;
  return (
    <div style={{
      background: COLORS.white, borderRadius: 16, padding: "20px",
      border: `1px solid ${COLORS.lavender}30`,
      boxShadow: "0 2px 12px rgba(26,15,46,0.04)", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.mauve, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.darkIndigo, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{fmt(value)}</div>
      {subtitle && <div style={{ fontSize: 11, color: COLORS.mauve, marginTop: 3 }}>{subtitle}</div>}
      {target != null && target > 0 && (
        <div style={{ marginTop: 10 }}>
          <ProgressBar value={value} max={target} color={p != null ? pctColor(p) : color} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: COLORS.mauve }}>Target: {fmt(target)}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: p != null ? pctColor(p) : color }}>{p}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Skeleton({ w = "100%", h = 12 }: { w?: string | number; h?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: `${COLORS.lavender}30`,
      backgroundImage: `linear-gradient(90deg,${COLORS.lavender}20 25%,${COLORS.lavender}50 50%,${COLORS.lavender}20 75%)`,
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
    }} />
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: COLORS.darkIndigo, borderRadius: 10, padding: "10px 14px", boxShadow: "0 8px 24px rgba(26,15,46,0.25)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: p.color }} />
          <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{p.name}: {p.value}</span>
        </div>
      ))}
    </div>
  );
}

function TodayStrip({ employeeId }: { employeeId: string }) {
  const { data: today, isLoading } = useGetTodayStatsQuery(employeeId ? { employeeId } : undefined);
  const stats = [
    { label: "Calls Today",    value: today?.calls    ?? 0, target: today?.dailyCallTarget ?? 0, color: "#3498DB", icon: FiPhone   },
    { label: "Visits Today",   value: today?.visits   ?? 0, color: "#8E44AD", icon: FiTarget },
    { label: "Meetings Today", value: today?.meetings ?? 0, color: "#E67E22", icon: FiUsers  },
    { label: "Deals Today",    value: today?.deals    ?? 0, color: "#27AE60", icon: FiAward  },
  ];
  return (
    <div style={{
      background: `linear-gradient(135deg,${COLORS.darkIndigo},#2D1B4E)`,
      borderRadius: 16, padding: "16px 20px", marginBottom: 20,
      display: "flex", gap: 0, overflow: "hidden",
      boxShadow: "0 4px 20px rgba(26,15,46,0.15)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 24, flexShrink: 0 }}>
        <FiCalendar size={14} color="rgba(255,255,255,0.6)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Today</span>
      </div>
      {stats.map((s, i) => (
        <div key={s.label} style={{ flex: 1, padding: "0 20px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 3 }}>{s.label}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            {isLoading ? <Skeleton w={30} h={20} /> : (
              <>
                <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
                {(s as any).target > 0 && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>/ {(s as any).target}</span>}
              </>
            )}
          </div>
          {(s as any).target > 0 && !isLoading && (
            <div style={{ marginTop: 4, background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.min((s.value / ((s as any).target)) * 100, 100)}%`, height: "100%", background: s.color, borderRadius: 99 }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Month + Year Picker ──────────────────────────────────────────────────────

function MonthYearPicker({
  month, year, onChange,
}: {
  month: number; year: number;
  onChange: (m: number, y: number) => void;
}) {
  const prev = () => {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  };
  const next = () => {
    const now = new Date();
    // don't navigate into the future
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return;
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: COLORS.white, borderRadius: 10,
      padding: "6px 10px", border: `1px solid ${COLORS.lavender}40`,
    }}>
      <FiFilter size={13} color={COLORS.mauve} />
      <button onClick={prev} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: COLORS.darkIndigo, padding: "0 2px" }}>
        <FiChevronLeft size={15} />
      </button>
      <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkIndigo, minWidth: 110, textAlign: "center" }}>
        {MONTH_FULL[month - 1]} {year}
      </span>
      <button onClick={next} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: COLORS.darkIndigo, padding: "0 2px" }}>
        <FiChevronRight size={15} />
      </button>
    </div>
  );
}

// ─── Quarterly Incentive Cell ─────────────────────────────────────────────────

function QuarterlyIncentiveCell({
  employeeId,
  year,
}: {
  employeeId: string;
  year: number;
}) {
  const { data, isLoading } = useGetQuarterlyIncentivesQuery({ employeeId, year });

  if (isLoading) return <Skeleton w={160} h={12} />;

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {QUARTERS.map((q) => {
        const amount = data?.[q.key] ?? 0;
        return (
          <div
            key={q.key}
            title={`${q.label}: ${fmtCurrency(amount)}`}
            style={{
              textAlign: "center",
              padding: "3px 6px",
              borderRadius: 6,
              background: amount > 0 ? `${q.color}12` : `${COLORS.lavender}15`,
              border: `1px solid ${amount > 0 ? q.color + "30" : COLORS.lavender + "30"}`,
              minWidth: 46,
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, color: amount > 0 ? q.color : COLORS.mauve, letterSpacing: "0.3px" }}>
              {q.label}
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, color: amount > 0 ? q.color : COLORS.mauve, marginTop: 1 }}>
              {amount > 0 ? fmtCurrency(amount) : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TargetsPage() {
  const now = new Date();

  // ── Shared month/year state (used by both My Performance and Team View) ────
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear,  setFilterYear]  = useState(now.getFullYear());

  const [period,           setPeriod]           = useState<Period>("1M");
  const [tab,              setTab]              = useState<"my" | "team">("my");
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const { data: profile }        = useGetProfileQuery();
  const { data: scopeEmployees } = useGetScopeEmployeesQuery();
  const isManager      = profile && MANAGER_ROLES.includes(profile.designation as Designation);
  const targetEmployeeId = selectedEmployee || profile?.employeeId || "";

  // ── My Performance queries ─────────────────────────────────────────────────
  const { data: summary, isLoading: summaryLoading } = useGetTargetSummaryQuery(
    { employeeId: targetEmployeeId, period, month: filterMonth, year: filterYear },
    { skip: !targetEmployeeId }
  );
  const { data: series } = useGetMyTargetSeriesQuery(
    { months: 12, employeeId: targetEmployeeId || undefined },
    { skip: !targetEmployeeId }
  );

  // ── Team View query ────────────────────────────────────────────────────────
  const { data: teamTargets, isLoading: teamLoading } = useGetTeamTargetsQuery(
    { month: filterMonth, year: filterYear },
    { skip: tab !== "team" }
  );

  // ── Chart data ─────────────────────────────────────────────────────────────
  const barData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Calls",    Achieved: summary.achieved.calls,    Target: summary.targets.calls, color: "#3498DB" },
      { name: "Visits",   Achieved: summary.achieved.visits,   Target: 0, color: "#8E44AD" },
      { name: "Meetings", Achieved: summary.achieved.meetings, Target: 0, color: "#E67E22" },
      { name: "Deals",    Achieved: summary.achieved.deals,    Target: 0, color: "#27AE60" },
    ];
  }, [summary]);

  const lineData = useMemo(() => {
    if (!series) return [];
    return (series as any[]).map((t) => ({
      month: `${MONTH_NAMES[t.month - 1]}'${String(t.year).slice(2)}`,
      Calls: t.callsAchieved, Visits: t.visitsAchieved, Meetings: t.meetingsAchieved, Deals: t.dealsAchieved,
    }));
  }, [series]);

  const periodLabel      = PERIODS.find(p => p.key === period)?.label ?? period;
  const selectedEmpName  = selectedEmployee ? scopeEmployees?.find(e => e.id === selectedEmployee) : null;
  const filterLabel      = `${MONTH_FULL[filterMonth - 1]} ${filterYear}`;

  // ── Layout helpers ─────────────────────────────────────────────────────────
  const sTitle = (t: string) => (
    <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: COLORS.darkIndigo }}>{t}</h3>
  );
  const card = (children: React.ReactNode, mb = 20) => (
    <div style={{ background: COLORS.white, borderRadius: 16, padding: 22, border: `1px solid ${COLORS.lavender}30`, boxShadow: "0 2px 12px rgba(26,15,46,0.04)", marginBottom: mb }}>
      {children}
    </div>
  );

  return (
    <>
      <TopBar title="Target vs Achievement" subtitle="Performance tracking across all metrics">
      <TutorialButton videoUrl={TUTORIALS.targetCustomers} />
      </TopBar>
      <div style={{ padding: "24px 32px" }}>

        {/* ── Controls row ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>

          {/* Tab selector */}
          <div style={{ display: "flex", background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.lavender}40`, overflow: "hidden" }}>
            {([
              { key: "my"   as const, label: "My Performance", icon: FiUser  },
              ...(isManager ? [{ key: "team" as const, label: "Team View", icon: FiUsers }] : []),
            ]).map((t, i) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "9px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 6,
                background: tab === t.key ? `${COLORS.mauve}15` : "transparent",
                color: tab === t.key ? COLORS.darkIndigo : COLORS.mauve,
                borderLeft: i > 0 ? `1px solid ${COLORS.lavender}40` : "none",
                fontFamily: "'DM Sans',sans-serif",
              }}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {/* Month / Year filter — always visible */}
          <MonthYearPicker
            month={filterMonth}
            year={filterYear}
            onChange={(m, y) => { setFilterMonth(m); setFilterYear(y); }}
          />

          {/* Period buttons — only in My Performance tab */}
          {tab === "my" && (
            <div style={{ display: "flex", gap: 4, background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.lavender}40`, padding: 4 }}>
              {PERIODS.map(p => (
                <button key={p.key} onClick={() => setPeriod(p.key)} style={{
                  padding: "7px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                  background: period === p.key ? COLORS.darkIndigo : "transparent",
                  color: period === p.key ? "#fff" : COLORS.mauve,
                  fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
                }}>{p.label}</button>
              ))}
            </div>
          )}

          {/* Employee picker — managers in My Performance tab */}
          {isManager && tab === "my" && (
            <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} style={{
              padding: "9px 14px", borderRadius: 10, border: `1px solid ${COLORS.lavender}50`,
              fontSize: 13, background: COLORS.white, color: COLORS.darkIndigo,
              cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
            }}>
              <option value="">My own</option>
              {scopeEmployees?.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MY PERFORMANCE TAB
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "my" && (
          <>
            {selectedEmpName && (
              <div style={{
                padding: "10px 16px", borderRadius: 10, marginBottom: 16,
                background: `${COLORS.gold}12`, border: `1px solid ${COLORS.gold}30`,
                fontSize: 13, fontWeight: 600, color: COLORS.darkIndigo,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <FiUser size={14} color={COLORS.gold} />
                Viewing: {selectedEmpName.firstName} {selectedEmpName.lastName}
                <span style={{ fontSize: 11, color: COLORS.mauve, fontWeight: 400 }}>
                  ({periodLabel} · {filterLabel})
                </span>
              </div>
            )}

            <TodayStrip employeeId={targetEmployeeId} />

            {summaryLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ height: 120, borderRadius: 16, background: `${COLORS.lavender}20`, animation: "shimmer 1.4s infinite" }} />
                ))}
              </div>
            ) : summary ? (
              <>
                {/* KPI cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
                  <KpiCard label="Total Calls" value={summary.achieved.calls} target={summary.targets.calls} icon={FiPhone} color="#3498DB"
                    subtitle={`${summary.achieved.queries} queries + ${summary.achieved.remarks} remarks`} />
                  <KpiCard label="Visits"   value={summary.achieved.visits}   icon={FiTarget} color="#8E44AD" />
                  <KpiCard label="Meetings" value={summary.achieved.meetings} icon={FiUsers}  color="#E67E22" />
                  <KpiCard label="Deals"    value={summary.achieved.deals}    icon={FiAward}  color="#27AE60" />
                </div>

                {/* Sales + Incentive */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  {card(<>
                    {sTitle("Sales Revenue")}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                      <span style={{ fontSize: 32, fontWeight: 800, color: COLORS.gold, fontFamily: "'Playfair Display',serif" }}>
                        {fmtCurrency(summary.achieved.salesRevenue)}
                      </span>
                      {summary.targets.salesRevenue > 0 && (
                        <span style={{ fontSize: 13, color: COLORS.mauve }}>/ {fmtCurrency(summary.targets.salesRevenue)}</span>
                      )}
                    </div>
                    {summary.targets.salesRevenue > 0 && <>
                      <ProgressBar value={summary.achieved.salesRevenue} max={summary.targets.salesRevenue} color={pctColor(pct(summary.achieved.salesRevenue, summary.targets.salesRevenue))} height={10} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                        <span style={{ fontSize: 12, color: COLORS.mauve }}>{summary.achieved.deals} deal{summary.achieved.deals !== 1 ? "s" : ""} closed</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: pctColor(pct(summary.achieved.salesRevenue, summary.targets.salesRevenue)) }}>
                          {pct(summary.achieved.salesRevenue, summary.targets.salesRevenue)}%
                        </span>
                      </div>
                    </>}
                    <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: `${COLORS.gold}08`, border: `1px solid ${COLORS.gold}20`, fontSize: 11, color: COLORS.mauve }}>
                      {new Date(summary.dateRange.from).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      {" → "}
                      {new Date(summary.dateRange.to).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </>, 0)}

                  {card(<>
                    {sTitle("Incentive Earned")}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${COLORS.gold}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FiStar size={20} color={COLORS.gold} />
                      </div>
                      <div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.darkIndigo, fontFamily: "'Playfair Display',serif" }}>
                          {fmtCurrency(summary.achieved.incentive)}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.mauve }}>{periodLabel} total incentive</div>
                      </div>
                    </div>

                    {/* Quarterly breakdown */}
                    <div style={{ borderTop: `1px solid ${COLORS.lavender}20`, paddingTop: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.mauve, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 }}>
                        Quarterly Breakdown — {filterYear}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                        {QUARTERS.map((q) => {
                          const qData = summary.quarterlyIncentives?.[q.key] ?? 0;
                          return (
                            <div key={q.key} style={{ padding: "8px 10px", borderRadius: 8, background: `${q.color}08`, border: `1px solid ${q.color}20`, textAlign: "center" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: q.color, letterSpacing: "0.4px" }}>{q.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: qData > 0 ? q.color : COLORS.mauve, marginTop: 2 }}>
                                {qData > 0 ? fmtCurrency(qData) : "—"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${COLORS.lavender}20`, paddingTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { label: "Revenue",      value: fmtCurrency(summary.achieved.salesRevenue), color: COLORS.gold  },
                        { label: "Deals",        value: String(summary.achieved.deals),              color: "#27AE60"    },
                        { label: "Incentive Amt",value: fmtCurrency(summary.achieved.incentive),     color: "#8E44AD"    },
                        { label: "Calls Made",   value: String(summary.achieved.calls),              color: "#3498DB"    },
                      ].map(s => (
                        <div key={s.label} style={{ padding: "8px 10px", borderRadius: 8, background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                          <div style={{ fontSize: 10, color: COLORS.mauve, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2 }}>{s.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </>, 0)}
                </div>

                {/* Bar chart */}
                <div style={{ marginBottom: 20 }}>
                  {card(<>
                    {sTitle(`Target vs Achievement — ${periodLabel} · ${filterLabel}`)}
                    <div style={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} barCategoryGap="35%">
                          <CartesianGrid strokeDasharray="3 3" stroke={`${COLORS.lavender}40`} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLORS.mauve }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: COLORS.mauve }} axisLine={false} tickLine={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 11, color: COLORS.mauve }} />
                          <Bar dataKey="Achieved" radius={[6, 6, 0, 0]}>
                            {barData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Bar>
                          <Bar dataKey="Target" fill={`${COLORS.lavender}60`} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>, 0)}
                </div>

                {/* Line chart */}
                {lineData.length > 1 && card(<>
                  {sTitle("Activity Trend — Last 12 Months")}
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={`${COLORS.lavender}40`} vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: COLORS.mauve }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: COLORS.mauve }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, color: COLORS.mauve }} />
                        <Line type="monotone" dataKey="Calls"    stroke="#3498DB" strokeWidth={2} dot={{ r: 3, fill: "#3498DB" }} />
                        <Line type="monotone" dataKey="Visits"   stroke="#8E44AD" strokeWidth={2} dot={{ r: 3, fill: "#8E44AD" }} />
                        <Line type="monotone" dataKey="Meetings" stroke="#E67E22" strokeWidth={2} dot={{ r: 3, fill: "#E67E22" }} />
                        <Line type="monotone" dataKey="Deals"    stroke="#27AE60" strokeWidth={2} dot={{ r: 3, fill: "#27AE60" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>, 0)}
              </>
            ) : null}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TEAM VIEW TAB
        ══════════════════════════════════════════════════════════════════ */}
        {tab === "team" && (
          <>
            {/* Quarter legend */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: COLORS.mauve, fontWeight: 600 }}>Quarterly Incentive ({filterYear}):</span>
              {QUARTERS.map(q => (
                <span key={q.key} style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                  background: `${q.color}12`, border: `1px solid ${q.color}30`, color: q.color,
                }}>
                  {q.label} — {q.months.map(m => MONTH_NAMES[m - 1]).join(", ")}
                </span>
              ))}
            </div>

            <div style={{ background: COLORS.white, borderRadius: 16, overflow: "hidden", border: `1px solid ${COLORS.lavender}30`, boxShadow: "0 2px 12px rgba(26,15,46,0.04)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: `linear-gradient(135deg,${COLORS.darkIndigo},#2D1B4E)`, color: "#fff" }}>
                      {[
                        "Employee", "Calls", "Target", "Call %",
                        "Revenue", "Rev Target", "Rev %",
                        "Visits", "Meetings", "Deals",
                        // Quarterly incentive columns
                        "JFM", "AMJ", "JAS", "OND",
                      ].map(h => (
                        <th key={h} style={{
                          padding: "12px 14px", textAlign: "left", fontWeight: 700,
                          fontSize: 11, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.3px",
                          // Highlight the quarter headers
                          color: ["JFM","AMJ","JAS","OND"].includes(h)
                            ? QUARTERS.find(q => q.label === h)?.color ?? "#fff"
                            : "#fff",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          {[...Array(14)].map((_, j) => (
                            <td key={j} style={{ padding: "14px 14px" }}>
                              <Skeleton w={j === 0 ? 140 : 50} h={12} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : !teamTargets?.length ? (
                      <tr>
                        <td colSpan={14} style={{ padding: 48, textAlign: "center", color: COLORS.mauve }}>
                          No team data for {filterLabel}.
                        </td>
                      </tr>
                    ) : (
                      (teamTargets as any[]).map((t, i) => {
                        const cp = pct(t.callsAchieved, t.callTarget);
                        const rp = pct(Number(t.salesAchieved), Number(t.salesTarget));
                        const dc = DESIG_COLORS[t.employee?.designation ?? ""] ?? COLORS.mauve;
                        return (
                          <tr key={t.id || i} style={{ borderBottom: `1px solid ${COLORS.lavender}20`, background: i % 2 === 0 ? "#fff" : `${COLORS.pearl}80` }}>
                            {/* Employee */}
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 8,
                                  background: `${dc}15`, border: `1.5px solid ${dc}25`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 11, fontWeight: 800, color: dc, flexShrink: 0,
                                }}>
                                  {t.employee?.firstName?.[0]}{t.employee?.lastName?.[0] ?? ""}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: COLORS.darkIndigo }}>{t.employee?.firstName} {t.employee?.lastName}</div>
                                  <div style={{ fontSize: 10, color: dc, fontWeight: 700 }}>{t.employee?.designation?.replace(/_/g, " ")}</div>
                                </div>
                              </div>
                            </td>

                            {/* Calls */}
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: "#3498DB" }}>{t.callsAchieved}</td>
                            <td style={{ padding: "12px 14px", color: COLORS.mauve }}>{t.callTarget}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 50 }}><ProgressBar value={t.callsAchieved} max={t.callTarget} color={pctColor(cp)} /></div>
                                <span style={{ fontSize: 11, fontWeight: 800, color: pctColor(cp) }}>{cp}%</span>
                              </div>
                            </td>

                            {/* Revenue */}
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: COLORS.gold }}>{fmtCurrency(Number(t.salesAchieved))}</td>
                            <td style={{ padding: "12px 14px", color: COLORS.mauve }}>{fmtCurrency(Number(t.salesTarget))}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 50 }}><ProgressBar value={Number(t.salesAchieved)} max={Number(t.salesTarget)} color={pctColor(rp)} /></div>
                                <span style={{ fontSize: 11, fontWeight: 800, color: pctColor(rp) }}>{rp}%</span>
                              </div>
                            </td>

                            {/* Visits / Meetings / Deals */}
                            <td style={{ padding: "12px 14px", color: "#8E44AD", fontWeight: 600 }}>{t.visitsAchieved}</td>
                            <td style={{ padding: "12px 14px", color: "#E67E22", fontWeight: 600 }}>{t.meetingsAchieved}</td>
                            <td style={{ padding: "12px 14px", fontWeight: 800, color: "#27AE60" }}>{t.dealsAchieved}</td>

                            {/* Quarterly incentive — one cell per quarter */}
                            {QUARTERS.map((q) => {
                              const amount = t.quarterlyIncentives?.[q.key] ?? 0;
                              return (
                                <td key={q.key} style={{ padding: "12px 10px" }}>
                                  <div style={{
                                    padding: "3px 8px", borderRadius: 6, textAlign: "center",
                                    background: amount > 0 ? `${q.color}10` : `${COLORS.lavender}10`,
                                    border: `1px solid ${amount > 0 ? q.color + "25" : COLORS.lavender + "20"}`,
                                    fontSize: 11, fontWeight: 800,
                                    color: amount > 0 ? q.color : COLORS.mauve,
                                    minWidth: 54,
                                  }}>
                                    {amount > 0 ? fmtCurrency(amount) : "—"}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </>
  );
}