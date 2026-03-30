"use client";

import { useState, FormEvent } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import { useGetAllLeadsQuery } from "@/store/leads.api";
import { useGetScopeEmployeesQuery } from "@/store/hierarchy.api";
import type { Lead } from "@/types";
import {
  FiSearch, FiPhone, FiMail, FiUser, FiCalendar,
  FiChevronLeft, FiChevronRight, FiX, FiUserCheck, FiEdit3,
} from "react-icons/fi";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

const PAGE_SIZES = [10, 20, 50, 100, 250, 500];

function formatDateTime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {Array.from({ length: 7 }).map((_, i) => (
        <tr key={`skel-${i}`} style={{ borderBottom: `1px solid ${COLORS.lavender}20` }}>
          {[140, 100, 110, 70, 100, 90, 90].map((w, j) => (
            <td key={j} style={{ padding: "12px 16px" }}>
              <div style={{
                height: 13, width: w, borderRadius: 6,
                background: `linear-gradient(90deg, ${COLORS.lavender}25 25%, ${COLORS.lavender}55 50%, ${COLORS.lavender}25 75%)`,
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite",
              }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Lead Table ───────────────────────────────────────────────────────────────

function LeadTable({
  leads,
  isLoading,
  isFetching,
  meta,
  page,
  limit,
  onPageChange,
  onLimitChange,
  emptyMessage = "No leads found.",
}: {
  leads: Lead[];
  isLoading: boolean;
  isFetching: boolean;
  meta: { total: number; page: number; limit: number; totalPages: number } | undefined;
  page: number;
  limit: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  emptyMessage?: string;
}) {
  const showSkeleton = isLoading || isFetching;

  return (
    <div style={{
      background: COLORS.white, borderRadius: 16, overflow: "hidden",
      border: `1px solid ${COLORS.lavender}30`,
      boxShadow: "0 2px 12px rgba(26,15,46,0.04)",
      // subtle opacity shift when refetching (not first load)
      opacity: !isLoading && isFetching ? 0.7 : 1,
      transition: "opacity 0.15s",
    }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
          <thead>
            <tr style={{ background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`, color: "#fff" }}>
              {["Name", "Phone", "Email", "Source", "Assigned To", "Created By", "Created At"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showSkeleton ? (
              <SkeletonRows />
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              leads.map((lead, i) => (
                <tr key={lead.id} style={{
                  borderBottom: `1px solid ${COLORS.lavender}20`,
                  background: i % 2 === 0 ? "#fff" : `${COLORS.pearl}80`,
                }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: COLORS.darkIndigo }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, background: `${COLORS.mauve}15`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: COLORS.mauve, flexShrink: 0,
                      }}>
                        {lead.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      {lead.name}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, color: COLORS.darkIndigo }}>
                      <FiPhone size={12} color={COLORS.mauve} /> {lead.phone}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: COLORS.mauve, fontSize: 12 }}>
                    {lead.email
                      ? <div style={{ display: "flex", alignItems: "center", gap: 4 }}><FiMail size={11} /> {lead.email}</div>
                      : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: COLORS.mauve, fontSize: 12 }}>{lead.source || "—"}</td>
                  <td style={{ padding: "12px 16px", color: COLORS.darkIndigo, fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <FiUser size={11} color={COLORS.mauve} />
                      {lead.assignedTo
                        ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName ?? ""}`.trim()
                        : "—"}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: COLORS.darkIndigo, fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <FiEdit3 size={11} color={COLORS.mauve} />
                      {lead.createdBy
                        ? `${lead.createdBy.firstName} ${lead.createdBy.lastName ?? ""}`.trim()
                        : "—"}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: COLORS.mauve, fontSize: 12, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <FiCalendar size={11} /> {formatDateTime(lead.createdAt)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — always render so layout doesn't jump, but hide when nothing */}
      {meta && meta.total > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderTop: `1px solid ${COLORS.lavender}20`,
          fontSize: 13, color: COLORS.mauve,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Rows:</span>
            <select
              value={limit}
              onChange={(e) => { onLimitChange(Number(e.target.value)); onPageChange(1); }}
              style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${COLORS.lavender}50`, fontSize: 12, background: "#fff", cursor: "pointer" }}
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ marginLeft: 8 }}>
              {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              disabled={page <= 1} onClick={() => onPageChange(page - 1)}
              style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${COLORS.lavender}50`, background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}
            >
              <FiChevronLeft size={14} />
            </button>
            <span style={{ padding: "6px 12px", fontWeight: 700, color: COLORS.darkIndigo }}>
              {meta.page} / {meta.totalPages || 1}
            </span>
            <button
              disabled={page >= (meta.totalPages || 1)} onClick={() => onPageChange(page + 1)}
              style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${COLORS.lavender}50`, background: "#fff", cursor: page >= (meta.totalPages || 1) ? "not-allowed" : "pointer", opacity: page >= (meta.totalPages || 1) ? 0.4 : 1 }}
            >
              <FiChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewLeadsPage() {
  const [search,      setSearch]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const [assignedPage,  setAssignedPage]  = useState(1);
  const [assignedLimit, setAssignedLimit] = useState(20);
  const [createdPage,   setCreatedPage]   = useState(1);
  const [createdLimit,  setCreatedLimit]  = useState(20);

  const [viewTab, setViewTab] = useState<"assigned" | "created">("assigned");

  const { data: scopeEmployees } = useGetScopeEmployeesQuery();

  // ── Assigned leads query ───────────────────────────────────────────────────
  const {
    data: assignedData,
    isLoading: assignedLoading,
    isFetching: assignedFetching,
  } = useGetAllLeadsQuery({
    page: assignedPage,
    limit: assignedLimit,
    search: search || undefined,
    assignedToId: assignedToId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // ── Created-by leads query (only when a person is selected) ───────────────
  const {
    data: createdData,
    isLoading: createdLoading,
    isFetching: createdFetching,
  } = useGetAllLeadsQuery(
    {
      page: createdPage,
      limit: createdLimit,
      search: search || undefined,
      createdById: assignedToId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    { skip: !assignedToId },
  );

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setAssignedPage(1);
    setCreatedPage(1);
  };

  const handleClear = () => {
    setSearchInput("");
    setSearch("");
    setAssignedPage(1);
    setCreatedPage(1);
  };

  const handlePersonChange = (id: string) => {
    setAssignedToId(id);
    setAssignedPage(1);
    setCreatedPage(1);
    setViewTab("assigned");
  };

  const handleDateChange = (field: "dateFrom" | "dateTo", val: string) => {
    if (field === "dateFrom") setDateFrom(val);
    else setDateTo(val);
    setAssignedPage(1);
    setCreatedPage(1);
  };

  const selectedEmployee = scopeEmployees?.find((e) => e.id === assignedToId);
  const assignedTotal    = assignedData?.meta?.total ?? 0;
  const createdTotal     = createdData?.meta?.total  ?? 0;

  return (
    <>
      <TopBar title="New Leads" subtitle="All newly added leads — read-only view">
      <TutorialButton videoUrl={TUTORIALS.newLeads} />
      </TopBar>

      <div style={{ padding: "24px 32px" }}>

        {/* ── Toolbar ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, flex: 1, minWidth: 250 }}>
            <div style={{
              display: "flex", alignItems: "center", flex: 1,
              background: COLORS.white, borderRadius: 10,
              border: `1px solid ${COLORS.lavender}50`, padding: "0 12px",
            }}>
              <FiSearch size={16} color={COLORS.mauve} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by phone or name..."
                style={{
                  flex: 1, border: "none", outline: "none", padding: "10px 10px",
                  fontSize: 13, background: "transparent", color: COLORS.darkIndigo,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              {searchInput && (
                <FiX size={14} color={COLORS.mauve} style={{ cursor: "pointer" }} onClick={handleClear} />
              )}
            </div>
            <button type="submit" style={{
              padding: "10px 18px", borderRadius: 10, border: "none",
              background: COLORS.mauve, color: "#fff", fontSize: 13,
              fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>
              Search
            </button>
          </form>

          <select
            value={assignedToId}
            onChange={(e) => handlePersonChange(e.target.value)}
            style={{
              padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${COLORS.lavender}50`, fontSize: 13,
              background: COLORS.white, color: COLORS.darkIndigo,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <option value="">All Staff</option>
            {scopeEmployees?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="date" value={dateFrom}
              onChange={(e) => handleDateChange("dateFrom", e.target.value)}
              style={{
                padding: "9px 12px", borderRadius: 10,
                border: `1px solid ${COLORS.lavender}50`, fontSize: 12,
                background: COLORS.white, color: COLORS.darkIndigo,
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <span style={{ color: COLORS.mauve, fontSize: 12 }}>to</span>
            <input
              type="date" value={dateTo}
              onChange={(e) => handleDateChange("dateTo", e.target.value)}
              style={{
                padding: "9px 12px", borderRadius: 10,
                border: `1px solid ${COLORS.lavender}50`, fontSize: 12,
                background: COLORS.white, color: COLORS.darkIndigo,
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); setAssignedPage(1); setCreatedPage(1); }}
                style={{
                  padding: "8px 10px", borderRadius: 8,
                  border: `1px solid ${COLORS.lavender}40`,
                  background: "#fff", color: COLORS.mauve,
                  cursor: "pointer", display: "flex", alignItems: "center",
                }}
              >
                <FiX size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ── Person banner + sub-tabs ── */}
        {assignedToId && selectedEmployee && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 18px", borderRadius: "12px 12px 0 0",
              background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`,
              color: "#fff",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
              }}>
                {selectedEmployee.firstName[0]}{selectedEmployee.lastName?.[0] ?? ""}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>
                  {selectedEmployee.designation.replace(/_/g, " ")}
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>
                    {assignedFetching && !assignedData ? "—" : assignedTotal}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Assigned
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>
                    {createdFetching && !createdData ? "—" : createdTotal}
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Created
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              display: "flex", background: "#fff",
              borderLeft: `1px solid ${COLORS.lavender}30`,
              borderRight: `1px solid ${COLORS.lavender}30`,
              borderBottom: `1px solid ${COLORS.lavender}30`,
              borderRadius: "0 0 12px 12px", overflow: "hidden",
            }}>
              {([
                { key: "assigned", label: "Assigned Leads", icon: FiUserCheck, count: assignedTotal },
                { key: "created",  label: "Created by them", icon: FiEdit3,    count: createdTotal  },
              ] as const).map((tab) => {
                const active = viewTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setViewTab(tab.key)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      padding: "13px 0", border: "none", background: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      color: active ? COLORS.darkIndigo : COLORS.mauve,
                      borderBottom: active ? `2.5px solid ${COLORS.gold}` : "2.5px solid transparent",
                      fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                    }}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                    <span style={{
                      background: active ? COLORS.gold : `${COLORS.lavender}60`,
                      color: active ? "#fff" : COLORS.darkIndigo,
                      fontSize: 10, fontWeight: 700,
                      padding: "1px 8px", borderRadius: 10, minWidth: 18, textAlign: "center",
                    }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tables ── */}
        {!assignedToId && (
          <LeadTable
            leads={assignedData?.data || []}
            isLoading={assignedLoading}
            isFetching={assignedFetching}
            meta={assignedData?.meta}
            page={assignedPage}
            limit={assignedLimit}
            onPageChange={setAssignedPage}
            onLimitChange={setAssignedLimit}
          />
        )}

        {assignedToId && viewTab === "assigned" && (
          <LeadTable
            leads={assignedData?.data || []}
            isLoading={assignedLoading}
            isFetching={assignedFetching}
            meta={assignedData?.meta}
            page={assignedPage}
            limit={assignedLimit}
            onPageChange={setAssignedPage}
            onLimitChange={setAssignedLimit}
            emptyMessage={`No leads assigned to ${selectedEmployee?.firstName}.`}
          />
        )}

        {assignedToId && viewTab === "created" && (
          <LeadTable
            leads={createdData?.data || []}
            isLoading={createdLoading}
            isFetching={createdFetching}
            meta={createdData?.meta}
            page={createdPage}
            limit={createdLimit}
            onPageChange={setCreatedPage}
            onLimitChange={setCreatedLimit}
            emptyMessage={`No leads created by ${selectedEmployee?.firstName}.`}
          />
        )}
      </div>
    </>
  );
}