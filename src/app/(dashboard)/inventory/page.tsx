"use client";

import { useState, FormEvent } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import {
  useGetInventoryQuery,
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
  useDeleteInventoryMutation,
  useToggleInventoryStatusMutation,
} from "@/store/inventory.api";
import { useGetProfileQuery } from "@/store/auth.api";
import { useGetProjectsQuery } from "@/store/projects.api"; // adjust path if needed
import type {
  InventoryItem,
  InventoryType,
  InventorySubType,
  BHKType,
  FurnishingType,
  Project,
} from "@/types";
import {
  FiPlus, FiX, FiSearch, FiPhone, FiUser,
  FiChevronLeft, FiChevronRight, FiTrash2, FiEdit2,
  FiDownload, FiFilter, FiToggleLeft, FiToggleRight,
} from "react-icons/fi";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

// ── Constants ─────────────────────────────────────────────────────

const INV_TYPES: { value: InventoryType; label: string }[] = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
];

// Subtypes grouped by parent — drives the synced sub-type dropdown
const SUB_TYPE_MAP: Record<InventoryType, { value: InventorySubType; label: string }[]> = {
  RESIDENTIAL: [
    { value: "RENT_RESIDENTIAL", label: "Rent Residential" },
    { value: "RESALE_RESIDENTIAL", label: "Resale Residential" },
  ],
  COMMERCIAL: [
    { value: "RENT_COMMERCIAL", label: "Rent Commercial" },
    { value: "RESALE_COMMERCIAL", label: "Resale Commercial" },
  ],
};

const COMMERCIAL_UNIT_OPTIONS: { value: BHKType; label: string }[] = [
  { value: "OFFICE_SPACE",    label: "Office Space" },
  { value: "STUDIO_APP",      label: "Studio App" },
  { value: "SOCIETY_SHOP",    label: "Society Shop" },
  { value: "RETAIL_SHOP",     label: "Retail Shop" },
  { value: "INDUSTRIAL_LAND", label: "Industrial Land" },
  { value: "COMMERCIAL_LAND", label: "Commercial Land" },
];

const ALL_SUB_TYPES = [...SUB_TYPE_MAP.RESIDENTIAL, ...SUB_TYPE_MAP.COMMERCIAL];

const BHK_OPTS: { value: BHKType; label: string }[] = [
  { value: "TWO_BHK", label: "2 BHK" },
  { value: "TWO_BHK_STUDY", label: "2 BHK+Study" },
  { value: "THREE_BHK", label: "3 BHK" },
  { value: "THREE_BHK_STUDY", label: "3 BHK+Study" },
  { value: "THREE_BHK_SERVANT", label: "3 BHK+Servant" },
  { value: "THREE_BHK_STORE", label: "3 BHK+Store" },
  { value: "FOUR_BHK", label: "4 BHK" },
  { value: "FOUR_BHK_STUDY", label: "4 BHK+Study" },
  { value: "FOUR_BHK_SERVANT", label: "4 BHK+Servant" },
  { value: "FOUR_BHK_STORE", label: "4 BHK+Store" },
  { value: "OFFICE_SPACE", label: "Office Space" },
  { value: "STUDIO_APP", label: "Studio App" },
  { value: "SOCIETY_SHOP", label: "Society Shop" },
  { value: "RETAIL_SHOP", label: "Retail Shop" },
  { value: "INDUSTRIAL_LAND", label: "Industrial Land" },
  { value: "COMMERCIAL_LAND", label: "Commercial Land" },
];

const FURNISH_OPTS: { value: FurnishingType; label: string }[] = [
  { value: "RAW_FLAT", label: "Raw Flat" },
  { value: "SEMI_FURNISHED", label: "Semi Furnished" },
  { value: "FULLY_FURNISHED", label: "Fully Furnished" },
];

// ── Helpers ───────────────────────────────────────────────────────

function formatCurrency(n: number | null) {
  if (!n) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
function bhkLabel(v: string | null) {
  return v ? (BHK_OPTS.find(b => b.value === v)?.label ?? v.replace(/_/g, " ")) : "—";
}
function furnishLabel(v: string | null) {
  return v ? (FURNISH_OPTS.find(f => f.value === v)?.label ?? v.replace(/_/g, " ")) : "—";
}
function subTypeLabel(v: string | null) {
  return v ? (ALL_SUB_TYPES.find(s => s.value === v)?.label ?? v.replace(/_/g, " ")) : "—";
}
async function generateInventoryPDF(item: InventoryItem) {
  const { downloadInventoryPdf } = await import("@/lib/inventoryPdf");
  downloadInventoryPdf(item);
}

// ── Shared styles ─────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: `1.5px solid ${COLORS.lavender}60`, fontSize: 13,
  background: "#fff", color: COLORS.darkIndigo,
  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo, display: "block", marginBottom: 4,
};

// ── Filter state ──────────────────────────────────────────────────

interface Filters {
  inventoryType: InventoryType | "";
  inventorySubType: InventorySubType | "";
  bhk: BHKType | "";
  projectId: string;
  isActive: "true" | "false" | "";
  minDemand: string;
  maxDemand: string;
}
const DEFAULT_FILTERS: Filters = {
  inventoryType: "", inventorySubType: "", bhk: "",
  projectId: "", isActive: "true", minDemand: "", maxDemand: "",
};

// ── Page ──────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const { data: profile } = useGetProfileQuery();
  const canEdit = profile?.designation === "ADMIN" || profile?.permissions?.canEditInventory;

  const [deleteItem] = useDeleteInventoryMutation();
  const [toggleStatus] = useToggleInventoryStatusMutation();

  // useGetProjectsQuery returns Project[] directly (no pagination wrapper)
  const { data: projectsRaw } = useGetProjectsQuery();
  const allProjects: Project[] = (projectsRaw as Project[] | undefined) ?? [];
  const activeProjects = allProjects.filter(p => p.isActive);

  const { data, isLoading } = useGetInventoryQuery({
    page, limit,
    search: search || undefined,
    inventoryType: appliedFilters.inventoryType || undefined,
    inventorySubType: appliedFilters.inventorySubType || undefined,
    bhk: appliedFilters.bhk || undefined,
    projectId: appliedFilters.projectId || undefined,
    // Only send isActive if it's explicitly "true" or "false"; omit to fetch all
    ...(appliedFilters.isActive ? { isActive: appliedFilters.isActive as "true" | "false" } : {}),
    minDemand: appliedFilters.minDemand ? Number(appliedFilters.minDemand) : undefined,
    maxDemand: appliedFilters.maxDemand ? Number(appliedFilters.maxDemand) : undefined,
  });

  const items: InventoryItem[] = data?.data ?? [];
  const meta = data?.meta;

  // Badge count: everything non-default, but "true" for isActive is the default so don't count it
  const activeFilterCount = Object.entries(appliedFilters).filter(([k, v]) =>
    k === "isActive" ? v !== "true" : v !== ""
  ).length;

  const handleSearch = (e: FormEvent) => { e.preventDefault(); setSearch(searchInput); setPage(1); };
  const handleApplyFilters = () => { setAppliedFilters(pendingFilters); setPage(1); setShowFilters(false); };
  const handleResetFilters = () => { setPendingFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); setPage(1); };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this inventory item?")) return;
    try { await deleteItem(id).unwrap(); } catch { alert("Failed to delete."); }
  };
  const handleToggleStatus = async (item: InventoryItem) => {
    try { await toggleStatus({ id: item.id, isActive: !item.isActive }).unwrap(); }
    catch { alert("Failed to update status."); }
  };
  const handleFilterTypeChange = (type: InventoryType | "") =>
    setPendingFilters(f => ({ ...f, inventoryType: type, inventorySubType: "" }));

  const availableSubTypes = pendingFilters.inventoryType
    ? SUB_TYPE_MAP[pendingFilters.inventoryType]
    : ALL_SUB_TYPES;

  return (
    <>
      <TopBar title="Inventory" subtitle="Manage property inventory listings" >
        <TutorialButton videoUrl={TUTORIALS.inventory} />
      </TopBar>
      <div style={{ padding: "24px 32px" }}>

        {/* ── Toolbar ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "center", flex: 1, background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.lavender}50`, padding: "0 12px" }}>
              <FiSearch size={16} color={COLORS.mauve} />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search name, phone, unit..."
                style={{ flex: 1, border: "none", outline: "none", padding: "10px", fontSize: 13, background: "transparent", color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif" }} />
              {searchInput && <FiX size={14} color={COLORS.mauve} style={{ cursor: "pointer" }} onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} />}
            </div>
            <button type="submit" style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: COLORS.mauve, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Search</button>
          </form>

          <button onClick={() => { setPendingFilters(appliedFilters); setShowFilters(v => !v); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${activeFilterCount > 0 ? COLORS.gold : COLORS.lavender}60`, background: activeFilterCount > 0 ? `${COLORS.gold}10` : COLORS.white, color: activeFilterCount > 0 ? COLORS.goldDark : COLORS.darkIndigo, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            <FiFilter size={15} /> Filters
            {activeFilterCount > 0 && (
              <span style={{ background: COLORS.gold, color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{activeFilterCount}</span>
            )}
          </button>

          {canEdit && (
            <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 12px ${COLORS.gold}40`, fontFamily: "'DM Sans', sans-serif" }}>
              <FiPlus size={16} /> Add Inventory
            </button>
          )}
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div style={{ background: COLORS.white, borderRadius: 14, padding: "20px 24px", border: `1px solid ${COLORS.lavender}40`, marginBottom: 20, boxShadow: "0 4px 16px rgba(26,15,46,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif" }}>Filter Inventory</span>
              <button onClick={() => setShowFilters(false)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.mauve }}><FiX size={16} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={pendingFilters.inventoryType} onChange={e => handleFilterTypeChange(e.target.value as InventoryType | "")} style={fieldStyle}>
                  <option value="">All Types</option>
                  {INV_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Sub Type</label>
                <select value={pendingFilters.inventorySubType} onChange={e => setPendingFilters(f => ({ ...f, inventorySubType: e.target.value as InventorySubType | "" }))} style={fieldStyle}>
                  <option value="">All Sub Types</option>
                  {availableSubTypes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>BHK</label>
                <select value={pendingFilters.bhk} onChange={e => setPendingFilters(f => ({ ...f, bhk: e.target.value as BHKType | "" }))} style={fieldStyle}>
                  <option value="">All BHK</option>
                  {BHK_OPTS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Project</label>
                <select value={pendingFilters.projectId} onChange={e => setPendingFilters(f => ({ ...f, projectId: e.target.value }))} style={fieldStyle}>
                  <option value="">All Projects</option>
                  {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={pendingFilters.isActive} onChange={e => setPendingFilters(f => ({ ...f, isActive: e.target.value as "true" | "false" | "" }))} style={fieldStyle}>
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Min Demand (₹)</label>
                <input type="number" placeholder="e.g. 500000" value={pendingFilters.minDemand} onChange={e => setPendingFilters(f => ({ ...f, minDemand: e.target.value }))} style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Max Demand (₹)</label>
                <input type="number" placeholder="e.g. 10000000" value={pendingFilters.maxDemand} onChange={e => setPendingFilters(f => ({ ...f, maxDemand: e.target.value }))} style={fieldStyle} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button onClick={handleResetFilters} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${COLORS.lavender}60`, background: "#fff", color: COLORS.mauve, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Reset</button>
              <button onClick={handleApplyFilters} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Apply Filters</button>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div style={{ background: COLORS.white, borderRadius: 16, overflow: "hidden", border: `1px solid ${COLORS.lavender}30`, boxShadow: "0 2px 12px rgba(26,15,46,0.04)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`, color: "#fff" }}>
                  {["Owner", "Type", "Project", "Info", "Unit/Tower", "Size", "Floor", "Demand", "Furnishing", "Tenant", "Parking", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={14} style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={14} style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>No inventory items found.</td></tr>
                ) : items.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.lavender}20`, background: i % 2 === 0 ? "#fff" : `${COLORS.pearl}80`, opacity: item.isActive ? 1 : 0.6 }}>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: COLORS.darkIndigo }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}><FiUser size={12} color={COLORS.mauve} /> {item.ownerName}</div>
                    </td>
                    {/* <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: COLORS.darkIndigo }}><FiPhone size={12} color={COLORS.mauve} />{item.ownerPhone}</div>
                    </td> */}
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, color: item.inventoryType === "RESIDENTIAL" ? "#8E44AD" : "#E67E22", background: item.inventoryType === "RESIDENTIAL" ? "#8E44AD12" : "#E67E2212" }}>
                        {subTypeLabel(item.inventorySubType) || item.inventoryType}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: COLORS.mauve, fontSize: 12 }}>{item.project?.name ?? "—"}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: COLORS.darkIndigo }}>{bhkLabel(item.bhk)}</td>
                    <td style={{ padding: "12px 14px", color: COLORS.mauve, fontSize: 12 }}>{[item.unitNo, item.towerNo].filter(Boolean).join(" / ") || "—"}</td>
                    <td style={{ padding: "12px 14px", color: COLORS.darkIndigo }}>{item.size ? `${item.size} sqft` : "—"}</td>
                    <td style={{ padding: "12px 14px", color: COLORS.mauve }}>{item.floor ?? "—"}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: COLORS.gold }}>{formatCurrency(item.demand)}</td>
                    <td style={{ padding: "12px 14px", color: COLORS.mauve, fontSize: 12 }}>{furnishLabel(item.furnishingType)}</td>
                    <td style={{ padding: "12px 14px" }}>{item.hasTenant ? <span style={{ color: COLORS.success, fontWeight: 700 }}>Yes</span> : <span style={{ color: COLORS.mauve }}>No</span>}</td>
                    <td style={{ padding: "12px 14px" }}>{item.hasParking ? <span style={{ color: COLORS.success, fontWeight: 700 }}>Yes</span> : <span style={{ color: COLORS.mauve }}>No</span>}</td>

                    {/* Status toggle */}
                    <td style={{ padding: "12px 14px" }}>
                      {canEdit ? (
                        <button onClick={() => handleToggleStatus(item)} title={item.isActive ? "Mark Inactive" : "Mark Active"}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none", background: item.isActive ? `${COLORS.success}15` : `${COLORS.danger}15`, color: item.isActive ? COLORS.success : COLORS.danger }}>
                          {item.isActive ? <FiToggleRight size={14} /> : <FiToggleLeft size={14} />}
                          {item.isActive ? "Active" : "Inactive"}
                        </button>
                      ) : (
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: item.isActive ? `${COLORS.success}15` : `${COLORS.danger}15`, color: item.isActive ? COLORS.success : COLORS.danger }}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => generateInventoryPDF(item)} title="Download PDF" style={{ background: `${COLORS.mauve}10`, border: `1px solid ${COLORS.mauve}25`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: COLORS.mauve, display: "flex", alignItems: "center" }}><FiDownload size={13} /></button>
                        {canEdit && <button onClick={() => setEditItem(item)} title="Edit" style={{ background: `${COLORS.gold}10`, border: `1px solid ${COLORS.gold}25`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: COLORS.goldDark, display: "flex", alignItems: "center" }}><FiEdit2 size={13} /></button>}
                        {canEdit && <button onClick={() => handleDelete(item.id)} title="Delete" style={{ background: `${COLORS.danger}10`, border: `1px solid ${COLORS.danger}25`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: COLORS.danger, display: "flex", alignItems: "center" }}><FiTrash2 size={13} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: `1px solid ${COLORS.lavender}20`, fontSize: 13, color: COLORS.mauve }}>
              <span>{meta.total > 0 ? `${(meta.page - 1) * meta.limit + 1}–${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total}` : "0 results"}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${COLORS.lavender}50`, background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}><FiChevronLeft size={14} /></button>
                <span style={{ padding: "6px 12px", fontWeight: 700, color: COLORS.darkIndigo }}>{meta.page} / {meta.totalPages}</span>
                <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${COLORS.lavender}50`, background: "#fff", cursor: page >= meta.totalPages ? "not-allowed" : "pointer", opacity: page >= meta.totalPages ? 0.4 : 1 }}><FiChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && <InventoryFormModal mode="create" projects={activeProjects} onClose={() => setShowCreate(false)} />}
      {editItem && <InventoryFormModal mode="edit" item={editItem} projects={activeProjects} onClose={() => setEditItem(null)} />}
    </>
  );
}

// ── Form Modal ────────────────────────────────────────────────────

interface FormState {
  ownerName: string; ownerPhone: string; ownerEmail: string;
  inventoryType: InventoryType; inventorySubType: InventorySubType;
  projectId: string; bhk: BHKType | ""; size: string; floor: string;
  demand: string; unitNo: string; towerNo: string; facing: string;
  furnishingType: FurnishingType | ""; hasTenant: boolean; hasParking: boolean;
}

function InventoryFormModal({ mode, item, projects, onClose }: {
  mode: "create" | "edit";
  item?: InventoryItem;
  projects: Project[];
  onClose: () => void;
}) {
  const [create, { isLoading: creating }] = useCreateInventoryMutation();
  const [update, { isLoading: updating }] = useUpdateInventoryMutation();
  const isLoading = creating || updating;

  const [form, setForm] = useState<FormState>({
    ownerName: item?.ownerName ?? "",
    ownerPhone: item?.ownerPhone ?? "",
    ownerEmail: item?.ownerEmail ?? "",
    inventoryType: item?.inventoryType ?? "RESIDENTIAL",
    inventorySubType: item?.inventorySubType ?? "RENT_RESIDENTIAL",
    projectId: item?.projectId ?? "",
    bhk: item?.bhk ?? "",
    size: item?.size != null ? String(item.size) : "",
    floor: item?.floor ?? "",
    demand: item?.demand != null ? String(item.demand) : "",
    unitNo: item?.unitNo ?? "",
    towerNo: item?.towerNo ?? "",
    facing: item?.facing ?? "",
    furnishingType: item?.furnishingType ?? "",
    hasTenant: item?.hasTenant ?? false,
    hasParking: item?.hasParking ?? false,
  });

  const [error, setError] = useState("");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // When type changes, auto-select the first valid subtype
  const handleTypeChange = (type: InventoryType) =>
  setForm(f => ({ ...f, inventoryType: type, inventorySubType: SUB_TYPE_MAP[type][0].value, bhk: "" }));

  const subtypesForForm = SUB_TYPE_MAP[form.inventoryType];

  const buildBody = () => ({
    ownerName: form.ownerName, ownerPhone: form.ownerPhone,
    ownerEmail: form.ownerEmail || undefined,
    inventoryType: form.inventoryType, inventorySubType: form.inventorySubType,
    projectId: form.projectId || undefined,
    bhk: form.bhk || undefined,
    size: form.size ? Number(form.size) : undefined,
    floor: form.floor || undefined,
    demand: form.demand ? Number(form.demand) : undefined,
    unitNo: form.unitNo || undefined, towerNo: form.towerNo || undefined,
    facing: form.facing || undefined,
    furnishingType: form.furnishingType || undefined,
    hasTenant: form.hasTenant, hasParking: form.hasParking,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError("");
    try {
      if (mode === "edit" && item) { await update({ id: item.id, body: buildBody() }).unwrap(); }
      else { await create(buildBody()).unwrap(); }
      onClose();
    } catch (err: unknown) {
      setError((err as { data?: { message?: string } })?.data?.message || `Failed to ${mode === "edit" ? "update" : "create"}`);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(26,15,46,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 32, width: 580, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: COLORS.mauve }}><FiX size={20} /></button>

        <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif", color: COLORS.darkIndigo }}>
          {mode === "edit" ? "Edit Inventory" : "Add Inventory"}
        </h2>

        {error && <div style={{ padding: "10px 14px", borderRadius: 8, background: COLORS.dangerLight, color: COLORS.danger, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Owner */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>Owner Name <span style={{ color: COLORS.danger }}>*</span></label><input required value={form.ownerName} onChange={e => set("ownerName", e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Phone <span style={{ color: COLORS.danger }}>*</span></label><input required value={form.ownerPhone} onChange={e => set("ownerPhone", e.target.value)} style={fieldStyle} /></div>
          </div>
          <div style={{ marginBottom: 14 }}><label style={labelStyle}>Email</label><input type="email" value={form.ownerEmail} onChange={e => set("ownerEmail", e.target.value)} style={fieldStyle} /></div>

          {/* Type + Sub Type — synced */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Type <span style={{ color: COLORS.danger }}>*</span></label>
              <select value={form.inventoryType} onChange={e => handleTypeChange(e.target.value as InventoryType)} style={fieldStyle}>
                {INV_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sub Type <span style={{ color: COLORS.danger }}>*</span></label>
              <select value={form.inventorySubType} onChange={e => set("inventorySubType", e.target.value as InventorySubType)} style={fieldStyle}>
                {subtypesForForm.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Project */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Project</label>
            <select value={form.projectId} onChange={e => set("projectId", e.target.value)} style={fieldStyle}>
              <option value="">— No Project —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* BHK + Size + Floor */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
  <label style={labelStyle}>
    {form.inventoryType === "COMMERCIAL" ? "Info" : "BHK"}
  </label>
  {form.inventoryType === "COMMERCIAL" ? (
    <select
      value={form.bhk}
      onChange={e => set("bhk", e.target.value as BHKType | "")}
      style={fieldStyle}
    >
      <option value="">Select</option>
      {COMMERCIAL_UNIT_OPTIONS.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
    </select>
  ) : (
    <select
      value={form.bhk}
      onChange={e => set("bhk", e.target.value as BHKType | "")}
      style={fieldStyle}
    >
      <option value="">Select</option>
      {BHK_OPTS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
    </select>
  )}
</div>
            <div><label style={labelStyle}>Size (sqft)</label><input type="number" value={form.size} onChange={e => set("size", e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Floor</label><input value={form.floor} onChange={e => set("floor", e.target.value)} style={fieldStyle} /></div>
          </div>

          {/* Unit + Tower + Facing */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>Unit No.</label><input value={form.unitNo} onChange={e => set("unitNo", e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Tower No.</label><input value={form.towerNo} onChange={e => set("towerNo", e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Facing</label><input value={form.facing} onChange={e => set("facing", e.target.value)} style={fieldStyle} /></div>
          </div>

          {/* Demand + Furnishing */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>Demand (₹)</label><input type="number" value={form.demand} onChange={e => set("demand", e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>Furnishing</label><select value={form.furnishingType} onChange={e => set("furnishingType", e.target.value as FurnishingType | "")} style={fieldStyle}><option value="">Select</option>{FURNISH_OPTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select></div>
          </div>

          {/* Checkboxes */}
          <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: COLORS.darkIndigo, cursor: "pointer" }}>
              <input type="checkbox" checked={form.hasTenant} onChange={e => set("hasTenant", e.target.checked)} style={{ accentColor: COLORS.gold }} /> Tenant
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: COLORS.darkIndigo, cursor: "pointer" }}>
              <input type="checkbox" checked={form.hasParking} onChange={e => set("hasParking", e.target.checked)} style={{ accentColor: COLORS.gold }} /> Parking
            </label>
          </div>

          <button type="submit" disabled={isLoading} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: isLoading ? COLORS.lavender : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: isLoading ? "none" : `0 4px 12px ${COLORS.gold}40` }}>
            {isLoading ? (mode === "edit" ? "Updating..." : "Creating...") : (mode === "edit" ? "Update Inventory" : "Add Inventory")}
          </button>
        </form>
      </div>
    </div>
  );
}