import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { InventoryItem } from "@/types";

// ── Label helpers ─────────────────────────────────────────────────────────────

const BHK_LABELS: Record<string, string> = {
  TWO_BHK: "2 BHK",
  TWO_BHK_STUDY: "2 BHK+Study",
  THREE_BHK: "3 BHK",
  THREE_BHK_STUDY: "3 BHK+Study",
  THREE_BHK_SERVANT: "3 BHK+Servant",
  THREE_BHK_STORE: "3 BHK+Store",
  FOUR_BHK: "4 BHK",
  FOUR_BHK_STUDY: "4 BHK+Study",
  FOUR_BHK_SERVANT: "4 BHK+Servant",
  FOUR_BHK_STORE: "4 BHK+Store",
};

const FURNISH_LABELS: Record<string, string> = {
  RAW_FLAT: "Raw Flat",
  SEMI_FURNISHED: "Semi Furnished",
  FULLY_FURNISHED: "Fully Furnished",
};

const SUB_TYPE_LABELS: Record<string, string> = {
  RENT_RESIDENTIAL: "Rent Residential",
  RESALE_RESIDENTIAL: "Resale Residential",
  RENT_COMMERCIAL: "Rent Commercial",
  RESALE_COMMERCIAL: "Resale Commercial",
};

function bhkLabel(v: string | null | undefined) {
  return v ? (BHK_LABELS[v] ?? v.replace(/_/g, " ")) : "-";
}
function furnishLabel(v: string | null | undefined) {
  return v ? (FURNISH_LABELS[v] ?? v.replace(/_/g, " ")) : "-";
}
function subTypeLabel(v: string | null | undefined) {
  return v ? (SUB_TYPE_LABELS[v] ?? v.replace(/_/g, " ")) : "-";
}

/**
 * "Rs. X" — avoids the rupee Unicode glyph that jsPDF Helvetica cannot render.
 */
function fmtCurrency(v: number | null | undefined): string {
  if (!v) return "-";
  return `Rs. ${Math.round(v).toLocaleString("en-IN")}`;
}

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
}

// ── Logo loader ───────────────────────────────────────────────────────────────

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

// ── Main export ───────────────────────────────────────────────────────────────

export async function downloadInventoryPdf(item: InventoryItem) {
  // ── A4 PORTRAIT, single full-width column ─────────────────────────────────
  const pdf = new jsPDF("p", "mm", "a4");
  const pw = pdf.internal.pageSize.getWidth();   // 210 mm
  const ph = pdf.internal.pageSize.getHeight();  // 297 mm
  const m = 12; // margin left & right

  // full usable content width
  const contentW = pw - m * 2; // 186 mm

  // label column = 40%, value column = 60%
  const lbW = Math.round(contentW * 0.38);

  // ── Brand colours ─────────────────────────────────────────────────────────
  const primary:   [number, number, number] = [91, 24, 78];
  const primaryLt: [number, number, number] = [120, 40, 105];
  const gold:      [number, number, number] = [196, 152, 60];
  const white:     [number, number, number] = [255, 255, 255];
  const lightBg:   [number, number, number] = [248, 245, 251];
  const textDark:  [number, number, number] = [30, 15, 46];

  // ── Table base style ──────────────────────────────────────────────────────
  const ts = {
    font: "helvetica" as const,
    fontSize: 9,
    cellPadding: { top: 2.2, bottom: 2.2, left: 4, right: 4 },
    textColor: textDark,
    halign: "left" as const,
  };

  // ── HEADER BAND ───────────────────────────────────────────────────────────
  pdf.setFillColor(...primary);
  pdf.rect(0, 0, pw, 24, "F");

  // gold top stripe
  pdf.setFillColor(...gold);
  pdf.rect(0, 0, pw, 2, "F");

  // owner name as title
  pdf.setFontSize(16).setFont("helvetica", "bold").setTextColor(...white);
  pdf.text(item.ownerName || "Inventory Detail", m, 11);

  // subtitle: sub-type · project
  const subtitle = [subTypeLabel(item.inventorySubType), item.project?.name]
    .filter(Boolean)
    .join("  .  ");
  if (subtitle) {
    pdf.setFontSize(9).setFont("helvetica", "normal").setTextColor(220, 200, 235);
    pdf.text(subtitle, m, 18);
  }

  // generated date — top right
  pdf.setFontSize(8).setFont("helvetica", "normal").setTextColor(210, 190, 225);
  pdf.text(
    `Generated: ${new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    })}`,
    pw - m, 18,
    { align: "right" },
  );

  // gold divider under header
  pdf.setDrawColor(...gold);
  pdf.setLineWidth(0.5);
  pdf.line(m, 26, pw - m, 26);

// ── FOOTER ────────────────────────────────────────────────────────────────
const footerH = 36;
const footerY = ph - footerH;

pdf.setFillColor(...primary);
pdf.rect(0, footerY, pw, footerH, "F");

// gold bottom stripe
pdf.setFillColor(...gold);
pdf.rect(0, ph - 2, pw, 2, "F");

// logo — full page width, tall
const logoBase64 = await loadImageAsBase64("/property360jpg.jpg");
if (logoBase64) {
  const logoW = pw;          // full page width (210 mm)
  const logoH = 18;          // taller than before
  pdf.addImage(logoBase64, "PNG", 0, footerY + 1, logoW, logoH);
} else {
  pdf.setFontSize(14).setFont("helvetica", "bold").setTextColor(...white);
  pdf.text("PROPERTY 360", pw / 2, footerY + 12, { align: "center" });
}

// company address line below logo
pdf.setFontSize(7).setFont("helvetica", "normal").setTextColor(210, 185, 225);
pdf.text(
  "Property 360 Degree Pvt Ltd : Office no: 543, Tower 3, Golden I Techzone 4 Greater Noida West 201306 , M: 9873280984",
  pw / 2,
  footerY + 22,
  { align: "center" },
);

// quote — centered, larger
pdf.setFontSize(9.5).setFont("helvetica", "italic").setTextColor(210, 185, 225);
pdf.text(
  `"Don't wait to buy real estate, buy real estate and wait."`,
  pw / 2,
  footerY + 30,
  { align: "center" },
);

  // ── CONTENT ───────────────────────────────────────────────────────────────
  let y = 29; // start just below header divider

  // ── Section title helper ──────────────────────────────────────────────────
  const secTitle = (t: string, startY: number): number => {
    pdf.setFillColor(...primary);
    pdf.rect(m, startY, 3, 4, "F");
    pdf.setFontSize(7.5).setFont("helvetica", "bold").setTextColor(...primaryLt);
    pdf.text(t, m + 5, startY + 3.2);
    return startY + 6;
  };

  // ── Full-width key/value table helper ─────────────────────────────────────
  const section = (
    rows: [string, string][],
    startY: number,
    opts?: { highlightLast?: boolean },
  ): number => {
    const body = rows.filter(([, v]) => v && v !== "-");
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
        1: { cellWidth: contentW - lbW },
      },
      tableWidth: contentW,
      margin: { left: m, right: m },
    });

    return (pdf as any).lastAutoTable.finalY + 5;
  };

  // ── PROPERTY DETAILS ──────────────────────────────────────────────────────
  y = secTitle("PROPERTY DETAILS", y);
  y = section([
    ["Type",      subTypeLabel(item.inventorySubType)],
    ["Project",   val(item.project?.name)],
    ["BHK",       bhkLabel(item.bhk)],
    ["Size",      item.size ? `${item.size} sqft` : "-"],
    ["Floor",     val(item.floor)],
    ["Unit No.",  val(item.unitNo)],
    ["Tower No.", val(item.towerNo)],
    ["Facing",    val(item.facing)],
  ], y);

  // ── CONDITION ─────────────────────────────────────────────────────────────
  y = secTitle("TYPE", y);
  y = section([
    ["Furnishing", furnishLabel(item.furnishingType)],
    ["Parking",    item.hasParking ? "Yes" : "No"],
    ["Status",     item.isActive ? "Active" : "Inactive"],
  ], y);

  // ── PRICING ───────────────────────────────────────────────────────────────
  y = secTitle("PRICING", y);
  y = section([
    ["Demand", fmtCurrency(item.demand)],
  ], y, { highlightLast: true });

  // ── ADDITIONAL INFO (optional) ────────────────────────────────────────────
  const extraRows: [string, string][] = [];
  if ((item as any).description) extraRows.push(["Description", val((item as any).description)]);
  if ((item as any).remarks)     extraRows.push(["Remarks",     val((item as any).remarks)]);
  if ((item as any).postedBy)    extraRows.push(["Posted By",   val((item as any).postedBy)]);

  if (extraRows.length > 0) {
    y = secTitle("ADDITIONAL INFO", y);
    y = section(extraRows, y);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const safeName = (item.ownerName || "inventory").replace(/\s+/g, "_");
  pdf.save(`${safeName}_inventory.pdf`);
}