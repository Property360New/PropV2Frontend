"use client";

import { useState, useMemo, FormEvent } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import {
  useGetActivityStatsQuery,
  useGetDashboardSummaryQuery,
  useGetTeamPerformanceQuery,
  type TeamPerfRow,
} from "@/store/reports.api";
import { useGetScopeEmployeesQuery } from "@/store/hierarchy.api";
import { useGetProfileQuery } from "@/store/auth.api";
import { createPortal } from "react-dom";
import {
  FiBarChart2, FiPhone, FiUsers, FiTarget, FiTrendingUp,
  FiX, FiCalendar, FiUser, FiChevronLeft, FiChevronRight,
  FiCheckCircle, FiXCircle, FiEye, FiMessageSquare, FiAlertCircle,
} from "react-icons/fi";
import type { Designation } from "@/types";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

// ─── Constants ────────────────────────────────────────────────────────────────

const MANAGER_ROLES: Designation[] = [
  "ADMIN","SALES_COORDINATOR","VP_SALES","GM","DGM","AREA_MANAGER","SALES_MANAGER","TEAM_LEAD",
];

type DateTab = "Today" | "Week" | "Month" | "Custom";

const DESIG_COLORS: Record<string, string> = {
  ADMIN:"#E74C3C",SALES_COORDINATOR:"#8E44AD",VP_SALES:"#2980B9",
  GM:"#27AE60",DGM:"#16A085",AREA_MANAGER:"#E67E22",
  SALES_MANAGER:COLORS.gold,TEAM_LEAD:"#3498DB",SALES_EXECUTIVE:COLORS.mauve,
};

type StatKey = "totalCalls"|"followups"|"visits"|"meetings"|"deals"|"notInterested"|"hotProspects"|"ringing"|"switchOff"|"callBack"|"suspect";

const STAT_ITEMS: { key: StatKey; label: string; color: string; leadsKey: string }[] = [
  { key: "totalCalls",    label: "Total Calls Made",  color: COLORS.darkIndigo, leadsKey: "calls"        },
  { key: "followups",     label: "Follow Up",          color: COLORS.gold,       leadsKey: "followups"    },
  { key: "visits",        label: "Visit Done",         color: "#8E44AD",         leadsKey: "visits"       },
  { key: "meetings",      label: "Meeting Done",       color: "#2980B9",         leadsKey: "meetings"     },
  { key: "deals",         label: "Deal Done",          color: "#27AE60",         leadsKey: "deals"        },
  { key: "hotProspects",  label: "Hot Prospect",       color: "#E74C3C",         leadsKey: "hotProspects" },
  { key: "suspect",       label: "Suspect",            color: "#9B59B6",         leadsKey: "suspect"      },
  { key: "callBack",      label: "Call Back",          color: "#E67E22",         leadsKey: "callBack"     },
  { key: "ringing",       label: "Ringing",            color: "#27AE60",         leadsKey: "ringing"      },
  { key: "switchOff",     label: "Switch Off",         color: "#7F8C8D",         leadsKey: "switchOff"    },
  { key: "notInterested", label: "Not Interested",     color: "#C0392B",         leadsKey: "notInterested"},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRangeForTab(tab: DateTab, customFrom?: string, customTo?: string): { startDate: string; endDate: string } {
  const today = new Date();
  switch (tab) {
    case "Today": {
      const s = new Date(today); s.setHours(0,0,0,0);
      const e = new Date(today); e.setHours(23,59,59,999);
      return { startDate: s.toISOString(), endDate: e.toISOString() };
    }
    case "Week": {
      const s = new Date(today); s.setDate(today.getDate() - today.getDay()); s.setHours(0,0,0,0);
      const e = new Date(today); e.setHours(23,59,59,999);
      return { startDate: s.toISOString(), endDate: e.toISOString() };
    }
    case "Month": {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      const e = new Date(today); e.setHours(23,59,59,999);
      return { startDate: s.toISOString(), endDate: e.toISOString() };
    }
    case "Custom":
      return {
        startDate: customFrom ? new Date(customFrom + "T00:00:00").toISOString() : new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
        endDate:   customTo   ? new Date(customTo   + "T23:59:59").toISOString() : new Date().toISOString(),
      };
  }
}

/**
 * Converts a 24-hour range string like "0-2", "14-16" into a 12-hour label.
 * Examples:
 *   "0-2"   → "12–2am"
 *   "8-10"  → "8–10am"
 *   "12-14" → "12–2pm"
 *   "22-24" → "10pm–12am"
 */
function to12h(range: string): string {
  const [startStr, endStr] = range.split("-");
  const start = parseInt(startStr, 10);
  const end   = parseInt(endStr,   10);

  const fmt = (h: number): string => {
    const suffix = h < 12 || h === 24 ? "am" : "pm";
    const h12    = h % 12 === 0 ? 12 : h % 12;
    return `${h12}${suffix}`;
  };

  // For labels like "12-14" → "12pm–2pm" we only want suffix on end to save space
  // But for crossing noon/midnight we keep both clear
  const startSuffix = start < 12 ? "am" : "pm";
  const endSuffix   = (end <= 12 || end === 24) ? (end === 24 ? "am" : end < 12 ? "am" : "pm") : "pm";

  const h12Start = start % 12 === 0 ? 12 : start % 12;
  const h12End   = end   % 12 === 0 ? 12 : end   % 12;

  // If both in same period, omit suffix on start
  if (startSuffix === endSuffix) {
    return `${h12Start}–${h12End}${endSuffix}`;
  }
  return `${h12Start}${startSuffix}–${h12End}${endSuffix}`;
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", { day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit" });
}

// ─── Lead Drill-down Modal ────────────────────────────────────────────────────

interface DrillDownModalProps {
  title: string;
  color: string;
  leads: Array<{ leadId:string; name:string; phone:string; source:string|null; status:string; createdAt:string; createdBy?: any }>;
  onClose: () => void;
}

function DrillDownModal({ title, color, leads, onClose }: DrillDownModalProps) {
  const [search, setSearch] = useState("");
  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search)
  );

  return createPortal(
    <div onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(26,15,46,0.6)",
      display:"flex",alignItems:"center",justifyContent:"center",
      zIndex:2000,backdropFilter:"blur(4px)",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"min(680px,96vw)",maxHeight:"86vh",
        background:"#fff",borderRadius:20,overflow:"hidden",
        boxShadow:"0 32px 80px rgba(26,15,46,0.3)",
        display:"flex",flexDirection:"column",
      }}>
        {/* Header */}
        <div style={{
          padding:"18px 24px",flexShrink:0,
          background:`linear-gradient(135deg,${COLORS.darkIndigo},#2D1B4E)`,
          color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",
        }}>
          <div>
            <h3 style={{ margin:0,fontSize:17,fontWeight:800,fontFamily:"'Playfair Display',serif" }}>{title}</h3>
            <div style={{ marginTop:4,display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ background:`${color}30`,color,fontSize:12,fontWeight:700,padding:"2px 10px",borderRadius:10 }}>
                {leads.length} lead{leads.length!==1?"s":""}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff" }}>
            <FiX size={18}/>
          </button>
        </div>

        {/* Search */}
        <div style={{ padding:"12px 24px",borderBottom:`1px solid ${COLORS.lavender}20`,flexShrink:0 }}>
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            style={{
              width:"100%",padding:"8px 12px",borderRadius:8,
              border:`1.5px solid ${COLORS.lavender}50`,fontSize:13,
              color:COLORS.darkIndigo,background:"#f8f7fc",
              fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",
            }}
          />
        </div>

        {/* List */}
        <div style={{ overflowY:"auto",flex:1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding:48,textAlign:"center",color:COLORS.mauve }}>No leads found.</div>
          ) : (
            filtered.map((l,i) => (
              <div key={l.leadId} style={{
                padding:"14px 24px",borderBottom:`1px solid ${COLORS.lavender}15`,
                display:"flex",alignItems:"center",gap:14,
                background:i%2===0?"#fff":`${COLORS.pearl}60`,
              }}>
                <div style={{
                  width:38,height:38,borderRadius:10,background:`${color}12`,
                  border:`1.5px solid ${color}20`,display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:13,fontWeight:800,color,flexShrink:0,
                }}>
                  {l.name?.[0]?.toUpperCase()||"?"}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:700,color:COLORS.darkIndigo,fontSize:13 }}>{l.name}</div>
                  <div style={{ fontSize:12,color:COLORS.mauve,display:"flex",alignItems:"center",gap:8,marginTop:2 }}>
                    <FiPhone size={10}/> {l.phone}
                    {l.source && <span>· {l.source}</span>}
                  </div>
                </div>
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  {l.createdBy && (
                    <div style={{ fontSize:11,color:COLORS.mauve,marginBottom:3 }}>
                      by {l.createdBy.firstName}
                    </div>
                  )}
                  <div style={{ fontSize:11,color:COLORS.mauve }}>{fmtDateTime(l.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Hourly Bar Chart ─────────────────────────────────────────────────────────

function HourlyChart({ buckets }: { buckets: Array<{range:string;count:number}> }) {
  const max  = Math.max(...buckets.map(b => b.count), 1);
  const peak = buckets.reduce((best, b) => b.count > best.count ? b : best, buckets[0]);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:160, padding:"0 4px" }}>
        {buckets.map((b, i) => {
          const h      = max > 0 ? Math.max((b.count / max) * 140, b.count > 0 ? 4 : 0) : 0;
          const isPeak = b.range === peak?.range && b.count > 0;
          // Convert backend "0-2" style range to "12–2am" style label
          const label  = to12h(b.range);

          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              {b.count > 0 && (
                <span style={{ fontSize:10, fontWeight:700, color: isPeak ? COLORS.gold : COLORS.mauve }}>
                  {b.count}
                </span>
              )}
              <div style={{
                width:"100%", height:h, minHeight: b.count > 0 ? 4 : 2,
                borderRadius:"5px 5px 0 0",
                background: isPeak
                  ? `linear-gradient(180deg,${COLORS.gold},${COLORS.goldDark})`
                  : `linear-gradient(180deg,${COLORS.mauve}80,${COLORS.mauve}50)`,
                transition:"height 0.5s ease",
              }}/>
              {/* 12-hour label */}
              <span style={{
                fontSize:8, color:COLORS.mauve, whiteSpace:"nowrap",
                transform:"rotate(-35deg)", transformOrigin:"center",
                marginTop:2, lineHeight:1.2,
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {peak && peak.count > 0 && (
        <div style={{ marginTop:16, fontSize:12, color:COLORS.mauve, textAlign:"center" }}>
          Peak activity: <strong style={{ color:COLORS.gold }}>{to12h(peak.range)}</strong> with {peak.count} calls
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skel({ w="100%", h=14 }: { w?:string|number; h?:number }) {
  return (
    <div style={{
      width:w, height:h, borderRadius:6,
      background:`${COLORS.lavender}30`,
      backgroundImage:`linear-gradient(90deg,${COLORS.lavender}20 25%,${COLORS.lavender}50 50%,${COLORS.lavender}20 75%)`,
      backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite",
    }}/>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const now = new Date();

  const [activeTab,   setActiveTab]   = useState<DateTab>("Today");
  const [customFrom,  setCustomFrom]  = useState(now.toISOString().slice(0,10));
  const [customTo,    setCustomTo]    = useState(now.toISOString().slice(0,10));
  const [showCustom,  setShowCustom]  = useState(false);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [modal,       setModal]       = useState<{ title:string; color:string; leads:any[] } | null>(null);
  const [month,       setMonth]       = useState(now.getMonth() + 1);
  const [year,        setYear]        = useState(now.getFullYear());
  const [view,        setView]        = useState<"activity"|"team">("activity");

  const { data: profile }        = useGetProfileQuery();
  const { data: scopeEmployees } = useGetScopeEmployeesQuery();
  const { data: dashSummary }    = useGetDashboardSummaryQuery();
  const isManager = profile && MANAGER_ROLES.includes(profile.designation as Designation);

  const dateRange = getDateRangeForTab(activeTab, customFrom, customTo);

  const { data: activity, isLoading: actLoading, isFetching: actFetching } = useGetActivityStatsQuery({
    startDate:  dateRange.startDate,
    endDate:    dateRange.endDate,
    employeeId: selectedEmp || undefined,
  });

  const { data: teamPerf, isLoading: teamLoading } = useGetTeamPerformanceQuery(
    { month, year },
    { skip: view !== "team" }
  );

  const isLoading = actLoading || actFetching;
  const stats  = activity?.stats;
  const hourly = activity?.hourly ?? [];
  const leads  = activity?.leads  ?? {};

  const handleStatClick = (item: typeof STAT_ITEMS[0]) => {
    const list = (leads as any)[item.leadsKey] ?? [];
    setModal({ title: item.label, color: item.color, leads: list });
  };

  const prevMonth = () => { if(month===1){setMonth(12);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===12){setMonth(1);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const card = (children: React.ReactNode, mb = 20) => (
    <div style={{ background:COLORS.white, borderRadius:16, padding:22, border:`1px solid ${COLORS.lavender}30`, boxShadow:"0 2px 12px rgba(26,15,46,0.04)", marginBottom:mb }}>
      {children}
    </div>
  );
  const sTitle = (t: string) => (
    <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:800, fontFamily:"'Playfair Display',serif", color:COLORS.darkIndigo }}>{t}</h3>
  );

  return (
    <>
      <TopBar title="Reports" subtitle="Activity analytics and performance reports" >
        <TutorialButton videoUrl={TUTORIALS.reports} />
      </TopBar>

      <div style={{ padding:"24px 32px" }}>

        {/* ── Dashboard tiles ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
          {[
            { label:"Total Leads",         value:dashSummary?.totalLeads         ?? 0, icon:FiBarChart2,  color:COLORS.mauve },
            { label:"Deals This Month",    value:dashSummary?.dealsDoneThisMonth ?? 0, icon:FiTrendingUp, color:"#27AE60"    },
            { label:"Hot Prospects",       value:dashSummary?.hotProspects       ?? 0, icon:FiTarget,     color:"#E74C3C"    },
            { label:"Customers",           value:dashSummary?.totalCustomers     ?? 0, icon:FiUsers,      color:COLORS.gold  },
          ].map(t => (
            <div key={t.label} style={{
              background:COLORS.white, borderRadius:14, padding:"18px 20px",
              border:`1px solid ${COLORS.lavender}30`, display:"flex", alignItems:"center", gap:14,
              boxShadow:"0 2px 8px rgba(26,15,46,0.04)",
            }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${t.color}12`, display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${t.color}20`, flexShrink:0 }}>
                <t.icon size={20} color={t.color}/>
              </div>
              <div>
                <div style={{ fontSize:26, fontWeight:800, color:COLORS.darkIndigo, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{t.value}</div>
                <div style={{ fontSize:12, color:COLORS.mauve, fontWeight:600, marginTop:2 }}>{t.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Controls ── */}
        <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center", flexWrap:"wrap" }}>

          {/* View toggle */}
          <div style={{ display:"flex", background:COLORS.white, borderRadius:10, border:`1px solid ${COLORS.lavender}40`, overflow:"hidden" }}>
            {([
              { key: "activity" as const, label: "Activity", icon: FiPhone },
              ...(isManager ? [{ key: "team" as const, label: "Team", icon: FiUsers }] : []),
            ]).map((t, i) => (
              <button key={t.key} onClick={() => setView(t.key)} style={{
                padding:"9px 18px", border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                display:"flex", alignItems:"center", gap:6,
                background: view===t.key ? `${COLORS.mauve}15` : "transparent",
                color: view===t.key ? COLORS.darkIndigo : COLORS.mauve,
                borderLeft: i>0 ? `1px solid ${COLORS.lavender}40` : "none",
                fontFamily:"'DM Sans',sans-serif",
              }}>
                <t.icon size={14}/> {t.label}
              </button>
            ))}
          </div>

          {/* Date tabs */}
          {view === "activity" && (
            <div style={{ display:"flex", gap:4, background:COLORS.white, borderRadius:10, border:`1px solid ${COLORS.lavender}40`, padding:4 }}>
              {(["Today","Week","Month","Custom"] as DateTab[]).map(tab => (
                <button key={tab} onClick={()=>{ setActiveTab(tab); if(tab==="Custom") setShowCustom(true); }} style={{
                  padding:"7px 14px", borderRadius:7, border:"none", cursor:"pointer",
                  fontSize:12, fontWeight:600,
                  background: activeTab===tab ? COLORS.darkIndigo : "transparent",
                  color: activeTab===tab ? "#fff" : COLORS.mauve,
                  fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
                }}>{tab}</button>
              ))}
            </div>
          )}

          {/* Custom date range */}
          {view==="activity" && activeTab==="Custom" && (
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} style={{ padding:"8px 10px", borderRadius:8, border:`1px solid ${COLORS.lavender}50`, fontSize:12, fontFamily:"'DM Sans',sans-serif", color:COLORS.darkIndigo }} />
              <span style={{ fontSize:12, color:COLORS.mauve }}>to</span>
              <input type="date" value={customTo}   onChange={e=>setCustomTo(e.target.value)}   style={{ padding:"8px 10px", borderRadius:8, border:`1px solid ${COLORS.lavender}50`, fontSize:12, fontFamily:"'DM Sans',sans-serif", color:COLORS.darkIndigo }} />
            </div>
          )}

          {/* Employee picker */}
          {isManager && view==="activity" && (
            <select value={selectedEmp} onChange={e=>setSelectedEmp(e.target.value)} style={{
              padding:"9px 14px", borderRadius:10, border:`1px solid ${COLORS.lavender}50`,
              fontSize:13, background:COLORS.white, color:COLORS.darkIndigo,
              cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
            }}>
              <option value="">All in scope</option>
              {scopeEmployees?.map(emp=><option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
            </select>
          )}

          {/* Month nav for team */}
          {view==="team" && (
            <div style={{ display:"flex", alignItems:"center", gap:8, background:COLORS.white, borderRadius:10, padding:"6px 12px", border:`1px solid ${COLORS.lavender}40` }}>
              <button onClick={prevMonth} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", color:COLORS.darkIndigo }}><FiChevronLeft size={16}/></button>
              <span style={{ fontSize:13, fontWeight:700, color:COLORS.darkIndigo, minWidth:120, textAlign:"center" }}>{MONTH_FULL[month-1]} {year}</span>
              <button onClick={nextMonth} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", color:COLORS.darkIndigo }}><FiChevronRight size={16}/></button>
            </div>
          )}
        </div>

        {/* ══════════════ ACTIVITY VIEW ══ */}
        {view === "activity" && (
          <>
            {/* Big call count + top 3 metrics */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 3fr", gap:20, marginBottom:20 }}>
              {/* Call count hero */}
              <div style={{
                background:`linear-gradient(135deg,${COLORS.darkIndigo},#2D1B4E)`,
                borderRadius:16, padding:28, display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                boxShadow:"0 4px 20px rgba(26,15,46,0.15)",
              }}>
                <FiPhone size={28} color="rgba(255,255,255,0.4)" style={{ marginBottom:8 }} />
                {isLoading ? <Skel w={80} h={52} /> : (
                  <div style={{ fontSize:56, fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif", lineHeight:1 }}>
                    {stats?.totalCalls ?? 0}
                  </div>
                )}
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:6, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:700 }}>
                  Total Calls
                </div>
                {!isLoading && stats && (
                  <div style={{ marginTop:10, fontSize:11, color:"rgba(255,255,255,0.5)" }}>
                    {stats.queries} queries + {stats.remarks} remarks
                  </div>
                )}
              </div>

              {/* 3 highlight metrics */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                {[
                  { label:"Follow Ups",    value:stats?.followups    ??0, color:COLORS.gold,  icon:FiTrendingUp  },
                  { label:"Deals Done",    value:stats?.deals        ??0, color:"#27AE60",    icon:FiCheckCircle },
                  { label:"Not Interested",value:stats?.notInterested??0, color:"#E74C3C",    icon:FiXCircle     },
                ].map(m=>(
                  <div key={m.label} style={{
                    background:COLORS.white, borderRadius:14, padding:"20px 18px",
                    border:`1px solid ${COLORS.lavender}30`,
                    boxShadow:"0 2px 8px rgba(26,15,46,0.04)",
                    position:"relative", overflow:"hidden", cursor:"pointer",
                  }} onClick={()=>{ const item=STAT_ITEMS.find(s=>s.label===m.label); if(item) handleStatClick(item); }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:m.color }}/>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:`${m.color}12`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <m.icon size={16} color={m.color}/>
                      </div>
                      <span style={{ fontSize:12, color:COLORS.mauve, fontWeight:600 }}>{m.label}</span>
                    </div>
                    {isLoading ? <Skel w={60} h={28} /> : (
                      <div style={{ fontSize:36, fontWeight:800, color:m.color, fontFamily:"'Playfair Display',serif", lineHeight:1 }}>{m.value}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly chart + Stat list side by side */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
              {card(<>
                {sTitle("Hourly Activity (2-hour intervals)")}
                {isLoading ? <Skel h={160}/> : hourly.length > 0 ? <HourlyChart buckets={hourly}/> : (
                  <div style={{ padding:40, textAlign:"center", color:COLORS.mauve }}>No call activity data.</div>
                )}
              </>, 0)}

              {card(<>
                {sTitle("Activity Breakdown")}
                <div>
                  {STAT_ITEMS.map((item,i) => {
                    const val = (stats as any)?.[item.key] ?? 0;
                    const max = stats?.totalCalls || 1;
                    const pct = Math.min((val/max)*100, 100);
                    return (
                      <div
                        key={item.key}
                        onClick={()=>handleStatClick(item)}
                        style={{
                          display:"flex", alignItems:"center", gap:12, padding:"9px 0",
                          borderBottom:i<STAT_ITEMS.length-1?`1px solid ${COLORS.lavender}15`:"none",
                          cursor:"pointer", transition:"background 0.1s", borderRadius:6,
                        }}
                        onMouseEnter={e=>(e.currentTarget.style.background=`${item.color}06`)}
                        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                      >
                        <div style={{ width:8, height:8, borderRadius:"50%", background:item.color, flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                            <span style={{ fontSize:13, color:COLORS.darkIndigo, fontWeight:item.key==="totalCalls"?700:500 }}>{item.label}</span>
                            {isLoading ? <Skel w={24} h={14}/> : (
                              <span style={{ fontSize:13, fontWeight:800, color:item.color }}>{val}</span>
                            )}
                          </div>
                          <div style={{ background:`${COLORS.lavender}20`, borderRadius:99, height:3, overflow:"hidden" }}>
                            <div style={{ width:`${pct}%`, height:"100%", background:item.color, borderRadius:99, transition:"width 0.5s ease" }}/>
                          </div>
                        </div>
                        <FiEye size={12} color={COLORS.mauve} style={{ flexShrink:0 }}/>
                      </div>
                    );
                  })}
                </div>
              </>, 0)}
            </div>
          </>
        )}

        {/* ══════════════ TEAM VIEW ══ */}
        {view === "team" && (
          <div style={{ background:COLORS.white, borderRadius:16, overflow:"hidden", border:`1px solid ${COLORS.lavender}30`, boxShadow:"0 2px 12px rgba(26,15,46,0.04)" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
                <thead>
                  <tr style={{ background:`linear-gradient(135deg,${COLORS.darkIndigo},#2D1B4E)`, color:"#fff" }}>
                    {["Employee","Total Calls","Queries","Remarks","Follow Ups","Visits","Meetings","Deals","Not Int."].map(h=>(
                      <th key={h} style={{ padding:"12px 14px", textAlign:"left", fontWeight:700, fontSize:11, whiteSpace:"nowrap", textTransform:"uppercase", letterSpacing:"0.3px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamLoading ? (
                    [...Array(5)].map((_,i)=>(
                      <tr key={i}>{[...Array(9)].map((_,j)=>(
                        <td key={j} style={{ padding:"14px" }}><Skel w={j===0?140:50} h={12}/></td>
                      ))}</tr>
                    ))
                  ) : !teamPerf?.data?.length ? (
                    <tr><td colSpan={9} style={{ padding:48, textAlign:"center", color:COLORS.mauve }}>No team data for this period.</td></tr>
                  ) : (
                    (teamPerf.data as TeamPerfRow[]).map((r,i)=>{
                      const dc = DESIG_COLORS[r.designation??""] ?? COLORS.mauve;
                      return (
                        <tr key={r.id||i} style={{ borderBottom:`1px solid ${COLORS.lavender}20`, background:i%2===0?"#fff":`${COLORS.pearl}80` }}>
                          <td style={{ padding:"12px 14px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                              <div style={{ width:32, height:32, borderRadius:8, background:`${dc}15`, border:`1.5px solid ${dc}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:dc, flexShrink:0 }}>
                                {r.firstName?.[0]}{r.lastName?.[0]??""}
                              </div>
                              <div>
                                <div style={{ fontWeight:700, color:COLORS.darkIndigo }}>{r.firstName} {r.lastName}</div>
                                <div style={{ fontSize:10, color:dc, fontWeight:700 }}>{r.designation?.replace(/_/g," ")}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:"12px 14px", fontWeight:800, color:COLORS.darkIndigo, fontSize:16 }}>{r.callsMade}</td>
                          <td style={{ padding:"12px 14px", color:"#3498DB", fontWeight:600 }}>{r.queries}</td>
                          <td style={{ padding:"12px 14px", color:"#9B59B6", fontWeight:600 }}>{r.remarks}</td>
                          <td style={{ padding:"12px 14px", color:COLORS.gold, fontWeight:600 }}>{r.followUps}</td>
                          <td style={{ padding:"12px 14px", color:"#8E44AD", fontWeight:600 }}>{r.visitsCompleted}</td>
                          <td style={{ padding:"12px 14px", color:"#E67E22", fontWeight:600 }}>{r.meetingsHeld}</td>
                          <td style={{ padding:"12px 14px", fontWeight:800, color:"#27AE60" }}>{r.dealsDone}</td>
                          <td style={{ padding:"12px 14px", color:"#E74C3C", fontWeight:600 }}>{r.notInterested}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Drill-down modal */}
      {modal && (
        <DrillDownModal
          title={modal.title}
          color={modal.color}
          leads={modal.leads}
          onClose={()=>setModal(null)}
        />
      )}

      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </>
  );
}