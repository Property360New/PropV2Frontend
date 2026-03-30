"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import {
  useGetTabCountsQuery,
  useFindLeadTabQuery,
  useGetFreshLeadsQuery,
  useGetLeadsByStatusQuery,
  useGetLeadDetailQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useAssignLeadMutation,
  useBulkAssignMutation,
} from "@/store/leads.api";
import { useRenderTemplateMutation } from "@/store/whatsapp.api";
import { useGetScopeEmployeesQuery } from "@/store/hierarchy.api";
import { QueryModal, QueryCard } from "@/components/dashboard/QueryModal";
import { useGetProfileQuery } from "@/store/auth.api";
import type { Lead, LeadStatus, LeadQuery } from "@/types";
import {
  FiPlus, FiSearch, FiPhone, FiMail, FiUser,
  FiCalendar, FiChevronLeft, FiChevronRight, FiX,
  FiUserPlus, FiMessageSquare, FiClock, FiEye, FiEdit2, FiUploadCloud, FiHeart, FiGift,
} from "react-icons/fi";
import { BulkImportModal } from "@/components/leads/BulkImportModal";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS: { key: string; label: string; color: string }[] = [
  { key: "FRESH",          label: "Fresh",          color: "#3498DB" },
  { key: "FOLLOW_UP",      label: "Follow Up",      color: COLORS.gold },
  { key: "DEAL_DONE",      label: "Deal Done",      color: "#27AE60" },
  { key: "VISIT_DONE",     label: "Visit Done",     color: "#8E44AD" },
  { key: "MEETING_DONE",   label: "Meeting Done",   color: "#2980B9" },
  { key: "HOT_PROSPECT",   label: "Hot Prospect",   color: "#E74C3C" },
  { key: "RINGING",        label: "Ringing",        color: "#27AE60" },
  { key: "CALL_BACK",      label: "Call Back",      color: "#E67E22" },
  { key: "SUSPECT",        label: "Suspect",        color: "#9B59B6" },
  { key: "SWITCH_OFF",     label: "Switch Off",     color: "#7F8C8D" },
  { key: "WRONG_NUMBER",   label: "Wrong Number",   color: "#95A5A6" },
  { key: "NOT_INTERESTED", label: "Not Interested", color: "#C0392B" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const tab   = STATUS_TABS.find((t) => t.key === status);
  const color = tab?.color || COLORS.mauve;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, color,
      background: `${color}15`, border: `1px solid ${color}30`, whiteSpace: "nowrap",
    }}>
      {tab?.label || status.replace(/_/g, " ")}
    </span>
  );
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const modalInputStyle: React.CSSProperties = {
  width: "100%",
  border: `1.5px solid ${COLORS.lavender}60`,
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 13,
  background: "transparent",
  color: COLORS.darkIndigo,
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box",
};

const modalLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: COLORS.darkIndigo,
  display: "block",
  marginBottom: 4,
};

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  dark = false,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  dark?: boolean;
}) {
  const active = checked || indeterminate;
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${active ? COLORS.gold : dark ? "rgba(255,255,255,0.4)" : `${COLORS.mauve}50`}`,
        background: active ? COLORS.gold : "transparent",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}
    >
      {active && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          {indeterminate && !checked
            ? <path d="M2 5H8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
            : <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          }
        </svg>
      )}
    </div>
  );
}

// ─── WhatsApp helpers ─────────────────────────────────────────────────────────

function openWhatsApp(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  const intl    = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
  window.open(`https://wa.me/${intl}`, "_blank");
}

function WhatsAppButton({ leadId, phone }: { leadId: string; phone: string }) {
  const [render, { isLoading }] = useRenderTemplateMutation();
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await render({ leadId }).unwrap();
      if (result?.whatsappUrl) { window.open(result.whatsappUrl, "_blank"); return; }
    } catch { /* fallback */ }
    openWhatsApp(phone);
  };
  return (
    <button onClick={handleClick} disabled={isLoading} style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      padding: "10px 0", borderRadius: 10, border: "none",
      background: "#25D366", color: "#fff", fontSize: 13, fontWeight: 700,
      cursor: isLoading ? "not-allowed" : "pointer",
    }}>
      <FiMessageSquare size={14} /> {isLoading ? "..." : "WhatsApp"}
    </button>
  );
}

function WhatsAppIconBtn({ leadId, phone }: { leadId: string; phone: string }) {
  const [render] = useRenderTemplateMutation();
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await render({ leadId }).unwrap();
      if (result?.whatsappUrl) { window.open(result.whatsappUrl, "_blank"); return; }
    } catch { /* fallback */ }
    openWhatsApp(phone);
  };
  return (
    <button onClick={handleClick} title="WhatsApp" style={{
      background: "#25D36615", border: "1px solid #25D36630", borderRadius: 6,
      padding: "5px 7px", cursor: "pointer", color: "#25D366",
      display: "flex", alignItems: "center",
    }}>
      <FiMessageSquare size={13} />
    </button>
  );
}

// ─── Lead Detail Panel ────────────────────────────────────────────────────────

interface LeadDetailPanelProps {
  leadId: string;
  highlightedQueryId?: string;
  onClose: () => void;
  currentEmployeeId?: string;
  isAdmin?: boolean;
}

function LeadDetailPanel({
  leadId,
  highlightedQueryId,
  onClose,
  currentEmployeeId = "",
  isAdmin = false,
}: LeadDetailPanelProps) {
  const { data: lead, isLoading } = useGetLeadDetailQuery(leadId);
  const [showAddQuery,  setShowAddQuery]  = useState(false);
  const [showEditLead,  setShowEditLead]  = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && highlightedQueryId && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [isLoading, highlightedQueryId]);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(26,15,46,0.5)",
          display: "flex", justifyContent: "flex-end",
          backdropFilter: "blur(3px)",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 580, background: "#f8f7fc",
            height: "100vh", overflowY: "auto",
            boxShadow: "-8px 0 32px rgba(26,15,46,0.15)",
            animation: "fadeSlideIn 0.25s ease both",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "20px 24px",
            background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`,
            color: "#fff", display: "flex", justifyContent: "space-between",
            alignItems: "center", position: "sticky", top: 0, zIndex: 2,
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif" }}>
                Lead Details
              </h3>
              {lead && (
                <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.8 }}>
                  {lead.name} · {lead.phone}
                </p>
              )}
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
              width: 32, height: 32, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
            }}>
              <FiX size={18} />
            </button>
          </div>

          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>Loading...</div>
          ) : !lead ? (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>Lead not found</div>
          ) : (
            <div style={{ padding: "20px 24px" }}>
              {/* Info card */}
              <div style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px",
                marginBottom: 16, border: `1px solid ${COLORS.lavender}30`,
                boxShadow: "0 2px 8px rgba(26,15,46,0.04)",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { label: "Name",        value: lead.name,         icon: <FiUser     size={12} /> },
                    { label: "Phone",       value: lead.phone,        icon: <FiPhone    size={12} /> },
                    { label: "Email",       value: lead.email || "—", icon: <FiMail     size={12} /> },
                    { label: "Source",      value: lead.source || "—",icon: <FiEye      size={12} /> },
                    { label: "Assigned To", value: lead.assignedTo
                        ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName ?? ""}`.trim()
                        : "—",                                          icon: <FiUser   size={12} /> },
                    { label: "Created",     value: formatDate(lead.createdAt), icon: <FiCalendar size={12} /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: COLORS.mauve,
                        textTransform: "uppercase", marginBottom: 3,
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        {icon} {label}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.darkIndigo }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Birthday / Anniversary chips */}
                {((lead as any).clientBirthday || (lead as any).clientMarriageAnniversary) && (
                  <div style={{
                    display: "flex", gap: 10, marginTop: 14,
                    paddingTop: 14, borderTop: `1px solid ${COLORS.lavender}20`,
                    flexWrap: "wrap",
                  }}>
                    {(lead as any).clientBirthday && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 12px", borderRadius: 20,
                        background: "#E74C3C10", border: "1px solid #E74C3C30",
                        fontSize: 12, color: "#E74C3C", fontWeight: 600,
                      }}>
                        🎂 {formatDate((lead as any).clientBirthday)}
                      </div>
                    )}
                    {(lead as any).clientMarriageAnniversary && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 12px", borderRadius: 20,
                        background: "#8E44AD10", border: "1px solid #8E44AD30",
                        fontSize: 12, color: "#8E44AD", fontWeight: 600,
                      }}>
                        💍 {formatDate((lead as any).clientMarriageAnniversary)}
                      </div>
                    )}
                  </div>
                )}

                {lead.address && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.lavender}20` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.mauve, textTransform: "uppercase", marginBottom: 3 }}>
                      Address
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.darkIndigo }}>{lead.address}</div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <a href={`tel:${lead.phone}`} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 0", borderRadius: 10, border: "none", textDecoration: "none",
                  background: "#27AE60", color: "#fff", fontSize: 13, fontWeight: 700,
                }}>
                  <FiPhone size={14} /> Call
                </a>
                <WhatsAppButton leadId={lead.id} phone={lead.phone} />
                <button onClick={() => setShowAddQuery(true)} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 0", borderRadius: 10, border: "none",
                  background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  boxShadow: `0 4px 12px ${COLORS.gold}35`,
                }}>
                  <FiPlus size={14} /> Add Query
                </button>
                <button onClick={() => setShowEditLead(true)} title="Edit Lead" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.lavender}50`,
                  background: "#fff", color: COLORS.mauve, fontSize: 13, fontWeight: 700,
                  cursor: "pointer",
                }}>
                  <FiEdit2 size={14} />
                </button>
              </div>

              {/* Query History */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 12,
              }}>
                <h4 style={{
                  margin: 0, fontSize: 15, fontWeight: 800, color: COLORS.darkIndigo,
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "'Playfair Display', serif",
                }}>
                  <FiClock size={14} /> Query History ({lead.queries?.length ?? 0})
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: COLORS.mauve,
                    background: `${COLORS.mauve}12`, padding: "2px 8px", borderRadius: 10,
                  }}>
                    {lead.totalCalls ?? 0} total calls
                  </span>
                </h4>
                <button onClick={() => setShowAddQuery(true)} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 8, border: "none",
                  background: `${COLORS.mauve}12`, color: COLORS.mauve,
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  <FiPlus size={12} /> New Query
                </button>
              </div>

              {(!lead.queries || lead.queries.length === 0) ? (
                <div style={{
                  padding: 32, textAlign: "center", color: COLORS.mauve, fontSize: 13,
                  background: "#fff", borderRadius: 12, border: `1px solid ${COLORS.lavender}25`,
                }}>
                  No queries yet — click "Add Query" to log the first call.
                </div>
              ) : (
                lead.queries.map((q: LeadQuery) => {
                  const isHighlighted = q.id === highlightedQueryId;
                  const canEdit = true;
                  return (
                    <div key={q.id} ref={isHighlighted ? highlightRef : undefined}>
                      <QueryCard
                        query={q}
                        leadId={lead.id}
                        canEdit={canEdit}
                        isAdmin={isAdmin}
                        isHighlighted={isHighlighted}
                        defaultExpanded={isHighlighted}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {showAddQuery && lead && (
        <QueryModal
          leadId={lead.id}
          leadName={lead.name}
          isAdmin={isAdmin}
          onClose={() => setShowAddQuery(false)}
        />
      )}
      {showEditLead && lead && (
        <EditLeadModal lead={lead} onClose={() => setShowEditLead(false)} />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const searchParams  = useSearchParams();
  const statusFromUrl = searchParams.get("status");

  const [activeTab,       setActiveTab]       = useState(statusFromUrl || "FRESH");
  const [searchInput,     setSearchInput]     = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [page,            setPage]            = useState(1);
  const [limit,           setLimit]           = useState(20);
  const [assignedToId,    setAssignedToId]    = useState("");
  const [showCreate,      setShowCreate]      = useState(false);
  const [showBulkImport,  setShowBulkImport]  = useState(false);
  const [showAssign,      setShowAssign]      = useState<string | null>(null);
  const [selectedLead,    setSelectedLead]    = useState<{ leadId: string; highlightedQueryId?: string } | null>(null);

  // ── Bulk selection state ───────────────────────────────────────────────────
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  const prevTabRef = useRef(activeTab);

  const PAGE_SIZES = [10, 20, 50, 100, 250, 500];
  const { data: profile } = useGetProfileQuery();
  const isAdmin = profile?.designation === "ADMIN";
  const currentEmployeeId = profile?.employeeId ?? "";

  useEffect(() => {
    if (profile?.employeeId) {
      setAssignedToId(profile.employeeId);
    }
  }, [profile?.employeeId]);

  // Clear selection when tab / search / filter / page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, committedSearch, assignedToId, page]);

  useEffect(() => {
    if (statusFromUrl && STATUS_TABS.some((t) => t.key === statusFromUrl)) {
      setActiveTab(statusFromUrl);
      setPage(1);
    }
  }, [statusFromUrl]);

  const { data: tabCounts } = useGetTabCountsQuery(
    (committedSearch || assignedToId)
      ? { search: committedSearch || undefined, assignedToId: assignedToId || undefined }
      : undefined
  );

  const { data: findTabResult } = useFindLeadTabQuery(
    committedSearch
      ? { search: committedSearch, assignedToId: assignedToId || undefined }
      : { search: "" },
    { skip: !committedSearch }
  );

  const { data: scopeEmployees } = useGetScopeEmployeesQuery();

  const queryParams = {
    page,
    limit,
    search:       committedSearch || undefined,
    assignedToId: assignedToId   || undefined,
  };

  const isFresh = activeTab === "FRESH";

  const freshResult  = useGetFreshLeadsQuery(queryParams, { skip: !isFresh });
const statusResult = useGetLeadsByStatusQuery(
  { status: activeTab, ...queryParams },
  { skip: isFresh },   // skip is the only gate — no dummy argument
);

  const result   = isFresh ? freshResult : statusResult;
  const leads: Lead[] = result.data?.data || [];

  const rawMeta = (result.data as any)?.meta ?? (result.data as any)?.pagination ?? null;
  const meta = rawMeta ? {
    page:       rawMeta.page       ?? page,
    limit:      rawMeta.limit      ?? limit,
    total:      rawMeta.total      ?? 0,
    totalPages: rawMeta.totalPages ?? 1,
  } : null;

  const isLoading = result.isLoading || result.isFetching;

  // ── Search helpers ─────────────────────────────────────────────────────────
  const isPhoneInput = (v: string) => /^[0-9+\-\s()]*$/.test(v) && v.replace(/\D/g, "").length >= 4;

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    if (value === "" || isPhoneInput(value)) {
      setCommittedSearch(value);
      setPage(1);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setCommittedSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setCommittedSearch("");
    setPage(1);
  };

  const switchTab = (tab: string) => {
    if (tab === activeTab) return;
    prevTabRef.current = activeTab;
    setActiveTab(tab);
    setPage(1);
  };

  const deduplicatedLeads = leads.reduce<Lead[]>((acc, lead) => {
    if (!acc.find((l) => l.id === lead.id)) acc.push(lead);
    return acc;
  }, []);

  const openDetail = (lead: Lead) => {
    setSelectedLead({
      leadId: lead.id,
      highlightedQueryId: (lead as any).highlightedQueryId ?? lead.latestQuery?.id,
    });
  };

  useEffect(() => {
    if (!findTabResult?.tab || !committedSearch) return;
    const targetTab = findTabResult.tab;
    if (targetTab !== activeTab) {
      setActiveTab(targetTab);
      setPage(1);
    }
  }, [findTabResult, committedSearch]);

  // ── Bulk selection helpers ─────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === deduplicatedLeads.length && deduplicatedLeads.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deduplicatedLeads.map((l) => l.id)));
    }
  };

  const isAllSelected     = deduplicatedLeads.length > 0 && selectedIds.size === deduplicatedLeads.length;
  const isPartialSelected = selectedIds.size > 0 && !isAllSelected;
  const hasSelection      = selectedIds.size > 0;

  return (
    <>
      <TopBar title="Leads Bank" subtitle="Manage and track all your leads">
      <TutorialButton videoUrl={TUTORIALS.leads} />
      </TopBar>

      <div style={{ padding: "24px 32px" }}>

        {/* Status Tabs */}
        <div style={{
          display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20,
          background: COLORS.white, borderRadius: 14, padding: "12px 16px",
          border: `1px solid ${COLORS.lavender}30`,
          boxShadow: "0 2px 8px rgba(26,15,46,0.04)",
        }}>
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.key;
            const count  = tabCounts?.[tab.key] ?? 0;
            return (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8, border: "none",
                  cursor: "pointer", fontSize: 12.5,
                  fontWeight: active ? 700 : 500,
                  fontFamily: "'DM Sans', sans-serif",
                  background: active ? `${tab.color}15` : "transparent",
                  color: active ? tab.color : COLORS.mauve,
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
                <span style={{
                  background: active ? tab.color : `${COLORS.lavender}60`,
                  color:      active ? "#fff"    : COLORS.darkIndigo,
                  fontSize: 10, fontWeight: 700,
                  padding: "1px 7px", borderRadius: 10,
                  minWidth: 18, textAlign: "center",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
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
                onChange={(e) => handleSearchInputChange(e.target.value)}
                placeholder="Phone (auto), name, last 4 digits..."
                style={{
                  flex: 1, border: "none", outline: "none", padding: "10px 10px",
                  fontSize: 13, background: "transparent", color: COLORS.darkIndigo,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              {searchInput && (
                <FiX size={14} color={COLORS.mauve} style={{ cursor: "pointer" }}
                  onClick={handleClearSearch} />
              )}
            </div>
            <button type="submit" style={{
              padding: "10px 18px", borderRadius: 10, border: "none",
              background: COLORS.mauve, color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Search
            </button>
          </form>

          <select
            value={assignedToId}
            onChange={(e) => { setAssignedToId(e.target.value); setPage(1); }}
            style={{
              padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${COLORS.lavender}50`, fontSize: 13,
              background: COLORS.white, color: COLORS.darkIndigo,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {scopeEmployees?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowBulkImport(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px", borderRadius: 10,
              border: `1.5px solid ${COLORS.lavender}50`,
              background: "#fff", color: COLORS.darkIndigo,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <FiUploadCloud size={15} /> Import
          </button>

          <button onClick={() => setShowCreate(true)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: `0 4px 12px ${COLORS.gold}40`,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <FiPlus size={16} /> Add Lead
          </button>
        </div>

        {/* ── Bulk Action Bar ── */}
        {hasSelection && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "11px 18px", marginBottom: 10, borderRadius: 12,
            background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`,
            boxShadow: `0 4px 20px rgba(26,15,46,0.25)`,
            animation: "fadeSlideIn 0.2s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setSelectedIds(new Set())}
                title="Clear selection"
                style={{
                  background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 6,
                  width: 28, height: 28, cursor: "pointer", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FiX size={14} />
              </button>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
                {selectedIds.size} lead{selectedIds.size > 1 ? "s" : ""} selected
              </span>
              <button
                onClick={toggleSelectAll}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                  color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {isAllSelected
                  ? "Deselect all"
                  : `Select all ${deduplicatedLeads.length} on page`}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowBulkAssign(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 18px", borderRadius: 8, border: "none",
                  background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  boxShadow: `0 4px 12px ${COLORS.gold}40`,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <FiUserPlus size={14} />
                Assign {selectedIds.size} lead{selectedIds.size > 1 ? "s" : ""}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{
          background: COLORS.white, borderRadius: 16, overflow: "hidden",
          border: `1px solid ${COLORS.lavender}30`,
          boxShadow: "0 2px 12px rgba(26,15,46,0.04)",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`, color: "#fff" }}>
                  <th style={{ padding: "12px 16px", width: 44 }}>
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isPartialSelected}
                      onChange={toggleSelectAll}
                      dark
                    />
                  </th>
                  {["Name", "Phone", "Assigned To", "Status", "Source", "Created", "Last Called", "Calls", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, fontSize: 12, letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`skel-${i}`} style={{ borderBottom: `1px solid ${COLORS.lavender}20` }}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} style={{ padding: "12px 16px" }}>
                            <div style={{
                              height: 14,
                              width: j === 0 ? 140 : j === 6 ? 100 : 80,
                              borderRadius: 6,
                              background: `linear-gradient(90deg, ${COLORS.lavender}30 25%, ${COLORS.lavender}60 50%, ${COLORS.lavender}30 75%)`,
                              backgroundSize: "200% 100%",
                              animation: "shimmer 1.4s infinite",
                            }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                    <style>{`
                      @keyframes shimmer {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                      }
                    `}</style>
                  </>
                ) : deduplicatedLeads.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={10} style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>
                      No leads found in this tab.
                    </td>
                  </tr>
                ) : (
                  deduplicatedLeads.map((lead, i) => {
                    const isSelected   = selectedIds.has(lead.id);
                    const latestStatus =
                      lead.latestQuery?.status ??
                      lead.latestQuery?.callStatus ??
                      activeTab;

                    return (
                      <tr
                        key={lead.id}
                        onClick={() => openDetail(lead)}
                        style={{
                          borderBottom: `1px solid ${COLORS.lavender}20`,
                          background: isSelected
                            ? `${COLORS.gold}08`
                            : i % 2 === 0 ? "#fff" : `${COLORS.pearl}80`,
                          transition: "background 0.15s",
                          cursor: "pointer",
                          outline: isSelected ? `2px solid ${COLORS.gold}40` : "none",
                          outlineOffset: "-2px",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = `${COLORS.gold}08`;
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = i % 2 === 0 ? "#fff" : `${COLORS.pearl}80`;
                        }}
                      >
                        <td
                          style={{ padding: "12px 16px", width: 44 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleSelect(lead.id)}
                          />
                        </td>

                        {/* Name */}
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: COLORS.darkIndigo }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: `${COLORS.mauve}15`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: 700, color: COLORS.mauve, flexShrink: 0,
                            }}>
                              {lead.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <div>{lead.name || "—"}</div>
                              {lead.email && (
                                <div style={{ fontSize: 11, color: COLORS.mauve, display: "flex", alignItems: "center", gap: 3 }}>
                                  <FiMail size={10} /> {lead.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td style={{ padding: "12px 16px", color: COLORS.darkIndigo }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <FiPhone size={12} color={COLORS.mauve} /> {lead.phone || "—"}
                          </div>
                        </td>

                        {/* Assigned To */}
                        <td style={{ padding: "12px 16px", color: COLORS.darkIndigo }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <FiUser size={12} color={COLORS.mauve} />
                            {lead.assignedTo
                              ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName ?? ""}`.trim()
                              : "—"}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "12px 16px" }}>
                          <StatusBadge status={latestStatus} />
                        </td>

                        {/* Source */}
                        <td style={{ padding: "12px 16px", color: COLORS.mauve, fontSize: 12 }}>
                          {lead.source || "—"}
                        </td>

                        {/* Created */}
                        <td style={{ padding: "12px 16px", color: COLORS.mauve, fontSize: 12, whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <FiCalendar size={11} /> {formatDate(lead.createdAt)}
                          </div>
                        </td>

                        {/* Last Called */}
                        <td style={{ padding: "12px 16px", color: COLORS.mauve, fontSize: 12, whiteSpace: "nowrap" }}>
                          {formatDateTime(lead.lastCalledAt)}
                        </td>

                        {/* Calls */}
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <span style={{
                            background: `${COLORS.mauve}15`, color: COLORS.darkIndigo,
                            padding: "2px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                          }}>
                            {lead.totalCalls ?? 0}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                            <a href={`tel:${lead.phone}`} title="Call" style={{
                              background: "#27AE6015", border: "1px solid #27AE6030",
                              borderRadius: 6, padding: "5px 7px", color: "#27AE60",
                              display: "flex", alignItems: "center", textDecoration: "none",
                            }}>
                              <FiPhone size={13} />
                            </a>
                            <WhatsAppIconBtn leadId={lead.id} phone={lead.phone} />
                            <button
                              onClick={() => setShowAssign(lead.id)}
                              title="Assign"
                              style={{
                                background: `${COLORS.mauve}12`,
                                border: `1px solid ${COLORS.mauve}30`,
                                borderRadius: 6, padding: "5px 7px",
                                cursor: "pointer", color: COLORS.mauve,
                                display: "flex", alignItems: "center",
                              }}
                            >
                              <FiUserPlus size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  style={{
                    padding: "4px 8px", borderRadius: 6,
                    border: `1px solid ${COLORS.lavender}50`,
                    fontSize: 12, background: "#fff", cursor: "pointer",
                  }}
                >
                  {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ marginLeft: 8 }}>
                  Showing {Math.min((meta.page - 1) * meta.limit + 1, meta.total)}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={{
                    padding: "6px 10px", borderRadius: 6,
                    border: `1px solid ${COLORS.lavender}50`,
                    background: "#fff",
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                    opacity: page <= 1 ? 0.4 : 1,
                  }}
                >
                  <FiChevronLeft size={14} />
                </button>
                <span style={{ padding: "6px 12px", fontWeight: 700, color: COLORS.darkIndigo }}>
                  {meta.page} / {meta.totalPages}
                </span>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  style={{
                    padding: "6px 10px", borderRadius: 6,
                    border: `1px solid ${COLORS.lavender}50`,
                    background: "#fff",
                    cursor: page >= meta.totalPages ? "not-allowed" : "pointer",
                    opacity: page >= meta.totalPages ? 0.4 : 1,
                  }}
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel
          leadId={selectedLead.leadId}
          highlightedQueryId={selectedLead.highlightedQueryId}
          onClose={() => setSelectedLead(null)}
          currentEmployeeId={currentEmployeeId}
          isAdmin={isAdmin}
        />
      )}

      {showCreate && <CreateLeadModal onClose={() => setShowCreate(false)} />}
      {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} />}
      {showAssign && <AssignLeadModal leadId={showAssign} onClose={() => setShowAssign(null)} />}
      {showBulkAssign && (
        <BulkAssignModal
          leadIds={Array.from(selectedIds)}
          onClose={() => setShowBulkAssign(false)}
          onSuccess={() => {
            setSelectedIds(new Set());
            setShowBulkAssign(false);
          }}
        />
      )}
    </>
  );
}

// ─── Create Lead Modal ────────────────────────────────────────────────────────

function CreateLeadModal({ onClose }: { onClose: () => void }) {
  const [createLead, { isLoading }] = useCreateLeadMutation();
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", source: "",
    clientBirthday: "", clientMarriageAnniversary: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createLead({
        name:    form.name,
        phone:   form.phone,
        email:   form.email   || undefined,
        address: form.address || undefined,
        source:  form.source  || undefined,
        clientBirthday:            form.clientBirthday            || undefined,
        clientMarriageAnniversary: form.clientMarriageAnniversary || undefined,
      }).unwrap();
      onClose();
    } catch (err: unknown) {
      setError((err as { data?: { message?: string } })?.data?.message || "Failed to create lead");
    }
  };

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(26,15,46,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 20, padding: 32, width: 460,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "none", border: "none", cursor: "pointer", color: COLORS.mauve,
        }}>
          <FiX size={20} />
        </button>
        <h2 style={{
          margin: "0 0 20px", fontSize: 22, fontWeight: 800,
          fontFamily: "'Playfair Display', Georgia, serif", color: COLORS.darkIndigo,
        }}>
          Add New Lead
        </h2>
        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: COLORS.dangerLight, color: COLORS.danger,
            fontSize: 13, fontWeight: 600, marginBottom: 16,
          }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={modalLabelStyle}>
              Name <span style={{ color: COLORS.danger }}>*</span>
            </label>
            <div style={{
              display: "flex", alignItems: "center",
              border: `1.5px solid ${COLORS.lavender}60`, borderRadius: 10, padding: "0 12px",
            }}>
              <FiUser size={15} color={COLORS.mauve} />
              <input
                type="text" required value={form.name}
                onChange={(e) => set("name", e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", padding: "10px", fontSize: 13, background: "transparent", color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 14 }}>
            <label style={modalLabelStyle}>
              Phone <span style={{ color: COLORS.danger }}>*</span>
            </label>
            <div style={{
              display: "flex", alignItems: "center",
              border: `1.5px solid ${COLORS.lavender}60`, borderRadius: 10, padding: "0 12px",
            }}>
              <FiPhone size={15} color={COLORS.mauve} />
              <input
                type="tel" required value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", padding: "10px", fontSize: 13, background: "transparent", color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={modalLabelStyle}>Email</label>
            <div style={{
              display: "flex", alignItems: "center",
              border: `1.5px solid ${COLORS.lavender}60`, borderRadius: 10, padding: "0 12px",
            }}>
              <FiMail size={15} color={COLORS.mauve} />
              <input
                type="email" value={form.email}
                onChange={(e) => set("email", e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", padding: "10px", fontSize: 13, background: "transparent", color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: 14 }}>
            <label style={modalLabelStyle}>Address</label>
            <textarea value={form.address} onChange={(e) => set("address", e.target.value)}
              rows={2} style={{ ...modalInputStyle, resize: "vertical" }} />
          </div>

          {/* Source */}
          <div style={{ marginBottom: 14 }}>
            <label style={modalLabelStyle}>Source</label>
            <input value={form.source} onChange={(e) => set("source", e.target.value)}
              placeholder="e.g. 99acres, MagicBricks, Walk-in"
              style={modalInputStyle} />
          </div>

          {/* ── Birthday & Anniversary ── */}
          <div style={{
            padding: "14px 16px", borderRadius: 12, marginBottom: 14,
            background: `${COLORS.lavender}10`, border: `1px solid ${COLORS.lavender}30`,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: COLORS.mauve,
              textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12,
            }}>
              🎉 Client Special Days (optional)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ ...modalLabelStyle, display: "flex", alignItems: "center", gap: 5 }}>
                  🎂 Birthday
                </label>
                <input
                  type="date"
                  value={form.clientBirthday}
                  onChange={(e) => set("clientBirthday", e.target.value)}
                  style={modalInputStyle}
                />
              </div>
              <div>
                <label style={{ ...modalLabelStyle, display: "flex", alignItems: "center", gap: 5 }}>
                  💍 Anniversary
                </label>
                <input
                  type="date"
                  value={form.clientMarriageAnniversary}
                  onChange={(e) => set("clientMarriageAnniversary", e.target.value)}
                  style={modalInputStyle}
                />
              </div>
            </div>
            <div style={{ fontSize: 11, color: COLORS.mauve, marginTop: 8, lineHeight: 1.5 }}>
              You'll be reminded on these dates to wish your client.
            </div>
          </div>

          <button type="submit" disabled={isLoading} style={{
            width: "100%", padding: 13, borderRadius: 10, border: "none",
            background: isLoading ? COLORS.lavender : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
            color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: isLoading ? "none" : `0 4px 12px ${COLORS.gold}40`,
          }}>
            {isLoading ? "Creating..." : "Create Lead"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Lead Modal ──────────────────────────────────────────────────────────

function EditLeadModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [updateLead, { isLoading }] = useUpdateLeadMutation();
  const [form, setForm] = useState({
    name:    lead.name    || "",
    phone:   lead.phone   || "",
    email:   lead.email   || "",
    address: lead.address || "",
    source:  lead.source  || "",
    clientBirthday:            (lead as any).clientBirthday
      ? new Date((lead as any).clientBirthday).toISOString().slice(0, 10)
      : "",
    clientMarriageAnniversary: (lead as any).clientMarriageAnniversary
      ? new Date((lead as any).clientMarriageAnniversary).toISOString().slice(0, 10)
      : "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await updateLead({
        id: lead.id,
        body: {
          name:    form.name    || undefined,
          phone:   form.phone   || undefined,
          email:   form.email   || undefined,
          address: form.address || undefined,
          source:  form.source  || undefined,
          clientBirthday:            form.clientBirthday            || undefined,
          clientMarriageAnniversary: form.clientMarriageAnniversary || undefined,
        },
      }).unwrap();
      onClose();
    } catch (err: unknown) {
      setError((err as { data?: { message?: string } })?.data?.message || "Failed to update lead");
    }
  };

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(26,15,46,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 20, padding: 32, width: 460,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "none", border: "none", cursor: "pointer", color: COLORS.mauve,
        }}>
          <FiX size={20} />
        </button>
        <h2 style={{
          margin: "0 0 20px", fontSize: 22, fontWeight: 800,
          fontFamily: "'Playfair Display', Georgia, serif", color: COLORS.darkIndigo,
        }}>
          Edit Lead
        </h2>
        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: COLORS.dangerLight, color: COLORS.danger,
            fontSize: 13, fontWeight: 600, marginBottom: 16,
          }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={modalLabelStyle}>Name</label>
            <div style={{
              display: "flex", alignItems: "center",
              border: `1.5px solid ${COLORS.lavender}60`, borderRadius: 10, padding: "0 12px",
            }}>
              <FiUser size={15} color={COLORS.mauve} />
              <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", padding: "10px", fontSize: 13, background: "transparent", color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 14 }}>
            <label style={modalLabelStyle}>Phone</label>
            <div style={{
              display: "flex", alignItems: "center",
              border: `1.5px solid ${COLORS.lavender}60`, borderRadius: 10, padding: "0 12px",
            }}>
              <FiPhone size={15} color={COLORS.mauve} />
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", padding: "10px", fontSize: 13, background: "transparent", color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={modalLabelStyle}>Email</label>
            <div style={{
              display: "flex", alignItems: "center",
              border: `1.5px solid ${COLORS.lavender}60`, borderRadius: 10, padding: "0 12px",
            }}>
              <FiMail size={15} color={COLORS.mauve} />
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", padding: "10px", fontSize: 13, background: "transparent", color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: 14 }}>
            <label style={modalLabelStyle}>Address</label>
            <textarea value={form.address} onChange={(e) => set("address", e.target.value)}
              rows={2} style={{ ...modalInputStyle, resize: "vertical" }} />
          </div>

          {/* Source */}
          <div style={{ marginBottom: 14 }}>
            <label style={modalLabelStyle}>Source</label>
            <input value={form.source} onChange={(e) => set("source", e.target.value)}
              placeholder="e.g. 99acres, MagicBricks, Walk-in"
              style={modalInputStyle} />
          </div>

          {/* ── Birthday & Anniversary ── */}
          <div style={{
            padding: "14px 16px", borderRadius: 12, marginBottom: 20,
            background: `${COLORS.lavender}10`, border: `1px solid ${COLORS.lavender}30`,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: COLORS.mauve,
              textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12,
            }}>
              🎉 Client Special Days
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ ...modalLabelStyle, display: "flex", alignItems: "center", gap: 5 }}>
                  🎂 Birthday
                </label>
                <input
                  type="date"
                  value={form.clientBirthday}
                  onChange={(e) => set("clientBirthday", e.target.value)}
                  style={modalInputStyle}
                />
                {form.clientBirthday && (
                  <button
                    type="button"
                    onClick={() => set("clientBirthday", "")}
                    style={{
                      marginTop: 4, fontSize: 11, color: COLORS.mauve,
                      background: "none", border: "none", cursor: "pointer",
                      padding: 0, fontFamily: "'DM Sans', sans-serif",
                      display: "flex", alignItems: "center", gap: 3,
                    }}
                  >
                    <FiX size={10} /> Clear
                  </button>
                )}
              </div>
              <div>
                <label style={{ ...modalLabelStyle, display: "flex", alignItems: "center", gap: 5 }}>
                  💍 Anniversary
                </label>
                <input
                  type="date"
                  value={form.clientMarriageAnniversary}
                  onChange={(e) => set("clientMarriageAnniversary", e.target.value)}
                  style={modalInputStyle}
                />
                {form.clientMarriageAnniversary && (
                  <button
                    type="button"
                    onClick={() => set("clientMarriageAnniversary", "")}
                    style={{
                      marginTop: 4, fontSize: 11, color: COLORS.mauve,
                      background: "none", border: "none", cursor: "pointer",
                      padding: 0, fontFamily: "'DM Sans', sans-serif",
                      display: "flex", alignItems: "center", gap: 3,
                    }}
                  >
                    <FiX size={10} /> Clear
                  </button>
                )}
              </div>
            </div>
            <div style={{ fontSize: 11, color: COLORS.mauve, marginTop: 8, lineHeight: 1.5 }}>
              You'll be reminded on these dates to wish your client. Clear to remove.
            </div>
          </div>

          <button type="submit" disabled={isLoading} style={{
            width: "100%", padding: 13, borderRadius: 10, border: "none",
            background: isLoading ? COLORS.lavender : `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`,
            color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Assign Lead Modal (single) ───────────────────────────────────────────────

function AssignLeadModal({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const [assignLead, { isLoading }] = useAssignLeadMutation();
  const { data: employees } = useGetScopeEmployeesQuery();
  const [selectedId, setSelectedId] = useState("");
  const [error,      setError]      = useState("");

  const handleAssign = async () => {
    if (!selectedId) return;
    setError("");
    try {
      await assignLead({ id: leadId, assignedToId: selectedId }).unwrap();
      onClose();
    } catch (err: unknown) {
      setError((err as { data?: { message?: string } })?.data?.message || "Failed to assign lead");
    }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(26,15,46,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 20, padding: 32, width: 400,
        boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "none", border: "none", cursor: "pointer", color: COLORS.mauve,
        }}>
          <FiX size={20} />
        </button>
        <h3 style={{
          margin: "0 0 16px", fontSize: 18, fontWeight: 800,
          fontFamily: "'Playfair Display', Georgia, serif", color: COLORS.darkIndigo,
        }}>
          Assign Lead
        </h3>
        {error && (
          <div style={{
            padding: "8px 12px", borderRadius: 8,
            background: COLORS.dangerLight, color: COLORS.danger,
            fontSize: 12, fontWeight: 600, marginBottom: 12,
          }}>
            {error}
          </div>
        )}
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 10,
            border: `1.5px solid ${COLORS.lavender}60`, fontSize: 13,
            background: "#fff", color: COLORS.darkIndigo, marginBottom: 16,
            fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
          }}
        >
          <option value="">Select employee...</option>
          {employees?.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName} — {emp.designation.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={!selectedId || isLoading}
          style={{
            width: "100%", padding: 12, borderRadius: 10, border: "none",
            background: !selectedId || isLoading
              ? COLORS.lavender
              : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
            color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: !selectedId || isLoading ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {isLoading ? "Assigning..." : "Assign"}
        </button>
      </div>
    </div>
  );
}

// ─── Bulk Assign Modal ────────────────────────────────────────────────────────

function BulkAssignModal({
  leadIds,
  onClose,
  onSuccess,
}: {
  leadIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [bulkAssign, { isLoading }] = useBulkAssignMutation();
  const { data: employees }         = useGetScopeEmployeesQuery();
  const [selectedId, setSelectedId] = useState("");
  const [error,      setError]      = useState("");

  const handleAssign = async () => {
    if (!selectedId) return;
    setError("");
    try {
      await bulkAssign({ leadIds, assignedToId: selectedId }).unwrap();
      onSuccess();
    } catch (err: unknown) {
      setError(
        (err as { data?: { message?: string } })?.data?.message || "Failed to assign leads"
      );
    }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(26,15,46,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 20, padding: 32, width: 440,
        boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "none", border: "none", cursor: "pointer", color: COLORS.mauve,
        }}>
          <FiX size={20} />
        </button>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{
            margin: "0 0 8px", fontSize: 20, fontWeight: 800,
            fontFamily: "'Playfair Display', Georgia, serif", color: COLORS.darkIndigo,
          }}>
            Bulk Assign
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              background: `${COLORS.gold}20`, color: COLORS.goldDark,
              fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
              border: `1px solid ${COLORS.gold}40`,
            }}>
              {leadIds.length} lead{leadIds.length > 1 ? "s" : ""} selected
            </span>
            <span style={{ fontSize: 12, color: COLORS.mauve }}>will all be reassigned</span>
          </div>
        </div>

        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: COLORS.dangerLight, color: COLORS.danger,
            fontSize: 13, fontWeight: 600, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <label style={{
          fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo,
          display: "block", marginBottom: 6,
        }}>
          Assign to
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 10,
            border: `1.5px solid ${COLORS.lavender}60`, fontSize: 13,
            background: "#fff",
            color: selectedId ? COLORS.darkIndigo : COLORS.mauve,
            marginBottom: 16, fontFamily: "'DM Sans', sans-serif",
            boxSizing: "border-box", cursor: "pointer",
          }}
        >
          <option value="">Select employee...</option>
          {employees?.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName} — {emp.designation.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <div style={{
          padding: "10px 14px", borderRadius: 8, marginBottom: 20,
          background: `${COLORS.gold}12`, border: `1px solid ${COLORS.gold}30`,
          fontSize: 12, color: COLORS.darkIndigo, lineHeight: 1.6,
        }}>
          All {leadIds.length} lead{leadIds.length > 1 ? "s" : ""} will be set to{" "}
          <strong>Fresh</strong> status and reassigned. This cannot be undone.
        </div>

        <button
          onClick={handleAssign}
          disabled={!selectedId || isLoading}
          style={{
            width: "100%", padding: 13, borderRadius: 10, border: "none",
            background: !selectedId || isLoading
              ? COLORS.lavender
              : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
            color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: !selectedId || isLoading ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: !selectedId || isLoading ? "none" : `0 4px 12px ${COLORS.gold}40`,
            transition: "all 0.2s",
          }}
        >
          {isLoading
            ? "Assigning..."
            : `Assign ${leadIds.length} Lead${leadIds.length > 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}