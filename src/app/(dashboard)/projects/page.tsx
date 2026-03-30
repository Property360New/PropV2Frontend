"use client";

import { useState, FormEvent } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import {
  useGetProjectsQuery,
  useGetProjectDetailQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from "@/store/projects.api";
import { useGetProfileQuery } from "@/store/auth.api";
import type { Project } from "@/types";
import {
  FiPlus, FiX, FiTrash2, FiEdit2, FiDownload,
  FiChevronDown, FiChevronUp, FiFileText,
} from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

// ─── Designation Access Control ───────────────────────────────────────────────

/**
 * Designations allowed to Add / Edit projects.
 * Matches backend canEditInventory logic + explicit role list.
 */
const CAN_ADD_EDIT_PROJECT_DESIGNATIONS = new Set([
  "ADMIN",
  "DGM",
  "GM",
  "VP_SALES",
  "AREA_MANAGER",
  "SALES_COORDINATOR",
  "SALES_MANAGER",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function n(v: number | null | undefined) { return Number(v ?? 0); }

function fmt(v: number | null | undefined) {
  if (!v) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(v);
}

function calcPrices(p: Project, size: number) {
  const bsp      = n(p.basicSellPrice);
  const discount = n(p.discount);
  const base     = (bsp - discount) * size;
  const addl     = (n(p.edc) + n(p.idc) + n(p.ffc) + n(p.viewPlc) +
                    n(p.cornerPlc) + n(p.floorPlc) + n(p.otherAdditionalCharges)) * size;
  const poss     = (n(p.leastRent) + n(p.otherPossessionCharges)) * size +
                    n(p.powerBackupPrice) * n(p.powerBackupKva);
  const total    = base + addl + poss;
  const gst      = total * (n(p.gstPercent) / 100);
  const totalGst = total + gst;
  return { base, addl, poss, total, gst, totalGst };
}

// ─── PDF Generator ────────────────────────────────────────────────────────────

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror  = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function downloadProjectPDF(p: Project) {
  // ── A4 LANDSCAPE — guarantees one page ─────────────────────────────────────
  const pdf    = new jsPDF("l", "mm", "a4");
  const pw     = pdf.internal.pageSize.getWidth();   // 297 mm
  const ph     = pdf.internal.pageSize.getHeight();  // 210 mm
  const m      = 11;   // margin
  const gap    = 6;    // gap between left and right columns
  const colW   = (pw - m * 2 - gap) / 2;  // ~134 mm each column

  // ── Brand colours ──────────────────────────────────────────────────────────
  const primary:   [number, number, number] = [91, 24, 78];
  const primaryLt: [number, number, number] = [120, 40, 105];
  const gold:      [number, number, number] = [196, 152, 60];
  const white:     [number, number, number] = [255, 255, 255];
  const lightBg:   [number, number, number] = [248, 245, 251];
  const accentBg:  [number, number, number] = [240, 230, 245];
  const textDark:  [number, number, number] = [30, 15, 46];
  const textMid:   [number, number, number] = [110, 85, 130];

  const size = n(p.sizeInSqft);
  const { base, addl, poss, total, gst, totalGst } = calcPrices(p, size);

  // ── Shared mini-table style (very compact) ─────────────────────────────────
  const ts = {
    font: "helvetica" as const,
    fontSize: 8,
    cellPadding: { top: 1.8, bottom: 1.8, left: 3, right: 3 },
    textColor: textDark,
    halign: "left" as const,
  };
  const lbW = 52;  // label column width inside each half-page column

  // ── HEADER BAND ────────────────────────────────────────────────────────────
  pdf.setFillColor(...primary);
  pdf.rect(0, 0, pw, 22, "F");

  // gold stripe top
  pdf.setFillColor(...gold);
  pdf.rect(0, 0, pw, 1.8, "F");

  // Project name (left of header)
  pdf.setFontSize(15).setFont("helvetica", "bold").setTextColor(...white);
  pdf.text(p.name, m, 10);
  if (p.clientName) {
    pdf.setFontSize(8.5).setFont("helvetica", "normal").setTextColor(220, 200, 235);
    pdf.text(`Client: ${p.clientName}`, m, 16.5);
  }

  // Date (right of header)
  pdf.setFontSize(7.5).setFont("helvetica", "normal").setTextColor(210, 190, 225);
  pdf.text(
    `Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
    pw - m, 16.5,
    { align: "right" },
  );

  // gold divider below header
  pdf.setDrawColor(...gold);
  pdf.setLineWidth(0.4);
  pdf.line(m, 23.5, pw - m, 23.5);

// ── FOOTER (logo + quote) ──────────────────────────────────────────────────
const footerH  = 36;                       // ← increased to fit content
const footerY  = ph - footerH;

pdf.setFillColor(...primary);
pdf.rect(0, footerY, pw, footerH, "F");

// gold stripe bottom
pdf.setFillColor(...gold);
pdf.rect(0, ph - 1.5, pw, 1.5, "F");

// Logo — full page width, taller
const logoBase64 = await loadImageAsBase64("/property360jpg.jpg");
if (logoBase64) {
  const logoW = pw;          // full page width (297 mm in landscape)
  const logoH = 14;          // taller than before
  pdf.addImage(logoBase64, "PNG", 0, footerY + 1, logoW, logoH);
} else {
  pdf.setFontSize(11).setFont("helvetica", "bold").setTextColor(...white);
  pdf.text("PROPERTY 360", pw / 2, footerY + 10, { align: "center" });
}

// Company address below logo
pdf.setFontSize(7).setFont("helvetica", "normal").setTextColor(210, 185, 225);
pdf.text(
  "Property 360 Degree Pvt Ltd : Office no: 543, Tower 3, Golden I Techzone 4 Greater Noida West 201306 , M: 9873280984",
  pw / 2,
  footerY + 17,
  { align: "center" },
);

// Quote — bigger, centered
pdf.setFontSize(9.5).setFont("helvetica", "italic").setTextColor(210, 185, 225);
pdf.text(
  `"Don't wait to buy real estate, buy real estate and wait."`,
  pw / 2,
  footerY + 27,
  { align: "center" },
);

  // ── CONTENT AREA limits ────────────────────────────────────────────────────
  const contentTop  = 26;
  const contentBot  = footerY - 3;   // don't go below footer

  // ── TWO-COLUMN LAYOUT ──────────────────────────────────────────────────────
  // Left column  x = m
  // Right column x = m + colW + gap
  const leftX  = m;
  const rightX = m + colW + gap;

  let yL = contentTop;   // current y for left column
  let yR = contentTop;   // current y for right column

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Draws a small section label above a table block */
  const secTitle = (title: string, x: number, y: number): number => {
    pdf.setFillColor(...primary);
    pdf.rect(x, y, 2.5, 3.8, "F");
    pdf.setFontSize(7).setFont("helvetica", "bold").setTextColor(...primaryLt);
    pdf.text(title, x + 4, y + 3);
    return y + 5.5;
  };

  /**
   * Renders a compact 2-col key/value table in the given column.
   * Returns the new y after the table.
   */
  const miniTable = (
    rows: [string, string][],
    x: number,
    startY: number,
    opts?: { highlightLast?: boolean },
  ): number => {
    const body = rows.filter(([, v]) => v && v !== "—");
    if (!body.length) return startY;

    const highlightIdx = opts?.highlightLast ? body.length - 1 : -1;

    autoTable(pdf, {
      startY,
      body: body.map((row, i) =>
        i === highlightIdx
          ? [
              { content: row[0], styles: { fontStyle: "bold", fillColor: primary, textColor: white } },
              { content: row[1], styles: { fontStyle: "bold", fillColor: primary, textColor: white, halign: "right" as const } },
            ]
          : row,
      ),
      theme: "grid",
      styles: ts,
      columnStyles: {
        0: { cellWidth: lbW, fontStyle: "bold", fillColor: lightBg, textColor: primaryLt },
        1: { cellWidth: colW - lbW },
      },
      tableWidth: colW,
      margin: { left: x },
    });

    return (pdf as any).lastAutoTable.finalY + 4;
  };

  // ════════════════════════════════════════════════════════════════════════════
  // LEFT COLUMN
  // ════════════════════════════════════════════════════════════════════════════

  // ── Project Details ─────────────────────────────────────────────────────────
  yL = secTitle("PROJECT DETAILS", leftX, yL);
  yL = miniTable([
    ["Product",      p.product || "—"],
    ["Size",         size ? `${size} sq.ft.` : "—"],
    ["Floors",       p.floors?.toString() || "—"],
    ["Payment Plan", p.paymentPlan || "—"],
  ], leftX, yL);

  // ── Basic Price ──────────────────────────────────────────────────────────────
  yL = secTitle("BASIC PRICE", leftX, yL);
  yL = miniTable([
    ["BSP / sq.ft.", p.basicSellPrice ? `Rs. ${n(p.basicSellPrice).toLocaleString("en-IN")}` : "—"],
    ["Size",         size ? `${size} sq.ft.` : "—"],
    ["Amount",       `Rs. ${base.toLocaleString("en-IN")}`],
  ], leftX, yL);

  // ── Additional Charges ──────────────────────────────────────────────────────
  const addlRows: [string, string][] = [];
  if (p.viewPlc)               addlRows.push(["View PLC",        `Rs. ${(n(p.viewPlc)   * size).toLocaleString("en-IN")}`]);
  if (p.cornerPlc)             addlRows.push(["Corner PLC",      `Rs. ${(n(p.cornerPlc) * size).toLocaleString("en-IN")}`]);
  if (p.floorPlc)              addlRows.push(["Floor PLC",       `Rs. ${(n(p.floorPlc)  * size).toLocaleString("en-IN")}`]);
  if (p.otherAdditionalCharges) addlRows.push(["Other",          `Rs. ${(n(p.otherAdditionalCharges) * size).toLocaleString("en-IN")}`]);
  if (addl > 0)                addlRows.push(["Total Additional", `Rs. ${addl.toLocaleString("en-IN")}`]);

  if (addlRows.length > 0) {
    yL = secTitle("ADDITIONAL CHARGES", leftX, yL);
    yL = miniTable(addlRows, leftX, yL, { highlightLast: addl > 0 });
  }

  // ── Possession Charges ──────────────────────────────────────────────────────
  const possRows: [string, string][] = [];
  if (p.powerBackupPrice && p.powerBackupKva)
    possRows.push(["Power Backup", `Rs. ${(n(p.powerBackupPrice) * n(p.powerBackupKva)).toLocaleString("en-IN")}`]);
  if (p.otherPossessionCharges)
    possRows.push(["Other",        `Rs. ${(n(p.otherPossessionCharges) * size).toLocaleString("en-IN")}`]);
  if (poss > 0)
    possRows.push(["Total Possession", `Rs. ${poss.toLocaleString("en-IN")}`]);

  if (possRows.length > 0) {
    yL = secTitle("POSSESSION CHARGES", leftX, yL);
    yL = miniTable(possRows, leftX, yL, { highlightLast: poss > 0 });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RIGHT COLUMN
  // ════════════════════════════════════════════════════════════════════════════

  // ── Total Price ─────────────────────────────────────────────────────────────
  yR = secTitle("TOTAL PRICE", rightX, yR);
  yR = miniTable([
    ["Subtotal",                  `Rs. ${total.toLocaleString("en-IN")}`],
    [`GST @ ${n(p.gstPercent)}%`, `Rs. ${gst.toLocaleString("en-IN")}`],
    ["TOTAL (Incl. GST)",         `Rs. ${totalGst.toLocaleString("en-IN")}`],
  ], rightX, yR, { highlightLast: true });

  // ── Payment Schedule ────────────────────────────────────────────────────────
  const bookRows: [string, string][] = [];
  if (p.onBookingPercent)    bookRows.push([`On Booking (${p.onBookingPercent}%)`,        `Rs. ${(totalGst * n(p.onBookingPercent)    / 100).toLocaleString("en-IN")}`]);
  if (p.within30DaysPercent) bookRows.push([`Within 30 Days (${p.within30DaysPercent}%)`, `Rs. ${(totalGst * n(p.within30DaysPercent) / 100).toLocaleString("en-IN")}`]);
  if (p.onPossessionPercent) bookRows.push([`On Possession (${p.onPossessionPercent}%)`,  `Rs. ${(totalGst * n(p.onPossessionPercent)  / 100).toLocaleString("en-IN")}`]);

  if (bookRows.length > 0) {
    yR = secTitle("PAYMENT SCHEDULE", rightX, yR);
    yR = miniTable(bookRows, rightX, yR);
  }

  // ── Notes ───────────────────────────────────────────────────────────────────
  const notes = [p.note1, p.note2, p.note3, p.note4].filter(Boolean) as string[];
  if (notes.length) {
    yR = secTitle("NOTES", rightX, yR);
    pdf.setFontSize(7.5).setFont("helvetica", "normal").setTextColor(...textDark);
    notes.forEach((note) => {
      const lines = pdf.splitTextToSize(`• ${note}`, colW - 5);
      // safety: stop before footer
      if (yR + lines.length * 4 < contentBot) {
        pdf.text(lines, rightX + 3, yR);
        yR += lines.length * 4 + 1.5;
      }
    });
  }

  // ── Vertical divider between columns ───────────────────────────────────────
  const divX = m + colW + gap / 2;
  pdf.setDrawColor(...gold);
  pdf.setLineWidth(0.3);
  pdf.line(divX, contentTop, divX, Math.max(yL, yR) + 2);

  pdf.save(`${p.name.replace(/\s+/g, "_")}_details.pdf`);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: COLORS.white, borderRadius: 16,
      border: `1px solid ${COLORS.lavender}30`,
      overflow: "hidden", padding: "20px 22px",
    }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {[180, 120, 100, 90].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 18 : 13, width: w, borderRadius: 6, marginBottom: 10,
          background: `linear-gradient(90deg,${COLORS.lavender}25 25%,${COLORS.lavender}55 50%,${COLORS.lavender}25 75%)`,
          backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
        }} />
      ))}
    </div>
  );
}

// ─── Price Row ────────────────────────────────────────────────────────────────

function PriceRow({ label, value, bold, highlight }: {
  label: string; value: string; bold?: boolean; highlight?: boolean;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "5px 0", borderBottom: `1px solid ${COLORS.lavender}15`,
    }}>
      <span style={{ fontSize: 12, color: highlight ? COLORS.darkIndigo : COLORS.mauve, fontWeight: bold ? 700 : 400 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: bold ? 800 : 600, color: highlight ? COLORS.gold : COLORS.darkIndigo }}>
        {value}
      </span>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({
  proj, canAddEdit, canDelete, onEdit, onDelete,
}: {
  proj: Project;
  /** True for ADMIN, DGM, GM, VP_SALES, AREA_MANAGER, SALES_COORDINATOR, SALES_MANAGER */
  canAddEdit: boolean;
  /** True for ADMIN only */
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const size = n(proj.sizeInSqft);
  const { base, addl, poss, total, gst, totalGst } = calcPrices(proj, size);
  const notes = [proj.note1, proj.note2, proj.note3, proj.note4].filter(Boolean) as string[];

  return (
    <div style={{
      background: COLORS.white, borderRadius: 16,
      border: `1px solid ${COLORS.lavender}30`,
      boxShadow: "0 2px 12px rgba(26,15,46,0.04)",
      overflow: "hidden",
    }}>
      {/* Gradient top stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${COLORS.mauve}, ${COLORS.gold})` }} />

      {/* Header */}
      <div style={{ padding: "18px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 17, fontWeight: 800, color: COLORS.darkIndigo,
              fontFamily: "'Playfair Display', Georgia, serif",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {proj.name}
            </div>
            {proj.clientName && (
              <div style={{ fontSize: 12, color: COLORS.mauve, marginTop: 2 }}>{proj.clientName}</div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
            {/* PDF — visible to everyone */}
            <button onClick={() => downloadProjectPDF(proj)} title="Download PDF" style={{
              background: "#E74C3C15", border: "1px solid #E74C3C30", borderRadius: 7,
              padding: "5px 8px", cursor: "pointer", color: "#E74C3C",
              display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
            }}>
              <FiDownload size={12} /> PDF
            </button>

            {/* Edit — visible to canAddEdit designations */}
            {canAddEdit && (
              <button onClick={onEdit} title="Edit" style={{
                background: `${COLORS.mauve}10`, border: `1px solid ${COLORS.mauve}30`,
                borderRadius: 7, padding: "5px 7px", cursor: "pointer", color: COLORS.mauve,
                display: "flex", alignItems: "center",
              }}>
                <FiEdit2 size={13} />
              </button>
            )}

            {/* Delete — ADMIN only */}
            {canDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete" style={{
                background: `${COLORS.danger}10`, border: `1px solid ${COLORS.danger}25`,
                borderRadius: 7, padding: "5px 7px", cursor: "pointer", color: COLORS.danger,
                display: "flex", alignItems: "center",
              }}>
                <FiTrash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Quick info chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {proj.product && (
            <span style={{
              background: `${COLORS.mauve}10`, color: COLORS.darkIndigo,
              fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 10,
              border: `1px solid ${COLORS.lavender}40`,
            }}>
              {proj.product}
            </span>
          )}
          {size > 0 && (
            <span style={{
              background: `${COLORS.gold}12`, color: COLORS.goldDark,
              fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 10,
              border: `1px solid ${COLORS.gold}30`,
            }}>
              {size} sqft
            </span>
          )}
          {proj.basicSellPrice && (
            <span style={{
              background: "#27AE6010", color: "#27AE60",
              fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 10,
              border: "1px solid #27AE6025",
            }}>
              BSP {fmt(proj.basicSellPrice)}
            </span>
          )}
          {proj.gstPercent && (
            <span style={{
              background: `${COLORS.lavender}20`, color: COLORS.darkIndigo,
              fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 10,
            }}>
              GST {proj.gstPercent}%
            </span>
          )}
        </div>
      </div>

      {/* Expand/collapse toggle */}
      <button
        onClick={() => setExpanded((x) => !x)}
        style={{
          width: "100%", padding: "10px 20px",
          background: `${COLORS.lavender}12`,
          border: "none", borderTop: `1px solid ${COLORS.lavender}20`,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          fontSize: 12, fontWeight: 700, color: COLORS.mauve,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {expanded ? <><FiChevronUp size={14} /> Hide Details</> : <><FiChevronDown size={14} /> View Full Breakdown</>}
      </button>

      {/* Expanded breakdown */}
      {expanded && (
        <div style={{ padding: "16px 20px 20px" }}>
          {/* Product Info */}
          {(proj.floors || proj.paymentPlan) && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel title="Project Info" icon="🏢" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                {proj.floors      && <PriceRow label="Floors"       value={String(proj.floors)} />}
                {proj.paymentPlan && <PriceRow label="Payment Plan" value={proj.paymentPlan} />}
              </div>
            </div>
          )}

          {/* Basic Price */}
          <div style={{ marginBottom: 16 }}>
            <SectionLabel title="Basic Price" icon="💰" />
            <PriceRow label="BSP/sqft" value={fmt(proj.basicSellPrice)} />
            {proj.discount && <PriceRow label="Discount" value={fmt(proj.discount)} />}
            <PriceRow label="Size"     value={size ? `${size} sqft` : "—"} />
            <PriceRow label="Amount"   value={`₹ ${base.toLocaleString("en-IN")}`} bold />
          </div>

          {/* Additional Charges */}
          {addl > 0 && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel title="Additional Charges" icon="➕" />
              {proj.edc       && <PriceRow label="EDC"            value={`₹ ${(n(proj.edc)    * size).toLocaleString("en-IN")}`} />}
              {proj.idc       && <PriceRow label="IDC"            value={`₹ ${(n(proj.idc)    * size).toLocaleString("en-IN")}`} />}
              {proj.ffc       && <PriceRow label="FFC"            value={`₹ ${(n(proj.ffc)    * size).toLocaleString("en-IN")}`} />}
              {proj.viewPlc   && <PriceRow label="View PLC"       value={`₹ ${(n(proj.viewPlc)   * size).toLocaleString("en-IN")}`} />}
              {proj.cornerPlc && <PriceRow label="Corner PLC"     value={`₹ ${(n(proj.cornerPlc) * size).toLocaleString("en-IN")}`} />}
              {proj.floorPlc  && <PriceRow label="Floor PLC"      value={`₹ ${(n(proj.floorPlc)  * size).toLocaleString("en-IN")}`} />}
              {proj.otherAdditionalCharges && (
                <PriceRow label="Other Additional" value={`₹ ${(n(proj.otherAdditionalCharges) * size).toLocaleString("en-IN")}`} />
              )}
              <PriceRow label="Total Additional" value={`₹ ${addl.toLocaleString("en-IN")}`} bold />
            </div>
          )}

          {/* Possession Charges */}
          {poss > 0 && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel title="Possession Charges" icon="🏠" />
              {proj.powerBackupKva        && <PriceRow label={`Power Backup (${proj.powerBackupKva} KVA)`} value={`₹ ${(n(proj.powerBackupPrice) * n(proj.powerBackupKva)).toLocaleString("en-IN")}`} />}
              {proj.leastRent             && <PriceRow label="Lease Rent"         value={`₹ ${(n(proj.leastRent) * size).toLocaleString("en-IN")}`} />}
              {proj.otherPossessionCharges && <PriceRow label="Other Possession"  value={`₹ ${(n(proj.otherPossessionCharges) * size).toLocaleString("en-IN")}`} />}
              <PriceRow label="Total Possession" value={`₹ ${poss.toLocaleString("en-IN")}`} bold />
            </div>
          )}

          {/* Total */}
          <div style={{
            padding: "12px 14px", borderRadius: 10, marginBottom: 16,
            background: `linear-gradient(135deg, ${COLORS.darkIndigo}08, ${COLORS.mauve}08)`,
            border: `1px solid ${COLORS.lavender}30`,
          }}>
            <SectionLabel title="Total Price" icon="🧾" />
            <PriceRow label="Subtotal"                    value={`₹ ${total.toLocaleString("en-IN")}`} />
            <PriceRow label={`GST ${n(proj.gstPercent)}%`} value={`₹ ${gst.toLocaleString("en-IN")}`} />
            <PriceRow label="Total (Incl. GST)"           value={`₹ ${totalGst.toLocaleString("en-IN")}`} bold highlight />
          </div>

          {/* Booking */}
          {(proj.onBookingPercent || proj.within30DaysPercent || proj.onPossessionPercent) && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel title="Booking" icon="📋" />
              {proj.onBookingPercent    && <PriceRow label={`On Booking (${proj.onBookingPercent}%)`}        value={`₹ ${(totalGst * n(proj.onBookingPercent)    / 100).toLocaleString("en-IN")}`} />}
              {proj.within30DaysPercent && <PriceRow label={`Within 30 Days (${proj.within30DaysPercent}%)`} value={`₹ ${(totalGst * n(proj.within30DaysPercent) / 100).toLocaleString("en-IN")}`} />}
              {proj.onPossessionPercent && <PriceRow label={`On Possession (${proj.onPossessionPercent}%)`}  value={`₹ ${(totalGst * n(proj.onPossessionPercent)  / 100).toLocaleString("en-IN")}`} />}
            </div>
          )}

          {/* Notes */}
          {notes.length > 0 && (
            <div>
              <SectionLabel title="Notes" icon="📝" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                {notes.map((note, i) => (
                  <div key={i} style={{
                    padding: "7px 12px", background: `${COLORS.lavender}10`,
                    borderRadius: 8, border: `1px solid ${COLORS.lavender}25`,
                    fontSize: 12, color: COLORS.darkIndigo, lineHeight: 1.6,
                  }}>
                    • {note}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ title, icon }: { title: string; icon: string }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, color: COLORS.mauve,
      textTransform: "uppercase", letterSpacing: "0.6px",
      marginBottom: 6, display: "flex", alignItems: "center", gap: 5,
    }}>
      <span>{icon}</span> {title}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { data: projects, isLoading } = useGetProjectsQuery();
  const { data: profile } = useGetProfileQuery();

  const designation = profile?.designation ?? "";

  /**
   * canAddEdit — allowed to create & edit projects.
   * Designations: ADMIN, DGM, GM, VP_SALES, AREA_MANAGER, SALES_COORDINATOR, SALES_MANAGER
   */
  const canAddEdit = CAN_ADD_EDIT_PROJECT_DESIGNATIONS.has(designation);

  /**
   * canDelete — only ADMIN can delete (hard-enforced on backend too).
   */
  const canDelete = designation === "ADMIN";

  const [showCreate, setShowCreate]   = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject]               = useDeleteProjectMutation();

  const handleDelete = async (id: string) => {
    if (!canDelete) return; // extra client-side guard
    if (!confirm("Delete this project? This cannot be undone.")) return;
    try { await deleteProject(id).unwrap(); }
    catch { alert("Failed to delete project."); }
  };

  return (
    <>
      <TopBar title="Project Details" subtitle="Manage real estate project portfolio" >
        <TutorialButton videoUrl={TUTORIALS.project} />
      </TopBar>

      <div style={{ padding: "24px 32px" }}>
        {/* Add Project button — only for canAddEdit designations */}
        {canAddEdit && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <button onClick={() => setShowCreate(true)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: `0 4px 12px ${COLORS.gold}40`, fontFamily: "'DM Sans', sans-serif",
            }}>
              <FiPlus size={16} /> Add Project
            </button>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !projects?.length ? (
          <div style={{
            textAlign: "center", padding: 60, color: COLORS.mauve,
            background: COLORS.white, borderRadius: 16,
            border: `1px solid ${COLORS.lavender}30`,
          }}>
            No projects found.{canAddEdit && ` Click "Add Project" to create one.`}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
            {projects.map((proj) => (
              <ProjectCard
                key={proj.id}
                proj={proj}
                canAddEdit={canAddEdit}
                canDelete={canDelete}
                onEdit={() => setEditProject(proj)}
                onDelete={() => handleDelete(proj.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate  && <ProjectFormModal onClose={() => setShowCreate(false)} />}
      {editProject && <ProjectFormModal project={editProject} onClose={() => setEditProject(null)} />}
    </>
  );
}

// ─── Project Form Modal (Create + Edit) ───────────────────────────────────────

const FIELDS: { key: keyof Project; label: string; type?: string; span?: boolean }[] = [
  { key: "name",                    label: "Project Name *",      span: true },
  { key: "clientName",              label: "Client Name" },
  { key: "product",                 label: "Product" },
  { key: "sizeInSqft",              label: "Size (sqft)",         type: "number" },
  { key: "floors",                  label: "Floors",              type: "number" },
  { key: "paymentPlan",             label: "Payment Plan" },
  { key: "basicSellPrice",          label: "Basic Sell Price",    type: "number" },
  { key: "discount",                label: "Discount (per sqft)", type: "number" },
  { key: "viewPlc",                 label: "View PLC",            type: "number" },
  { key: "cornerPlc",               label: "Corner PLC",          type: "number" },
  { key: "floorPlc",                label: "Floor PLC",           type: "number" },
  { key: "edc",                     label: "EDC",                 type: "number" },
  { key: "idc",                     label: "IDC",                 type: "number" },
  { key: "ffc",                     label: "FFC",                 type: "number" },
  { key: "otherAdditionalCharges",  label: "Other Additional",    type: "number" },
  { key: "leastRent",               label: "Lease Rent",          type: "number" },
  { key: "otherPossessionCharges",  label: "Other Possession",    type: "number" },
  { key: "gstPercent",              label: "GST %",               type: "number" },
  { key: "powerBackupKva",          label: "Power Backup KVA",    type: "number" },
  { key: "powerBackupPrice",        label: "Power Backup Price",  type: "number" },
  { key: "onBookingPercent",        label: "On Booking %",        type: "number" },
  { key: "within30DaysPercent",     label: "Within 30 Days %",    type: "number" },
  { key: "onPossessionPercent",     label: "On Possession %",     type: "number" },
  { key: "note1",                   label: "Note 1",              span: true },
  { key: "note2",                   label: "Note 2",              span: true },
  { key: "note3",                   label: "Note 3",              span: true },
  { key: "note4",                   label: "Note 4",              span: true },
];

function ProjectFormModal({ project, onClose }: { project?: Project; onClose: () => void }) {
  const isEdit = !!project;
  const [createProject, { isLoading: creating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: updating }] = useUpdateProjectMutation();
  const isBusy = creating || updating;

  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    FIELDS.forEach(({ key }) => {
      init[key] = project ? String((project as any)[key] ?? "") : "";
    });
    return init;
  });
  const [error, setError] = useState("");

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { setError("Project name is required"); return; }
    setError("");
    const body: Record<string, unknown> = {};
    FIELDS.forEach(({ key, type }) => {
      const v = form[key];
      if (v === "" || v === undefined) return;
      body[key] = type === "number" ? Number(v) : v;
    });
    try {
      if (isEdit) {
        await updateProject({ id: project!.id, body }).unwrap();
      } else {
        await createProject(body).unwrap();
      }
      onClose();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to save project");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 9,
    border: `1.5px solid ${COLORS.lavender}60`, fontSize: 13,
    background: "#fff", color: COLORS.darkIndigo,
    fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", outline: "none",
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(26,15,46,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 20, width: "min(700px, 96vw)",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px", position: "sticky", top: 0, zIndex: 2,
          background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`,
          color: "#fff", borderRadius: "20px 20px 0 0",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>
            {isEdit ? `Edit — ${project!.name}` : "Add New Project"}
          </h2>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
            width: 32, height: 32, cursor: "pointer", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "#FDECEA", color: "#C0392B",
              fontSize: 13, fontWeight: 600, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {FIELDS.map(({ key, label, type, span }) => (
              <div key={key} style={{ gridColumn: span ? "1 / -1" : undefined }}>
                <label style={{
                  fontSize: 11, fontWeight: 700, color: COLORS.mauve,
                  display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.3px",
                }}>
                  {label}
                </label>
                <input
                  type={type || "text"}
                  value={form[key] || ""}
                  onChange={(e) => set(key, e.target.value)}
                  step={type === "number" ? "any" : undefined}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button type="submit" disabled={isBusy} style={{
              flex: 1, padding: 13, borderRadius: 10, border: "none",
              background: isBusy
                ? COLORS.lavender
                : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: isBusy ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {isBusy ? "Saving..." : isEdit ? "Save Changes" : "Create Project"}
            </button>
            <button type="button" onClick={onClose} style={{
              padding: "13px 20px", borderRadius: 10,
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
    </div>
  );
}