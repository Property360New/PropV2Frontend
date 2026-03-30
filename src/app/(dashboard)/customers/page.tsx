"use client";

import { useState, FormEvent } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import {
  useGetCustomersQuery,
  useGetCustomerDetailQuery,
  useUpdateDealDetailsMutation,
} from "@/store/customers.api";
import { useGetScopeEmployeesQuery } from "@/store/hierarchy.api";
import { useGetProfileQuery } from "@/store/auth.api";
import type { Customer } from "@/types";
import {
  FiSearch, FiPhone, FiMail, FiUser, FiCalendar,
  FiChevronLeft, FiChevronRight, FiX, FiEye,
  FiEdit2, FiCheckCircle, FiSave, FiTrendingUp, FiAward,
  FiChevronDown, FiChevronUp,
} from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(n: number | null | undefined) {
  if (n == null || n === 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);
}

function fmtCurrencyShort(n: number | null | undefined) {
  if (!n) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

// ─── Summary chips on the list ────────────────────────────────────────────────

function DealSummaryChips({ deals }: { deals: any[] }) {
  if (!deals || deals.length === 0) return <span style={{ color: COLORS.mauve, fontSize: 12 }}>No deals</span>;
  const totalIncentive = deals.reduce((s: number, d: any) => s + Number(d.incentiveAmount ?? 0), 0);
  const totalValue = deals.reduce((s: number, d: any) => s + Number(d.dealValue ?? d.closingAmount ?? 0), 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.gold }}>
        {fmtCurrencyShort(totalValue || null)}
      </span>
      {totalIncentive > 0 && (
        <span style={{ fontSize: 11, color: "#27AE60", fontWeight: 600 }}>
          Incentive: {fmtCurrencyShort(totalIncentive)}
        </span>
      )}
      <span style={{ fontSize: 10, color: COLORS.mauve }}>
        {deals.length} deal{deals.length > 1 ? "s" : ""}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);

  const { data: profile } = useGetProfileQuery();
  const isAdmin = profile?.designation === "ADMIN";
  const { data: scopeEmployees } = useGetScopeEmployeesQuery();

  const { data, isLoading } = useGetCustomersQuery({
    page, limit,
    search: search || undefined,
    assignedToId: assignedToId || undefined,
  });

  const customers: Customer[] = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const handleSearch = (e: FormEvent) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

  return (
    <>
      <TopBar title="Customers" subtitle="All converted deal-done leads">
      <TutorialButton videoUrl={TUTORIALS.targetCustomers} />
      </TopBar>

      <div style={{ padding: "24px 32px" }}>
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
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by name or phone..."
                style={{
                  flex: 1, border: "none", outline: "none", padding: "10px",
                  fontSize: 13, background: "transparent", color: COLORS.darkIndigo,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              {searchInput && (
                <FiX size={14} color={COLORS.mauve} style={{ cursor: "pointer" }}
                  onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} />
              )}
            </div>
            <button type="submit" style={{
              padding: "10px 18px", borderRadius: 10, border: "none",
              background: COLORS.mauve, color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>
              Search
            </button>
          </form>

          <select
            value={assignedToId}
            onChange={e => { setAssignedToId(e.target.value); setPage(1); }}
            style={{
              padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.lavender}50`,
              fontSize: 13, background: COLORS.white, color: COLORS.darkIndigo,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <option value="">All Staff</option>
            {scopeEmployees?.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
            ))}
          </select>
        </div>

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
                  {["Name", "Phone", "Source", "Deal Value / Incentive", "Created By", "Assigned To", "Date", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr key="loading">
                    <td colSpan={8} style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={8} style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map((cust: any, i: number) => (
                    <tr
                      key={cust.id}
                      style={{
                        borderBottom: `1px solid ${COLORS.lavender}20`,
                        background: i % 2 === 0 ? "#fff" : `${COLORS.pearl}80`,
                      }}
                    >
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: COLORS.darkIndigo }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: `${COLORS.success ?? "#27AE60"}12`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700, color: "#27AE60", flexShrink: 0,
                            border: `1px solid #27AE6020`,
                          }}>
                            {cust.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div>{cust.name}</div>
                            {cust.email && (
                              <div style={{ fontSize: 11, color: COLORS.mauve, display: "flex", alignItems: "center", gap: 3 }}>
                                <FiMail size={10} />{cust.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: COLORS.darkIndigo }}>
                          <FiPhone size={12} color={COLORS.mauve} /> {cust.phone}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: COLORS.mauve, fontSize: 12 }}>
                        {cust.source || "—"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <DealSummaryChips deals={cust.deals ?? []} />
                      </td>
                      <td style={{ padding: "12px 14px", color: COLORS.darkIndigo, fontSize: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <FiUser size={11} color={COLORS.mauve} />
                          {cust.createdBy ? `${cust.createdBy.firstName} ${cust.createdBy.lastName ?? ""}` : "—"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: COLORS.darkIndigo, fontSize: 12 }}>
                        {cust.assignedTo ? `${cust.assignedTo.firstName} ${cust.assignedTo.lastName ?? ""}` : "—"}
                      </td>
                      <td style={{ padding: "12px 14px", color: COLORS.mauve, fontSize: 12, whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <FiCalendar size={11} /> {formatDate(cust.createdAt)}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <button
                          onClick={() => setViewId(cust.id)}
                          title="View Details"
                          style={{
                            background: `${COLORS.mauve}12`, border: `1px solid ${COLORS.mauve}30`,
                            borderRadius: 6, padding: "5px 10px", cursor: "pointer",
                            color: COLORS.mauve, display: "flex", alignItems: "center", gap: 4,
                            fontSize: 11, fontWeight: 600,
                          }}
                        >
                          <FiEye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px", borderTop: `1px solid ${COLORS.lavender}20`,
              fontSize: 13, color: COLORS.mauve,
            }}>
              <span>
                {meta.total > 0
                  ? `${(meta.page - 1) * meta.limit + 1}–${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total}`
                  : "0 results"}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{
                  padding: "6px 10px", borderRadius: 6, border: `1px solid ${COLORS.lavender}50`,
                  background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1,
                }}>
                  <FiChevronLeft size={14} />
                </button>
                <span style={{ padding: "6px 12px", fontWeight: 700, color: COLORS.darkIndigo }}>
                  {meta.page} / {meta.totalPages}
                </span>
                <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)} style={{
                  padding: "6px 10px", borderRadius: 6, border: `1px solid ${COLORS.lavender}50`,
                  background: "#fff", cursor: page >= meta.totalPages ? "not-allowed" : "pointer",
                  opacity: page >= meta.totalPages ? 0.4 : 1,
                }}>
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewId && (
        <CustomerDetailModal
          customerId={viewId}
          isAdmin={isAdmin}
          onClose={() => setViewId(null)}
        />
      )}
    </>
  );
}

// ─── Deal Card (per DEAL_DONE query) ─────────────────────────────────────────

function DealCard({
  query,
  deal,
  customerId,
  isAdmin,
  onSaved,
}: {
  query: any;
  deal: any;
  customerId: string;
  isAdmin: boolean;
  onSaved: () => void;
}) {
  const [updateDeal, { isLoading: isSaving }] = useUpdateDealDetailsMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm] = useState({
    dealValue: "",
    leadActualSlab: "",
    discount: "",
    actualRevenue: "",
    incentiveSlab: "",
    salesRevenue: "",
    incentiveAmount: "",
    incentiveNote: "",
  });

  const openEdit = () => {
    setForm({
      dealValue:       String(deal?.dealValue       ?? ""),
      leadActualSlab:  String(deal?.leadActualSlab  ?? ""),
      discount:        String(deal?.discount        ?? ""),
      actualRevenue:   String(deal?.actualRevenue   ?? ""),
      incentiveSlab:   String(deal?.incentiveSlab   ?? ""),
      salesRevenue:    String(deal?.salesRevenue    ?? ""),
      incentiveAmount: String(deal?.incentiveAmount ?? ""),
      incentiveNote:   String(deal?.incentiveNote   ?? ""),
    });
    setSaveError("");
    setSaveSuccess(false);
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess(false);
    try {
      const parseNum = (v: string) => v.trim() !== "" ? Number(v) : undefined;
      await updateDeal({
        id: customerId,
        queryId: query.id,
        body: {
          dealValue:       parseNum(form.dealValue),
          leadActualSlab:  parseNum(form.leadActualSlab),
          discount:        parseNum(form.discount),
          actualRevenue:   parseNum(form.actualRevenue),
          incentiveSlab:   parseNum(form.incentiveSlab),
          salesRevenue:    parseNum(form.salesRevenue),
          incentiveAmount: parseNum(form.incentiveAmount),
          incentiveNote:   form.incentiveNote.trim() || undefined,
        },
      }).unwrap();
      setSaveSuccess(true);
      setIsEditing(false);
      onSaved();
    } catch (err: any) {
      setSaveError(err?.data?.message || "Failed to save. Please try again.");
    }
  };

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const hasDealDetails = deal && (deal.dealValue || deal.incentiveAmount || deal.salesRevenue);
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 7, fontSize: 12,
    border: `1.5px solid ${COLORS.lavender}60`, color: COLORS.darkIndigo,
    background: "#fff", fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: COLORS.mauve,
    textTransform: "uppercase", display: "block", marginBottom: 3,
    letterSpacing: "0.4px",
  };

  return (
    <div style={{
      background: hasDealDetails ? `${COLORS.gold}06` : `${COLORS.lavender}08`,
      borderRadius: 12, overflow: "hidden",
      border: `1px solid ${hasDealDetails ? COLORS.gold + "25" : COLORS.lavender + "30"}`,
      marginBottom: 10,
    }}>
      {/* Deal header — always visible */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer",
          borderBottom: isExpanded ? `1px solid ${COLORS.lavender}20` : "none",
        }}
        onClick={() => setIsExpanded(x => !x)}
      >
        {/* Deal icon */}
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: `${COLORS.gold}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FiAward size={15} color={COLORS.gold} />
        </div>

        {/* Deal info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.darkIndigo, display: "flex", alignItems: "center", gap: 6 }}>
            Deal — {query.project?.name || "No Project"}
            {query.unitNo && (
              <span style={{
                fontSize: 10, background: `${COLORS.mauve}12`, color: COLORS.mauve,
                padding: "1px 6px", borderRadius: 4, fontWeight: 600,
              }}>
                Unit {query.unitNo}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: COLORS.mauve, marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
            <span>{query.createdBy ? `${query.createdBy.firstName} ${query.createdBy.lastName ?? ""}` : "—"}</span>
            <span>·</span>
            <span>{formatDate(query.createdAt)}</span>
            {query.closingAmount && (
              <>
                <span>·</span>
                <span style={{ color: COLORS.gold, fontWeight: 600 }}>
                  Closing: {formatCurrency(query.closingAmount)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side: incentive badge + edit + expand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {deal?.incentiveAmount ? (
            <div style={{
              padding: "3px 10px", borderRadius: 20,
              background: "#27AE6012", border: "1px solid #27AE6030",
              fontSize: 11, fontWeight: 700, color: "#27AE60",
            }}>
              {formatCurrency(deal.incentiveAmount)}
            </div>
          ) : (
            <div style={{
              padding: "3px 10px", borderRadius: 20,
              background: `${COLORS.lavender}20`,
              fontSize: 11, fontWeight: 600, color: COLORS.mauve,
            }}>
              No details
            </div>
          )}
          {isAdmin && !isEditing && (
            <button
              onClick={e => { e.stopPropagation(); openEdit(); }}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 10px", borderRadius: 7, border: "none",
                background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark ?? COLORS.gold})`,
                color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}
            >
              <FiEdit2 size={11} /> {deal ? "Edit" : "Add"}
            </button>
          )}
          {isExpanded
            ? <FiChevronUp size={14} color={COLORS.mauve} />
            : <FiChevronDown size={14} color={COLORS.mauve} />
          }
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ padding: "14px 16px" }}>

          {/* Success banner */}
          {saveSuccess && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 8, marginBottom: 12,
              background: "#DCFCE7", border: "1px solid #86EFAC",
              color: "#166534", fontSize: 12, fontWeight: 600,
            }}>
              <FiCheckCircle size={13} /> Deal details saved successfully.
            </div>
          )}

          {/* Read view — deal details grid */}
          {!isEditing && hasDealDetails && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 }}>
              {[
                { label: "Deal Value",       value: formatCurrency(deal.dealValue) },
                { label: "Lead Actual Slab", value: formatCurrency(deal.leadActualSlab) },
                { label: "Discount",         value: formatCurrency(deal.discount) },
                { label: "Actual Revenue",   value: formatCurrency(deal.actualRevenue) },
                { label: "Incentive Slab",   value: deal.incentiveSlab ? `${deal.incentiveSlab}%` : "—" },
                { label: "Sales Revenue",    value: formatCurrency(deal.salesRevenue) },
                { label: "Incentive Amount", value: formatCurrency(deal.incentiveAmount) },
              ].map(row => (
                <div
                  key={row.label}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    padding: "4px 0", borderBottom: `1px solid ${COLORS.gold}10`, fontSize: 12,
                  }}
                >
                  <span style={{ color: COLORS.mauve }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: COLORS.darkIndigo }}>{row.value}</span>
                </div>
              ))}
              {deal.incentiveNote && (
                <div style={{
                  gridColumn: "1/-1", marginTop: 4,
                  padding: "6px 10px", borderRadius: 7,
                  background: "rgba(255,255,255,0.8)", fontSize: 11,
                  color: COLORS.darkIndigo, lineHeight: 1.5,
                }}>
                  <strong style={{ color: COLORS.mauve }}>Note: </strong>{deal.incentiveNote}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!isEditing && !hasDealDetails && (
            <div style={{ fontSize: 12, color: COLORS.mauve, fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
              No deal details added yet.{isAdmin && " Click 'Add' to fill in incentive information."}
            </div>
          )}

          {/* Edit form */}
          {isEditing && isAdmin && (
            <div>
              {saveError && (
                <div style={{
                  padding: "8px 12px", borderRadius: 8, marginBottom: 12,
                  background: "#FEE2E2", color: "#DC2626", fontSize: 12, fontWeight: 600,
                }}>
                  {saveError}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { key: "dealValue",       label: "Deal Value (₹)",       placeholder: "e.g. 5000000" },
                  { key: "leadActualSlab",  label: "Lead Actual Slab (₹)", placeholder: "e.g. 4800000" },
                  { key: "discount",        label: "Discount (₹)",         placeholder: "e.g. 50000" },
                  { key: "actualRevenue",   label: "Actual Revenue (₹)",   placeholder: "e.g. 4750000" },
                  { key: "incentiveSlab",   label: "Incentive Slab (%)",   placeholder: "e.g. 2" },
                  { key: "salesRevenue",    label: "Sales Revenue (₹)",    placeholder: "e.g. 4750000" },
                  { key: "incentiveAmount", label: "Incentive Amount (₹)", placeholder: "e.g. 95000" },
                ].map(field => (
                  <div key={field.key}>
                    <label style={labelStyle}>{field.label}</label>
                    <input
                      type="number"
                      value={form[field.key as keyof typeof form]}
                      onChange={e => set(field.key as keyof typeof form, e.target.value)}
                      placeholder={field.placeholder}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = `${COLORS.gold}60`}
                      onBlur={e => e.target.style.borderColor = `${COLORS.lavender}60`}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={labelStyle}>Incentive Note</label>
                  <textarea
                    value={form.incentiveNote}
                    onChange={e => set("incentiveNote", e.target.value)}
                    placeholder="Optional note about incentive calculation..."
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "10px 0", borderRadius: 9, border: "none",
                    background: isSaving
                      ? COLORS.lavender
                      : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark ?? COLORS.gold})`,
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: isSaving ? "not-allowed" : "pointer",
                    boxShadow: isSaving ? "none" : `0 3px 10px ${COLORS.gold}35`,
                  }}
                >
                  <FiSave size={13} /> {isSaving ? "Saving..." : "Save Deal Details"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: "10px 16px", borderRadius: 9,
                    border: `1.5px solid ${COLORS.lavender}50`,
                    background: "#fff", color: COLORS.mauve,
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Customer Detail Modal ────────────────────────────────────────────────────

function CustomerDetailModal({
  customerId,
  isAdmin,
  onClose,
}: {
  customerId: string;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const { data: customer, isLoading, refetch } = useGetCustomerDetailQuery(customerId);

  // Compute totals across all deals
  const deals: any[] = (customer as any)?.deals ?? [];
  const totalDealValue   = deals.reduce((s, d) => s + Number(d.dealValue ?? 0), 0);
  const totalSalesRev    = deals.reduce((s, d) => s + Number(d.salesRevenue ?? 0), 0);
  const totalIncentive   = deals.reduce((s, d) => s + Number(d.incentiveAmount ?? 0), 0);
  const dealDoneQueries: any[] = (customer as any)?.lead?.queries ?? [];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(26,15,46,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, width: "min(680px, 96vw)",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 24px 64px rgba(26,15,46,0.25)", position: "relative",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`,
          color: "#fff", display: "flex", justifyContent: "space-between",
          alignItems: "center", borderRadius: "20px 20px 0 0",
          position: "sticky", top: 0, zIndex: 2,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>
              Customer Details
            </h3>
            {customer && (
              <p style={{ margin: "3px 0 0", fontSize: 12, opacity: 0.75 }}>
                {(customer as any).name} · {(customer as any).phone}
                {deals.length > 0 && ` · ${deals.length} deal${deals.length > 1 ? "s" : ""}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
              width: 32, height: 32, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {isLoading || !customer ? (
          <div style={{ textAlign: "center", padding: 48, color: COLORS.mauve }}>Loading...</div>
        ) : (
          <div style={{ padding: "20px 24px" }}>

            {/* Basic Info */}
            <div style={{
              background: `${COLORS.pearl}80`, borderRadius: 12, padding: "14px 16px",
              marginBottom: 18, border: `1px solid ${COLORS.lavender}30`,
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                {[
                  { label: "Name",        value: (customer as any).name },
                  { label: "Phone",       value: (customer as any).phone },
                  { label: "Email",       value: (customer as any).email || "—" },
                  { label: "Source",      value: (customer as any).source || "—" },
                  { label: "Assigned To", value: (customer as any).assignedTo ? `${(customer as any).assignedTo.firstName} ${(customer as any).assignedTo.lastName ?? ""}` : "—" },
                  { label: "Created By",  value: (customer as any).createdBy ? `${(customer as any).createdBy.firstName} ${(customer as any).createdBy.lastName ?? ""}` : "—" },
                  { label: "Created On",  value: formatDate((customer as any).createdAt) },
                  { label: "Project",     value: (customer as any).lead?.project?.name || "—" },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.mauve, textTransform: "uppercase", marginBottom: 2 }}>
                      {row.label}
                    </div>
                    <div style={{ fontWeight: 600, color: COLORS.darkIndigo }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary strip — only if there are deals with details */}
            {totalIncentive > 0 && (
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10, marginBottom: 18,
              }}>
                {[
                  { label: "Total Deal Value",   value: formatCurrency(totalDealValue),  icon: <TbCurrencyRupee size={14} />, color: COLORS.gold },
                  { label: "Total Sales Revenue",value: formatCurrency(totalSalesRev),   icon: <FiTrendingUp size={14} />, color: "#3498DB" },
                  { label: "Total Incentive",    value: formatCurrency(totalIncentive),  icon: <FiAward size={14} />,      color: "#27AE60" },
                ].map(stat => (
                  <div key={stat.label} style={{
                    padding: "12px 14px", borderRadius: 10,
                    background: `${stat.color}08`, border: `1px solid ${stat.color}20`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, color: stat.color }}>
                      {stat.icon}
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                        {stat.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.darkIndigo, fontFamily: "'Playfair Display', serif" }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Deal cards — one per DEAL_DONE query */}
            <div style={{ marginBottom: 18 }}>
              <h4 style={{
                margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: COLORS.darkIndigo,
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "'Playfair Display', serif",
              }}>
                <TbCurrencyRupee size={15} />
                Deal Information
                <span style={{
                  fontSize: 11, background: `${COLORS.gold}15`, color: COLORS.gold,
                  padding: "2px 8px", borderRadius: 10, fontWeight: 700,
                }}>
                  {dealDoneQueries.length} deal{dealDoneQueries.length !== 1 ? "s" : ""}
                </span>
                {isAdmin && (
                  <span style={{ fontSize: 11, color: COLORS.mauve, fontWeight: 400, marginLeft: 4 }}>
                    — click a deal to expand &amp; edit
                  </span>
                )}
              </h4>

              {dealDoneQueries.length === 0 ? (
                <div style={{
                  padding: 24, textAlign: "center", color: COLORS.mauve, fontSize: 13,
                  background: `${COLORS.pearl}50`, borderRadius: 10, border: `1px solid ${COLORS.lavender}25`,
                }}>
                  No deal-done queries found for this customer.
                </div>
              ) : (
                dealDoneQueries.map((q: any) => {
                  const matchedDeal = deals.find((d: any) => d.queryId === q.id) ?? null;
                  return (
                    <DealCard
                      key={q.id}
                      query={q}
                      deal={matchedDeal}
                      customerId={customerId}
                      isAdmin={isAdmin}
                      onSaved={() => refetch()}
                    />
                  );
                })
              )}
            </div>

            {/* Query History (all queries, not just deal done) */}
            {(customer as any).lead?.queries && (customer as any).lead.queries.length > 0 && (
              <div>
                <h4 style={{
                  margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: COLORS.darkIndigo,
                  fontFamily: "'Playfair Display', serif",
                }}>
                  All Queries ({(customer as any).lead.queries.length})
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(customer as any).lead.queries.map((q: any) => {
                    const statusLabel = (q.callStatus ?? q.status ?? "").toString().replace(/_/g, " ");
                    const isDeal = q.status === "DEAL_DONE" || q.callStatus === "DEAL_DONE";
                    return (
                      <div key={q.id} style={{
                        padding: "10px 14px", borderRadius: 10,
                        border: `1px solid ${isDeal ? COLORS.gold + "30" : COLORS.lavender + "30"}`,
                        background: isDeal ? `${COLORS.gold}04` : `${COLORS.pearl}50`,
                        fontSize: 12,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{
                            fontWeight: 700,
                            color: isDeal ? COLORS.gold : COLORS.darkIndigo,
                          }}>
                            {statusLabel || "—"}
                          </span>
                          <span style={{ color: COLORS.mauve }}>{formatDate(q.createdAt)}</span>
                        </div>
                        {q.remark && <div style={{ color: COLORS.mauve, marginTop: 2 }}>{q.remark}</div>}
                        {q.dealDoneDate && (
                          <div style={{ color: "#27AE60", fontWeight: 600, marginTop: 4 }}>
                            Deal closed: {formatDate(q.dealDoneDate)}
                          </div>
                        )}
                        {q.closingAmount && (
                          <div style={{ color: COLORS.gold, fontWeight: 600, marginTop: 2 }}>
                            Closing: {formatCurrency(q.closingAmount)}
                          </div>
                        )}
                        {q.createdBy && (
                          <div style={{ color: COLORS.mauve, fontSize: 11, marginTop: 4 }}>
                            by {q.createdBy.firstName} {q.createdBy.lastName ?? ""}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}