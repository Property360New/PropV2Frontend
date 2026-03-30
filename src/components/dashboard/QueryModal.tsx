"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import { createPortal } from "react-dom";
import { COLORS } from "@/lib/colors";
import {
  FiX, FiMessageSquare, FiEdit2, FiChevronDown, FiChevronUp, FiPhone,
  FiCheck, FiCalendar, FiSliders,
} from "react-icons/fi";
import {
  useAddQueryMutation,
  useUpdateQueryMutation,
  useAddRemarkMutation,
} from "@/store/leads.api";
import { useGetScopeEmployeesQuery } from "@/store/hierarchy.api";
import type { LeadStatus, LeadQuery, FurnishingType } from "@/types";
import { useGetProjectsDropdownQuery } from "@/store/projects.api";

// ─── Portal wrapper — renders children at document.body level ─────────────────
// This prevents modals from being clipped by parent overflow/height constraints

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "RINGING", label: "Ringing" },
  { value: "SWITCH_OFF", label: "Switch Off" },
  { value: "WRONG_NUMBER", label: "Wrong Number" },
  { value: "CALL_BACK", label: "Call Back" },
  { value: "FOLLOW_UP", label: "Follow Up / Call Picked" },
  { value: "VISIT_DONE", label: "Visit Done" },
  { value: "MEETING_DONE", label: "Meeting Done" },
  { value: "HOT_PROSPECT", label: "Hot Prospect" },
  { value: "SUSPECT", label: "Suspect" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
  { value: "DEAL_DONE", label: "Deal Done" },
];

const STATUS_COLOR: Record<string, string> = {
  FRESH: "#3498DB",
  FOLLOW_UP: "#E6A817",
  VISIT_DONE: "#8E44AD",
  MEETING_DONE: "#2980B9",
  RINGING: "#27AE60",
  CALL_BACK: "#E67E22",
  DEAL_DONE: "#27AE60",
  NOT_INTERESTED: "#C0392B",
  HOT_PROSPECT: "#E74C3C",
  SUSPECT: "#9B59B6",
  SWITCH_OFF: "#7F8C8D",
  WRONG_NUMBER: "#95A5A6",
};

const DETAILED_STATUSES: LeadStatus[] = [
  "FOLLOW_UP", "VISIT_DONE", "MEETING_DONE", "DEAL_DONE",
  "HOT_PROSPECT", "SUSPECT",
];

const LEAD_TYPE_OPTIONS = [
  { value: "RENT", label: "Rent Lead" },
  { value: "RESIDENTIAL", label: "Residential Lead" },
  { value: "COMMERCIAL", label: "Commercial Lead" },
];

const BHK_OPTIONS = [
  "2 BHK", "2 BHK + Study", "3 BHK", "3 BHK + Study",
  "3 BHK + Servant", "3 BHK + Servant + Store",
  "4 BHK", "4 BHK + Study", "4 BHK + Servant", "4 BHK + Store",
];

const COMMERCIAL_UNIT_OPTIONS = [
  "Office Space", "Studio App", "Society Shop", "Retail Shop",
  "Industrial Land", "Commercial Land",
];

const FURNISHING_OPTIONS: { value: FurnishingType; label: string }[] = [
  { value: "RAW_FLAT", label: "Raw Flat" },
  { value: "SEMI_FURNISHED", label: "Semi Furnished" },
  { value: "FULLY_FURNISHED", label: "Fully Furnished" },
];

const BUDGET_UNIT_OPTIONS = [
  { value: "thousands", label: "Thousands" },
  { value: "lakhs", label: "Lakhs" },
  { value: "crore", label: "Crore" },
];

const PURPOSE_OPTIONS = [
  { value: "Rental Income", label: "Rental Income" },
  { value: "Appreciation", label: "Appreciation" },
  { value: "Self Use", label: "Self Use" },
];

const LOCATION_OPTIONS = [
  "Noida Extension", "Yamuna Expressway", "Noida Expressway", "Sector 62", "Other",
];

const RENT_PROJECTS = [
  "Panchsheel Green 1", "Panchsheel Green 2", "Ajnara Homes",
  "French Apartment", "Gaur Saundryam", "EV 2",
  "Aims Green Avenue", "Golf Home", "Other",
];
const RESIDENTIAL_PROJECTS = [
  "Panchsheel Green 1", "Panchsheel Green 2", "Ajnara Homes",
  "French Apartment", "Gaur Saundryam", "Cherry County",
  "EV 2", "Aims Green Avenue", "Golf Home", "Other",
];
const COMMERCIAL_PROJECTS = [
  "GWSS", "Civitech Santony", "Bhutani 62 Avenue", "Golden I",
  "NX - One", "Golden Grande", "Irish Trehan", "M3M The Line",
  "Ace YXP", "Ace 153", "CRC Flagship", "EON", "Other",
];

const ADVANCED_STATUSES: LeadStatus[] = ["FOLLOW_UP", "DEAL_DONE", "MEETING_DONE", "VISIT_DONE"];
const SIMPLE_STATUSES: LeadStatus[] = ["RINGING", "CALL_BACK", "WRONG_NUMBER", "SWITCH_OFF"];

function isBlockedTransition(from: LeadStatus | undefined, to: LeadStatus): boolean {
  if (!from) return false;
  return ADVANCED_STATUSES.includes(from) && SIMPLE_STATUSES.includes(to);
}

function getProjectOptions(leadType: string) {
  if (leadType === "RENT") return RENT_PROJECTS;
  if (leadType === "COMMERCIAL") return COMMERCIAL_PROJECTS;
  return RESIDENTIAL_PROJECTS;
}

function getBhkOptions(leadType: string) {
  if (leadType === "COMMERCIAL") return COMMERCIAL_UNIT_OPTIONS;
  return BHK_OPTIONS;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: `1.5px solid ${COLORS.lavender}50`, fontSize: 13,
  color: COLORS.darkIndigo, background: "#fff",
  boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: COLORS.mauve,
  textTransform: "uppercase", display: "block",
  marginBottom: 4, letterSpacing: "0.4px",
};

function Field({ label, children, required }: {
  label: string; children: React.ReactNode; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: "#C0392B", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Sel({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, color: COLORS.mauve,
      textTransform: "uppercase", letterSpacing: "0.8px",
      margin: "20px 0 12px", paddingBottom: 6,
      borderBottom: `1px solid ${COLORS.lavender}30`,
    }}>
      {title}
    </div>
  );
}

// ─── Overlay — shared backdrop used by all modals ────────────────────────────

function Overlay({
  onClose, zIndex = 2000, children,
}: {
  onClose: () => void;
  zIndex?: number;
  children: React.ReactNode;
}) {
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <Portal>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex,
          background: "rgba(26,15,46,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)",
        }}
      >
        <div onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </Portal>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDateStr = (d: string | null | undefined) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;

const fmtDT = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }) : "—";

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  status: LeadStatus;
  remark: string;
  leadType: string;
  bhk: string; size: string; floor: string; location: string; purpose: string;
  furnishingType: string; projectName: string;
  budgetMin: string; budgetMax: string; budgetUnit: string;
  followUpDate: string; expVisitDate: string; visitDate: string;
  shiftingDate: string; meetingDate: string; dealDoneDate: string;
  visitDoneById: string; meetingDoneById: string;
  closingAmount: string; unitNo: string; reason: string;
  leadActualSlab: string; discount: string; actualRevenue: string;
  incentiveSlab: string; sellRevenue: string;
};

const emptyForm = (): FormState => ({
  status: "FOLLOW_UP", remark: "", leadType: "RESIDENTIAL",
  bhk: "", size: "", floor: "", location: "", purpose: "",
  furnishingType: "", projectName: "",
  budgetMin: "", budgetMax: "", budgetUnit: "lakhs",
  followUpDate: "", expVisitDate: "", visitDate: "",
  shiftingDate: "", meetingDate: "", dealDoneDate: "",
  visitDoneById: "", meetingDoneById: "",
  closingAmount: "", unitNo: "", reason: "",
  leadActualSlab: "", discount: "", actualRevenue: "",
  incentiveSlab: "", sellRevenue: "",
});

function queryToForm(q: LeadQuery): FormState {
  return {
    status: (q.status ?? q.callStatus) as LeadStatus ?? "FOLLOW_UP",
    remark: q.remark ?? "",
    leadType: q.leadType ?? "RESIDENTIAL",
    bhk: q.bhk ?? "",
    size: String(q.size ?? ""),
    floor: q.floor ?? "",
    location: q.location ?? "",
    purpose: q.purpose ?? "",
    furnishingType: q.furnishingType ?? "",
    projectName: q.project?.name ?? "",
    budgetMin: String(q.budgetMin ?? ""),
    budgetMax: String(q.budgetMax ?? ""),
    budgetUnit: q.budgetUnit ?? "lakhs",
    followUpDate: toDateStr(q.followUpDate),
    expVisitDate: toDateStr(q.expVisitDate),
    visitDate: toDateStr(q.visitDate),
    shiftingDate: toDateStr(q.shiftingDate),
    meetingDate: toDateStr(q.meetingDate),
    dealDoneDate: toDateStr(q.dealDoneDate),
    visitDoneById: q.visitDoneBy?.id ?? "",
    meetingDoneById: q.meetingDoneBy?.id ?? "",
    closingAmount: String(q.closingAmount ?? ""),
    unitNo: q.unitNo ?? "",
    reason: q.reason ?? "",
    leadActualSlab: String(q.leadActualSlab ?? ""),
    discount: String(q.discount ?? ""),
    actualRevenue: String(q.actualRevenue ?? ""),
    incentiveSlab: String(q.incentiveSlab ?? ""),
    sellRevenue: String(q.sellRevenue ?? ""),
  };
}

// ─── QueryModal ───────────────────────────────────────────────────────────────

interface QueryModalProps {
  leadId: string;
  leadName: string;
  existingQuery?: LeadQuery;
  onClose: () => void;
  isAdmin?: boolean;
}

export function QueryModal({ leadId, leadName, existingQuery, onClose, isAdmin = false }: QueryModalProps) {
  const isEdit = !!existingQuery;
  const [form, setForm] = useState<FormState>(isEdit ? queryToForm(existingQuery!) : emptyForm());
  const [error, setError] = useState("");
  const [customProject, setCustomProject] = useState("");
  const [showCustomProject, setShowCustomProject] = useState(false);

  const [addQuery, { isLoading: adding }] = useAddQueryMutation();
  const [updateQuery, { isLoading: updating }] = useUpdateQueryMutation();
  const { data: scopeEmployees } = useGetScopeEmployeesQuery();
  const { data: dbProjects } = useGetProjectsDropdownQuery();
  const isBusy = adding || updating;

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const showDetailed = DETAILED_STATUSES.includes(form.status);
  const isCommercial = form.leadType === "COMMERCIAL";
  const isRent = form.leadType === "RENT";
  const showDealFields = form.status === "DEAL_DONE";
  const showReasonField = form.status === "NOT_INTERESTED";

  useEffect(() => {
    if (!showDetailed) {
      setForm((f) => ({
        ...f,
        leadType: "RESIDENTIAL", bhk: "", size: "", floor: "",
        location: "", purpose: "", furnishingType: "", projectName: "",
        budgetMin: "", budgetMax: "", budgetUnit: "lakhs",
        followUpDate: "", expVisitDate: "", visitDate: "",
        shiftingDate: "", meetingDate: "", closingAmount: "", unitNo: "", reason: "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.status]);

  const n = (s: string) => (s ? Number(s) : undefined);
  const d = (s: string) => s || undefined;

  const buildBody = () => ({
    status: form.status,
    remark: form.remark || undefined,
    ...(showDetailed ? {
      leadType: form.leadType || undefined,
      bhk: form.bhk || undefined,
      size: n(form.size),
      floor: form.floor || undefined,
      location: isCommercial ? form.location || undefined : undefined,
      purpose: isCommercial ? form.purpose || undefined : undefined,
      furnishingType: form.furnishingType || undefined,
      budgetMin: n(form.budgetMin),
      budgetMax: n(form.budgetMax),
      budgetUnit: form.budgetUnit || undefined,
      followUpDate: d(form.followUpDate),
      expVisitDate: d(form.expVisitDate),
      visitDate: form.status === "VISIT_DONE" ? d(form.visitDate) : undefined,
      meetingDate: form.status === "MEETING_DONE" ? d(form.meetingDate) : undefined,
      shiftingDate: isRent ? d(form.shiftingDate) : undefined,
      visitDoneById: form.status === "VISIT_DONE" ? form.visitDoneById || undefined : undefined,
      meetingDoneById: form.status === "MEETING_DONE" ? form.meetingDoneById || undefined : undefined,
      closingAmount: showDealFields ? n(form.closingAmount) : undefined,
      unitNo: showDealFields ? form.unitNo || undefined : undefined,
      reason: showReasonField ? form.reason || undefined : undefined,
      // Admin-only financials — only sent when isAdmin
      ...(isAdmin ? {
        leadActualSlab: n(form.leadActualSlab),
        discount: n(form.discount),
        actualRevenue: n(form.actualRevenue),
        incentiveSlab: n(form.incentiveSlab),
        sellRevenue: n(form.sellRevenue),
      } : {}),
    } : {}),
  });

  const isBlocked = isBlockedTransition(existingQuery?.status ?? existingQuery?.callStatus as LeadStatus, form.status);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (isBlocked) {
      setError("This lead has already progressed to a higher stage. Please add a remark instead of downgrading the status.");
      return;
    }
    try {
      const body = buildBody();
      if (isEdit) {
        await updateQuery({ leadId, queryId: existingQuery!.id, body }).unwrap();
      } else {
        await addQuery({ leadId, body: body as any }).unwrap();
      }
      onClose();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to save query");
    }
  };

  return (
    <Overlay onClose={onClose} zIndex={2100}>
      <div style={{
        width: "min(600px, 96vw)", maxHeight: "90vh",
        background: "#fff", borderRadius: 20, overflowY: "auto",
        boxShadow: "0 32px 80px rgba(26,15,46,0.3)",
        animation: "modalIn 0.22s ease both",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px",
          background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`,
          color: "#fff", display: "flex", justifyContent: "space-between",
          alignItems: "center", position: "sticky", top: 0, zIndex: 2,
          borderRadius: "20px 20px 0 0",
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>
              {isEdit ? "Edit Query" : "Add New Query"}
            </h3>
            {leadName && (
              <p style={{ margin: "3px 0 0", fontSize: 12, opacity: 0.75 }}>{leadName}</p>
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

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "#FDECEA", color: "#C0392B",
              fontSize: 13, fontWeight: 600, marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          <Field label="Status *">
            <Sel value={form.status} onChange={(v) => set("status", v as LeadStatus)} options={STATUS_OPTIONS} />
          </Field>

          {isBlocked && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 14,
              background: `${COLORS.gold}12`, border: `1.5px solid ${COLORS.gold}50`,
              color: COLORS.darkIndigo, fontSize: 13, lineHeight: 1.6,
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <div>
                <strong>Status downgrade not allowed.</strong><br />
                This lead is already at <strong>{STATUS_OPTIONS.find(s => s.value === (existingQuery?.status ?? existingQuery?.callStatus))?.label}</strong>.
                Use the <em>Add Remark</em> button on the query card to log this call instead.
              </div>
            </div>
          )}

          {/* Simple statuses */}
          {!showDetailed && (
            <>
              {form.status === "CALL_BACK" && (
                <Field label="Callback Date">
                  <input type="date" value={form.followUpDate}
                    onChange={(e) => set("followUpDate", e.target.value)} style={inputStyle} />
                </Field>
              )}
              {showReasonField && (
                <Field label="Reason">
                  <input type="text" value={form.reason}
                    onChange={(e) => set("reason", e.target.value)}
                    placeholder="Enter reason..." style={inputStyle} />
                </Field>
              )}
              <Field label="Remark">
                <textarea value={form.remark} onChange={(e) => set("remark", e.target.value)}
                  rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </Field>
            </>
          )}

          {/* Detailed statuses */}
          {showDetailed && (
            <>
              <SectionHeader title="Lead Interest" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Lead Type">
                  <Sel value={form.leadType} onChange={(v) => set("leadType", v)} options={LEAD_TYPE_OPTIONS} />
                </Field>
                <Field label={isCommercial ? "Unit Type" : "BHK"}>
                  <Sel value={form.bhk} onChange={(v) => set("bhk", v)} placeholder="Select..."
                    options={getBhkOptions(form.leadType).map((b) => ({ value: b, label: b }))} />
                </Field>
              </div>

              <Field label="Project">
                <div style={{ display: "flex", gap: 8 }}>
                  <Sel
                    value={showCustomProject ? "__CUSTOM__" : form.projectName}
                    onChange={(v) => {
                      if (v === "__CUSTOM__") {
                        setShowCustomProject(true);
                        set("projectName", "");
                      } else {
                        setShowCustomProject(false);
                        set("projectName", v);
                      }
                    }}
                    placeholder="Select project..."
                    options={[
                      // DB projects first
                      ...(dbProjects ?? []).map((p) => ({
                        value: p.name,
                        label: p.product ? `${p.name} (${p.product})` : p.name,
                      })),
                      // Custom entry fallback
                      { value: "__CUSTOM__", label: "＋ Add Custom Name" },
                    ]}
                  />
                  {showCustomProject && (
                    <input
                      placeholder="Project name"
                      value={customProject}
                      onChange={(e) => {
                        setCustomProject(e.target.value);
                        set("projectName", e.target.value);
                      }}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  )}
                </div>
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {!isCommercial && (
                  <Field label="Furnishing">
                    <Sel value={form.furnishingType} onChange={(v) => set("furnishingType", v)}
                      placeholder="Select..." options={FURNISHING_OPTIONS} />
                  </Field>
                )}
                {!isCommercial && (
                  <Field label="Floor">
                    <input type="text" value={form.floor} onChange={(e) => set("floor", e.target.value)}
                      placeholder="e.g. 5th floor" style={inputStyle} />
                  </Field>
                )}
                {form.leadType === "RESIDENTIAL" && (
                  <Field label="Size (sqft)">
                    <input type="number" value={form.size} onChange={(e) => set("size", e.target.value)}
                      placeholder="e.g. 1200" style={inputStyle} />
                  </Field>
                )}
                {isCommercial && (
                  <>
                    <Field label="Location">
                      <Sel value={form.location} onChange={(v) => set("location", v)}
                        placeholder="Select..." options={LOCATION_OPTIONS.map((l) => ({ value: l, label: l }))} />
                    </Field>
                    <Field label="Purpose">
                      <Sel value={form.purpose} onChange={(v) => set("purpose", v)}
                        placeholder="Select..." options={PURPOSE_OPTIONS} />
                    </Field>
                  </>
                )}
              </div>

              <SectionHeader title="Budget" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Field label="Min">
                  <input type="number" value={form.budgetMin} onChange={(e) => set("budgetMin", e.target.value)}
                    placeholder="Min" style={inputStyle} />
                </Field>
                <Field label="Max">
                  <input type="number" value={form.budgetMax} onChange={(e) => set("budgetMax", e.target.value)}
                    placeholder="Max" style={inputStyle} />
                </Field>
                <Field label="Unit">
                  <Sel value={form.budgetUnit} onChange={(v) => set("budgetUnit", v)} options={BUDGET_UNIT_OPTIONS} />
                </Field>
              </div>

              <SectionHeader title="Dates" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Follow-up Date">
                  <input type="date" value={form.followUpDate}
                    onChange={(e) => set("followUpDate", e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Expected Visit Date">
                  <input type="date" value={form.expVisitDate}
                    onChange={(e) => set("expVisitDate", e.target.value)} style={inputStyle} />
                </Field>
                {isRent && (
                  <Field label="Shifting Date">
                    <input type="date" value={form.shiftingDate}
                      onChange={(e) => set("shiftingDate", e.target.value)} style={inputStyle} />
                  </Field>
                )}
              </div>

              {form.status === "VISIT_DONE" && (
                <>
                  <SectionHeader title="Visit Details" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Visit Done Date">
                      <input type="date" value={form.visitDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => set("visitDate", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Visit Done With">
                      <Sel value={form.visitDoneById} onChange={(v) => set("visitDoneById", v)}
                        placeholder="Select staff..."
                        options={(scopeEmployees ?? []).map((e) => ({
                          value: e.id, label: `${e.firstName} ${e.lastName ?? ""}`.trim(),
                        }))} />
                    </Field>
                  </div>
                </>
              )}

              {form.status === "MEETING_DONE" && (
                <>
                  <SectionHeader title="Meeting Details" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Meeting Done Date">
                      <input type="date" value={form.meetingDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => set("meetingDate", e.target.value)} style={inputStyle} />
                    </Field>
                    <Field label="Meeting Done With">
                      <Sel value={form.meetingDoneById} onChange={(v) => set("meetingDoneById", v)}
                        placeholder="Select staff..."
                        options={(scopeEmployees ?? []).map((e) => ({
                          value: e.id, label: `${e.firstName} ${e.lastName ?? ""}`.trim(),
                        }))} />
                    </Field>
                  </div>
                </>
              )}

              {showDealFields && (
                <>
                  <SectionHeader title="Deal Details" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Closing Amount">
                      <input type="number" value={form.closingAmount}
                        onChange={(e) => set("closingAmount", e.target.value)}
                        placeholder="Amount" style={inputStyle} />
                    </Field>
                    <Field label="Unit No">
                      <input type="text" value={form.unitNo}
                        onChange={(e) => set("unitNo", e.target.value)}
                        placeholder="e.g. Tower A – 501" style={inputStyle} />
                    </Field>
                  </div>

                  {/* ── Admin-only financial fields ── */}
                  {isAdmin && (
                    <>
                      <SectionHeader title="Financial Details (Admin Only)" />
                      <div style={{
                        padding: "12px 14px", borderRadius: 10, marginBottom: 16,
                        background: `${COLORS.gold}08`, border: `1px solid ${COLORS.gold}30`,
                        fontSize: 12, color: COLORS.mauve,
                      }}>
                        These fields are only visible to admins and will not appear for staff.
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {([
                          ["leadActualSlab", "Lead Actual Slab"],
                          ["discount", "Discount (%)"],
                          ["actualRevenue", "Actual Revenue"],
                          ["incentiveSlab", "Incentive Slab (%)"],
                          ["sellRevenue", "Sales Revenue"],
                        ] as [keyof FormState, string][]).map(([key, label]) => (
                          <Field key={key} label={label}>
                            <input type="number" value={form[key] as string}
                              onChange={(e) => set(key, e.target.value)}
                              placeholder={label} style={inputStyle} />
                          </Field>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {showReasonField && (
                <Field label="Reason">
                  <input type="text" value={form.reason}
                    onChange={(e) => set("reason", e.target.value)}
                    placeholder="Enter reason..." style={inputStyle} />
                </Field>
              )}

              <SectionHeader title="Remarks" />
              <Field label="Remark / Notes">
                <textarea value={form.remark} onChange={(e) => set("remark", e.target.value)}
                  rows={3} placeholder="Enter any notes..."
                  style={{ ...inputStyle, resize: "vertical" }} />
              </Field>
            </>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" disabled={isBusy} style={{
              flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
              background: isBusy
                ? COLORS.lavender
                : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: isBusy ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: isBusy ? "none" : `0 4px 14px ${COLORS.gold}40`,
            }}>
              {isBusy ? "Saving..." : isEdit ? "Update Query" : "Save Query"}
            </button>
            <button type="button" onClick={onClose} style={{
              padding: "12px 20px", borderRadius: 10,
              border: `1.5px solid ${COLORS.lavender}50`,
              background: "#fff", color: COLORS.mauve,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

// ─── AddRemarkModal ───────────────────────────────────────────────────────────

interface AddRemarkModalProps {
  leadId: string;
  queryId: string;
  queryStatus: LeadStatus;
  currentFollowUpDate?: string | null;
  onClose: () => void;
}

export function AddRemarkModal({
  leadId, queryId, queryStatus, currentFollowUpDate, onClose,
}: AddRemarkModalProps) {
  const [text, setText] = useState("");
  const [followUpDate, setFollowUpDate] = useState(toDateStr(currentFollowUpDate));
  const [error, setError] = useState("");

  const [addRemark, { isLoading: remarkLoading }] = useAddRemarkMutation();
  const [updateQuery, { isLoading: updateLoading }] = useUpdateQueryMutation();
  const isLoading = remarkLoading || updateLoading;

  const statusLabel = STATUS_OPTIONS.find((s) => s.value === queryStatus)?.label ?? queryStatus;
  const statusColor = STATUS_COLOR[queryStatus] ?? COLORS.mauve;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) { setError("Remark text is required"); return; }
    if (!followUpDate) { setError("Follow-up date is required"); return; }
    setError("");
    try {
      await Promise.all([
        addRemark({ leadId, queryId, body: { text: text.trim() } }).unwrap(),
        updateQuery({ leadId, queryId, body: { followUpDate } }).unwrap(),
      ]);
      onClose();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to save");
    }
  };

  return (
    <Overlay onClose={onClose} zIndex={2200}>
      <div style={{
        width: "min(460px, 96vw)", background: "#fff",
        borderRadius: 18, overflow: "hidden",
        boxShadow: "0 32px 80px rgba(26,15,46,0.3)",
        animation: "modalIn 0.22s ease both",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 22px",
          background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`,
          color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>
              Add Remark
            </h3>
            <div style={{ marginTop: 5 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: statusColor,
                background: `${statusColor}30`, padding: "2px 8px", borderRadius: 10,
              }}>
                {statusLabel}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
            width: 30, height: 30, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          }}>
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 22px" }}>
          {error && (
            <div style={{
              padding: "8px 12px", borderRadius: 8,
              background: "#FDECEA", color: "#C0392B",
              fontSize: 13, marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          <Field label="Remark" required>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              rows={4} placeholder="Enter remark / notes about this call..." autoFocus
              style={{ ...inputStyle, resize: "vertical" }} />
          </Field>

          <Field label="Next Follow-up Date" required>
            <div style={{ position: "relative" }}>
              <FiCalendar size={14} color={COLORS.mauve} style={{
                position: "absolute", left: 10, top: "50%",
                transform: "translateY(-50%)", pointerEvents: "none",
              }} />
              <input type="date" required value={followUpDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setFollowUpDate(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 32 }} />
            </div>
            <p style={{ margin: "5px 0 0", fontSize: 11, color: COLORS.mauve, lineHeight: 1.5 }}>
              This will update the query's follow-up date to the selected value.
            </p>
          </Field>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="submit" disabled={isLoading} style={{
              flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
              background: isLoading
                ? COLORS.lavender
                : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: isLoading ? "none" : `0 4px 12px ${COLORS.gold}35`,
            }}>
              {isLoading ? "Saving..." : "Save Remark & Update Follow-up"}
            </button>
            <button type="button" onClick={onClose} style={{
              padding: "11px 16px", borderRadius: 10,
              border: `1.5px solid ${COLORS.lavender}50`,
              background: "#fff", color: COLORS.mauve,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

// ─── InlineQuickEdit ──────────────────────────────────────────────────────────

interface InlineQuickEditProps {
  leadId: string;
  queryId: string;
  currentStatus: LeadStatus;
  currentFollowUpDate?: string | null;
  onDone: () => void;
}

function InlineQuickEdit({ leadId, queryId, currentStatus, currentFollowUpDate, onDone }: InlineQuickEditProps) {
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [followUpDate, setFollowUpDate] = useState(toDateStr(currentFollowUpDate));
  const [error, setError] = useState("");
  const [updateQuery, { isLoading }] = useUpdateQueryMutation();

  const isDirty = status !== currentStatus || followUpDate !== toDateStr(currentFollowUpDate);

  const handleSave = async () => {
    if (!isDirty) { onDone(); return; }
    if (isBlockedTransition(currentStatus, status)) {
      setError("Cannot downgrade from " + (STATUS_OPTIONS.find(s => s.value === currentStatus)?.label ?? currentStatus) + " to " + (STATUS_OPTIONS.find(s => s.value === status)?.label ?? status) + ". Add a remark instead.");
      return;
    }
    setError("");
    try {
      await updateQuery({
        leadId, queryId,
        body: { status, ...(followUpDate ? { followUpDate } : {}) },
      }).unwrap();
      onDone();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to update");
    }
  };

  const statusColor = STATUS_COLOR[status] ?? COLORS.mauve;

  return (
    <div style={{
      margin: "10px 0 4px", padding: "14px 16px", borderRadius: 10,
      background: `${COLORS.lavender}10`, border: `1.5px solid ${COLORS.lavender}35`,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: COLORS.mauve,
        textTransform: "uppercase", letterSpacing: "0.5px",
        marginBottom: 12, display: "flex", alignItems: "center", gap: 5,
      }}>
        <FiSliders size={11} /> Quick Update
      </div>

      {error && (
        <div style={{
          padding: "6px 10px", borderRadius: 7,
          background: "#FDECEA", color: "#C0392B", fontSize: 12, marginBottom: 10,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ ...labelStyle, marginBottom: 5 }}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} style={{
            ...inputStyle, fontWeight: 600, color: statusColor,
            borderColor: `${statusColor}60`, background: `${statusColor}08`,
          }}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}
                style={{ color: STATUS_COLOR[o.value] ?? COLORS.darkIndigo, fontWeight: 600 }}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ ...labelStyle, marginBottom: 5 }}>Follow-up Date</label>
          <div style={{ position: "relative" }}>
            <FiCalendar size={13} color={COLORS.mauve} style={{
              position: "absolute", left: 9, top: "50%",
              transform: "translateY(-50%)", pointerEvents: "none",
            }} />
            <input type="date" value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 30, fontSize: 12 }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={handleSave} disabled={isLoading || !isDirty} style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "8px 18px", borderRadius: 8, border: "none",
          background: (!isDirty || isLoading)
            ? `${COLORS.lavender}60`
            : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
          color: (!isDirty || isLoading) ? COLORS.mauve : "#fff",
          fontSize: 12, fontWeight: 700,
          cursor: (!isDirty || isLoading) ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.15s",
        }}>
          <FiCheck size={12} />
          {isLoading ? "Saving..." : "Save"}
        </button>
        <button onClick={onDone} disabled={isLoading} style={{
          padding: "8px 14px", borderRadius: 8,
          border: `1px solid ${COLORS.lavender}50`,
          background: "#fff", color: COLORS.mauve,
          fontSize: 12, fontWeight: 600,
          cursor: isLoading ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Cancel
        </button>
        {!isDirty && (
          <span style={{ fontSize: 11, color: COLORS.mauve, marginLeft: 4 }}>No changes yet</span>
        )}
      </div>
    </div>
  );
}

// ─── QueryCard ────────────────────────────────────────────────────────────────

interface QueryCardProps {
  query: LeadQuery;
  leadId: string;
  canEdit: boolean;
  isAdmin?: boolean;
  isHighlighted?: boolean;
  defaultExpanded?: boolean;
}

export function QueryCard({
  query, leadId, canEdit, isAdmin = false,
  isHighlighted = false, defaultExpanded = false,
}: QueryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showFullEdit, setShowFullEdit] = useState(false);
  const [showAddRemark, setShowAddRemark] = useState(false);
  const [showQuickEdit, setShowQuickEdit] = useState(false);

  const activeStatus = query.status ?? query.callStatus;
  const color = STATUS_COLOR[activeStatus] ?? "#7F8C8D";
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === activeStatus)?.label
    ?? activeStatus.replace(/_/g, " ");

  const remarks = query.remarks ?? [];
  const callCount = (query as any).callCount ?? (1 + remarks.length);

  // Admin-only financial fields — only shown when isAdmin=true
  const adminMetaItems = isAdmin ? ([
    ["Lead Actual Slab", (query as any).leadActualSlab != null ? String((query as any).leadActualSlab) : null],
    ["Discount", (query as any).discount != null ? `${(query as any).discount}%` : null],
    ["Actual Revenue", (query as any).actualRevenue != null ? `₹ ${Number((query as any).actualRevenue).toLocaleString("en-IN")}` : null],
    ["Incentive Slab", (query as any).incentiveSlab != null ? `${(query as any).incentiveSlab}%` : null],
    ["Sales Revenue", (query as any).sellRevenue != null ? `₹ ${Number((query as any).sellRevenue).toLocaleString("en-IN")}` : null],
  ] as [string, string | null][]).filter(([, v]) => v != null) as [string, string][] : [];

  const metaItems = ([
    ["Lead Type", query.leadType ? String(query.leadType) : null],
    ["BHK", query.bhk],
    ["Size", query.size ? `${query.size} sqft` : null],
    ["Floor", query.floor],
    ["Furnishing", query.furnishingType?.replace(/_/g, " ") ?? null],
    ["Budget", (query.budgetMin || query.budgetMax)
      ? `${query.budgetMin ?? "—"} – ${query.budgetMax ?? "—"} ${query.budgetUnit ?? ""}`.trim()
      : null],
    ["Follow-up", fmt(query.followUpDate)],
    ["Exp. Visit", fmt(query.expVisitDate)],
    ["Visit Done", fmt(query.visitDate)],
    ["Visit With", query.visitDoneBy ? `${query.visitDoneBy.firstName} ${query.visitDoneBy.lastName}` : null],
    ["Meeting Done", fmt(query.meetingDate)],
    ["Meeting With", query.meetingDoneBy ? `${query.meetingDoneBy.firstName} ${query.meetingDoneBy.lastName}` : null],
    ["Shifting Date", fmt(query.shiftingDate)],
    ["Location", query.location],
    ["Purpose", query.purpose],
    ["Closing Amt", query.closingAmount ? `₹ ${Number(query.closingAmount).toLocaleString("en-IN")}` : null],
    ["Unit No", query.unitNo],
    ["Reason", query.reason],
    // Admin financial fields appended only when isAdmin
    ...adminMetaItems,
  ] as [string, string | null | undefined][]).filter(([, v]) => v != null) as [string, string][];

  return (
    <>
      <div style={{
        background: "#fff", borderRadius: 12, marginBottom: 10,
        border: isHighlighted ? `2px solid ${color}` : `1px solid ${COLORS.lavender}25`,
        boxShadow: isHighlighted ? `0 2px 12px ${color}25` : "0 1px 6px rgba(26,15,46,0.05)",
        overflow: "hidden",
      }}>
        {/* Highlighted banner */}
        {isHighlighted && (
          <div style={{
            background: `${color}12`, borderBottom: `1px solid ${color}30`,
            padding: "5px 16px", fontSize: 11, fontWeight: 700, color,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            ★ Current tab query
          </div>
        )}

        {/* Card header row */}
        <div style={{
          padding: "12px 16px",
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", gap: 8,
        }}>
          {/* Left — clicking expands */}
          <div
            style={{ flex: 1, cursor: "pointer", minWidth: 0 }}
            onClick={() => setExpanded((x) => !x)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                display: "inline-block", padding: "3px 10px", borderRadius: 20,
                fontSize: 11, fontWeight: 700, color,
                background: `${color}15`, border: `1px solid ${color}30`, whiteSpace: "nowrap",
              }}>
                {statusLabel}
              </span>
              <span style={{ fontSize: 11, color: COLORS.mauve }}>{fmtDT(query.createdAt)}</span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                background: `${COLORS.mauve}12`, color: COLORS.darkIndigo,
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap",
              }}>
                <FiPhone size={9} />
                {callCount} call{callCount !== 1 ? "s" : ""}
              </span>
              {query.followUpDate && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  background: `${COLORS.gold}15`, color: COLORS.goldDark,
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                  whiteSpace: "nowrap", border: `1px solid ${COLORS.gold}30`,
                }}>
                  <FiCalendar size={9} /> {fmt(query.followUpDate)}
                </span>
              )}
            </div>

            {query.remark && !query.isAutoRemark && (
              <p style={{
                margin: "6px 0 0", fontSize: 13, color: COLORS.darkIndigo, lineHeight: 1.5,
                display: expanded ? undefined : "-webkit-box",
                WebkitLineClamp: expanded ? undefined : 2,
                WebkitBoxOrient: expanded ? undefined : ("vertical" as any),
                overflow: expanded ? undefined : "hidden",
              }}>
                {query.remark}
              </p>
            )}
            {query.remark && query.isAutoRemark && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.mauve, fontStyle: "italic" }}>
                {query.remark}
              </p>
            )}
            {remarks.length > 0 && (
              <div style={{ fontSize: 11, color: COLORS.mauve, marginTop: 4 }}>
                {remarks.length} extra remark{remarks.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Right — action icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 4 }}>
            {query.createdBy && (
              <span style={{ fontSize: 11, color: COLORS.mauve, whiteSpace: "nowrap", marginRight: 4 }}>
                {query.createdBy.firstName}
              </span>
            )}

            {canEdit && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQuickEdit((x) => !x);
                    if (!expanded) setExpanded(true);
                  }}
                  title="Quick edit status & follow-up date"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: 7,
                    border: `1px solid ${showQuickEdit ? COLORS.gold + "80" : COLORS.gold + "40"}`,
                    background: showQuickEdit ? `${COLORS.gold}25` : `${COLORS.gold}12`,
                    color: COLORS.goldDark, cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
                  }}
                >
                  <FiSliders size={13} />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); setShowFullEdit(true); }}
                  title="Edit all query fields"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: 7,
                    border: `1px solid ${COLORS.lavender}40`,
                    background: `${COLORS.darkIndigo}06`, color: COLORS.darkIndigo,
                    cursor: "pointer", flexShrink: 0,
                  }}
                >
                  <FiEdit2 size={13} />
                </button>
              </>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); setShowAddRemark(true); }}
              title="Add remark"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: 7,
                border: `1px solid ${COLORS.mauve}30`,
                background: `${COLORS.mauve}10`, color: COLORS.mauve,
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <FiMessageSquare size={13} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((x) => !x); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: 7,
                border: `1px solid ${COLORS.lavender}30`,
                background: "transparent", color: COLORS.mauve,
                cursor: "pointer", flexShrink: 0,
              }}
            >
              {expanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Expanded body */}
        {expanded && (
          <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${COLORS.lavender}15` }}>
            {showQuickEdit && canEdit && (
              <InlineQuickEdit
                leadId={leadId}
                queryId={query.id}
                currentStatus={activeStatus}
                currentFollowUpDate={query.followUpDate}
                onDone={() => setShowQuickEdit(false)}
              />
            )}

            {metaItems.length > 0 && (
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px",
                marginTop: 12, padding: "10px 12px", borderRadius: 8,
                background: `${COLORS.pearl}80`,
              }}>
                {metaItems.map(([label, val]) => (
                  <div key={label}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.mauve, textTransform: "uppercase" }}>
                      {label}:{" "}
                    </span>
                    <span style={{ fontSize: 12, color: COLORS.darkIndigo }}>{val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Admin financial section — only when isAdmin */}
            {isAdmin && adminMetaItems.length > 0 && (
              <div style={{
                marginTop: 10, padding: "10px 12px", borderRadius: 8,
                background: `${COLORS.gold}08`, border: `1px solid ${COLORS.gold}25`,
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, color: COLORS.goldDark,
                  textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8,
                }}>
                  Financial Details (Admin)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                  {adminMetaItems.map(([label, val]) => (
                    <div key={label}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.mauve, textTransform: "uppercase" }}>
                        {label}:{" "}
                      </span>
                      <span style={{ fontSize: 12, color: COLORS.darkIndigo }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {remarks.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: COLORS.mauve,
                  textTransform: "uppercase", marginBottom: 6,
                }}>
                  Extra Remarks
                </div>
                {remarks.map((r) => (
                  <div key={r.id} style={{
                    padding: "8px 12px", borderRadius: 8, marginBottom: 6,
                    background: `${COLORS.lavender}10`, border: `1px solid ${COLORS.lavender}25`,
                  }}>
                    <div style={{ fontSize: 13, color: COLORS.darkIndigo, lineHeight: 1.5 }}>{r.text}</div>
                    <div style={{ fontSize: 11, color: COLORS.mauve, marginTop: 3 }}>
                      {r.createdBy.firstName} {r.createdBy.lastName} · {fmtDT(r.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* These now render via Portal — no longer clipped by panel overflow */}
      {showFullEdit && (
        <QueryModal
          leadId={leadId}
          leadName=""
          existingQuery={query}
          isAdmin={isAdmin}
          onClose={() => setShowFullEdit(false)}
        />
      )}

      {showAddRemark && (
        <AddRemarkModal
          leadId={leadId}
          queryId={query.id}
          queryStatus={activeStatus}
          currentFollowUpDate={query.followUpDate}
          onClose={() => setShowAddRemark(false)}
        />
      )}
    </>
  );
}