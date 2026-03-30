 
"use client";
 
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  FiUploadCloud,
  FiDownload,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiClock,
  FiFileText,
  FiChevronDown,
  FiChevronUp,
  FiUsers,
} from "react-icons/fi";
import { COLORS } from "@/lib/colors";
import {
  useGetImportHistoryQuery,
  useImportLeadsMutation,
  useLazyDownloadTemplateQuery,
} from "@/store/bulk-import.api";
import { useGetScopeEmployeesQuery } from "@/store/hierarchy.api";
import type { ImportResult, ImportHistoryItem } from "@/store/bulk-import.api";
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
 
function formatDate(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
 
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
 
// ─── Result Summary Card ──────────────────────────────────────────────────────
 
function ResultCard({ result }: { result: ImportResult }) {
  const [showErrors, setShowErrors] = useState(false);
  const total = result.total;
 
  const stats = [
    { label: "Total Rows",  value: total,           color: COLORS.darkIndigo, bg: `${COLORS.lavender}25` },
    { label: "Created",     value: result.created,  color: "#27AE60",         bg: "#27AE6015" },
    { label: "Skipped",     value: result.skipped,  color: COLORS.gold,       bg: `${COLORS.gold}15` },
    { label: "Failed",      value: result.failed,   color: "#E74C3C",         bg: "#E74C3C15" },
  ];
 
  return (
    <div style={{
      background: "#fff", borderRadius: 16, overflow: "hidden",
      border: `1px solid ${COLORS.lavender}30`,
      boxShadow: "0 4px 20px rgba(26,15,46,0.08)",
      animation: "fadeSlideIn 0.3s ease both",
    }}>
      {/* Banner */}
      <div style={{
        padding: "16px 20px",
        background: result.failed === 0
          ? "linear-gradient(135deg, #1a7a40, #27AE60)"
          : `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`,
        color: "#fff", display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {result.failed === 0
            ? <FiCheck size={18} />
            : <FiAlertCircle size={18} />}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>
            Import {result.failed === 0 ? "Completed" : "Completed with errors"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            {result.created} lead{result.created !== 1 ? "s" : ""} added successfully
          </div>
        </div>
      </div>
 
      {/* Stats grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12, padding: 16,
      }}>
        {stats.map(({ label, value, color, bg }) => (
          <div key={label} style={{
            background: bg, borderRadius: 10, padding: "12px 14px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: COLORS.mauve, fontWeight: 600, marginTop: 4 }}>
              {label}
            </div>
          </div>
        ))}
      </div>
 
      {/* Errors accordion */}
      {result.errors && result.errors.length > 0 && (
        <div style={{ borderTop: `1px solid ${COLORS.lavender}20`, margin: "0 16px" }}>
          <button
            onClick={() => setShowErrors((v) => !v)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "12px 0", border: "none", background: "none",
              cursor: "pointer", color: "#E74C3C", fontWeight: 700, fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FiAlertCircle size={14} />
              {result.errors.length} error{result.errors.length !== 1 ? "s" : ""} (first {result.errors.length})
            </span>
            {showErrors ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>
          {showErrors && (
            <div style={{
              maxHeight: 200, overflowY: "auto",
              marginBottom: 16, borderRadius: 8,
              border: "1px solid #E74C3C20", background: "#E74C3C08",
            }}>
              {result.errors.map((err, idx) => (
                <div key={idx} style={{
                  padding: "8px 12px", fontSize: 12, color: COLORS.darkIndigo,
                  borderBottom: idx < result.errors.length - 1 ? "1px solid #E74C3C15" : "none",
                  display: "flex", gap: 10,
                }}>
                  <span style={{
                    background: "#E74C3C20", color: "#E74C3C",
                    fontSize: 10, fontWeight: 700,
                    padding: "1px 7px", borderRadius: 6, flexShrink: 0,
                    display: "flex", alignItems: "center",
                  }}>
                    Row {err.row}
                  </span>
                  <span style={{ color: COLORS.mauve }}>{err.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
 
// ─── History Row ──────────────────────────────────────────────────────────────
 
function HistoryRow({ item }: { item: ImportHistoryItem }) {
  const successRate =
    item.totalRows > 0
      ? Math.round((item.successRows / item.totalRows) * 100)
      : 0;
  const color =
    item.failedRows === 0 ? "#27AE60" : item.successRows > 0 ? COLORS.gold : "#E74C3C";
 
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 16px",
      borderBottom: `1px solid ${COLORS.lavender}15`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: `${color}15`, color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <FiFileText size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: 13, color: COLORS.darkIndigo,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {item.fileName}
        </div>
        <div style={{ fontSize: 11, color: COLORS.mauve, marginTop: 2 }}>
          {formatDate(item.createdAt)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
          background: "#27AE6015", color: "#27AE60",
        }}>
          +{item.successRows}
        </span>
        {item.failedRows > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
            background: "#E74C3C15", color: "#E74C3C",
          }}>
            ✕{item.failedRows}
          </span>
        )}
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
          background: `${color}15`, color,
        }}>
          {successRate}%
        </span>
      </div>
    </div>
  );
}
 
// ─── Main Modal ───────────────────────────────────────────────────────────────
 
interface BulkImportModalProps {
  onClose: () => void;
}
 
export function BulkImportModal({ onClose }: BulkImportModalProps) {
  const [file,         setFile]         = useState<File | null>(null);
  const [isDragging,   setIsDragging]   = useState(false);
  const [assignedToId, setAssignedToId] = useState("");
  const [result,       setResult]       = useState<ImportResult | null>(null);
  const [apiError,     setApiError]     = useState("");
  const [activeTab,    setActiveTab]    = useState<"upload" | "history">("upload");
 
  const fileInputRef = useRef<HTMLInputElement>(null);
 
  const { data: employees } = useGetScopeEmployeesQuery();
  const { data: history, refetch: refetchHistory } = useGetImportHistoryQuery();
  const [importLeads, { isLoading }] = useImportLeadsMutation();
  const [triggerDownload, { isLoading: isDownloading }] = useLazyDownloadTemplateQuery();
 
  // ── Template download — uses baseQueryWithAuth so the correct base URL + auth header are applied ──
  const downloadTemplate = () => {
    triggerDownload().catch(() => setApiError("Failed to download template. Please try again."));
  };
 
  // ── File handling ──────────────────────────────────────────────────────────
  const acceptFile = (f: File) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!allowed.includes(f.type) && !f.name.match(/\.(xlsx|xls)$/i)) {
      setApiError("Only .xlsx and .xls files are supported.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setApiError("File must be under 10 MB.");
      return;
    }
    setApiError("");
    setResult(null);
    setFile(f);
  };
 
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  };
 
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    e.target.value = "";
  };
 
  // ── Import submit ──────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!file) return;
    setApiError("");
    setResult(null);
    try {
      const res = await importLeads({
        file,
        assignedToId: assignedToId || undefined,
      }).unwrap();
      setResult(res);
      setFile(null);
      refetchHistory();
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      setApiError(msg || "Import failed. Please check your file and try again.");
    }
  };
 
  // ── Shared input style ─────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10, boxSizing: "border-box",
    border: `1.5px solid ${COLORS.lavender}60`, fontSize: 13,
    background: "#fff", color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
  };
 
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(26,15,46,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1200, backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#f8f7fc", borderRadius: 20, width: "100%", maxWidth: 580,
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 32px 64px rgba(26,15,46,0.25)",
          animation: "fadeSlideIn 0.25s ease both",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: "22px 28px 18px",
          background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`,
          borderRadius: "20px 20px 0 0",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff",
              }}>
                <FiUploadCloud size={20} />
              </div>
              <h2 style={{
                margin: 0, fontSize: 20, fontWeight: 800, color: "#fff",
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>
                Bulk Import Leads
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", paddingLeft: 48 }}>
              Upload an Excel file to add multiple leads at once
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8,
              width: 32, height: 32, cursor: "pointer", color: "#fff", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <FiX size={17} />
          </button>
        </div>
 
        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 0, background: "#fff",
          borderBottom: `1px solid ${COLORS.lavender}25`,
        }}>
          {(["upload", "history"] as const).map((tab) => {
            const active = activeTab === tab;
            const Icon   = tab === "upload" ? FiUploadCloud : FiClock;
            const label  = tab === "upload" ? "Upload File" : `History (${history?.length ?? 0})`;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 7, padding: "13px 0", border: "none", background: "none",
                  cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? COLORS.darkIndigo : COLORS.mauve,
                  borderBottom: active ? `2.5px solid ${COLORS.gold}` : "2.5px solid transparent",
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                }}
              >
                <Icon size={14} /> {label}
              </button>
            );
          })}
        </div>
 
        {/* ── Upload Tab ─────────────────────────────────────────────────── */}
        {activeTab === "upload" && (
          <div style={{ padding: "22px 28px 28px" }}>
 
            {/* Template download */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderRadius: 12, marginBottom: 20,
              background: `${COLORS.gold}10`,
              border: `1px solid ${COLORS.gold}30`,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.darkIndigo }}>
                  Need the template?
                </div>
                <div style={{ fontSize: 11, color: COLORS.mauve, marginTop: 1 }}>
                  Download our pre-formatted .xlsx file with sample data
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                disabled={isDownloading}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8, border: "none",
                  background: isDownloading
                    ? `${COLORS.lavender}60`
                    : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  cursor: isDownloading ? "not-allowed" : "pointer",
                  flexShrink: 0, fontFamily: "'DM Sans', sans-serif",
                  boxShadow: isDownloading ? "none" : `0 4px 12px ${COLORS.gold}35`,
                  transition: "all 0.2s",
                }}
              >
                <FiDownload size={13} /> {isDownloading ? "Downloading..." : "Download"}
              </button>
            </div>
 
            {/* Drop zone */}
            <div
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => !file && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? COLORS.gold : file ? "#27AE60" : `${COLORS.lavender}60`}`,
                borderRadius: 14, padding: "32px 20px", textAlign: "center",
                background: isDragging
                  ? `${COLORS.gold}08`
                  : file
                  ? "#27AE6008"
                  : `${COLORS.lavender}08`,
                cursor: file ? "default" : "pointer",
                transition: "all 0.2s", marginBottom: 18,
                position: "relative",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={onFileChange}
                style={{ display: "none" }}
              />
 
              {file ? (
                /* File selected */
                <div>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, margin: "0 auto 12px",
                    background: "#27AE6015",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#27AE60",
                  }}>
                    <FiFileText size={24} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.darkIndigo, marginBottom: 4 }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.mauve, marginBottom: 14 }}>
                    {formatBytes(file.size)}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "6px 14px", borderRadius: 7,
                      border: `1px solid ${COLORS.lavender}50`,
                      background: "#fff", color: COLORS.mauve,
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <FiX size={12} /> Remove
                  </button>
                </div>
              ) : (
                /* Empty drop zone */
                <div>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, margin: "0 auto 14px",
                    background: isDragging ? `${COLORS.gold}20` : `${COLORS.lavender}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isDragging ? COLORS.gold : COLORS.mauve,
                    transition: "all 0.2s",
                  }}>
                    <FiUploadCloud size={26} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.darkIndigo, marginBottom: 5 }}>
                    {isDragging ? "Drop it here!" : "Drag & drop your file"}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.mauve }}>
                    or <span style={{ color: COLORS.gold, fontWeight: 700, textDecoration: "underline" }}>browse</span> to upload · .xlsx or .xls · max 10 MB
                  </div>
                </div>
              )}
            </div>
 
            {/* Assign-to picker */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                fontSize: 12, fontWeight: 700, color: COLORS.darkIndigo,
                display: "flex", alignItems: "center", gap: 5, marginBottom: 6,
              }}>
                <FiUsers size={13} /> Auto-assign to (optional)
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Assign to uploader / use per-row employee</option>
                {employees?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} — {emp.designation.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: COLORS.mauve, marginTop: 5, lineHeight: 1.5 }}>
                If a row has an "Assigned To" phone, that takes precedence. This fallback applies to rows without one.
              </div>
            </div>
 
            {/* Error */}
            {apiError && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "11px 14px", borderRadius: 10, marginBottom: 16,
                background: "#E74C3C10", border: "1px solid #E74C3C30",
                fontSize: 13, color: "#C0392B", fontWeight: 600,
              }}>
                <FiAlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                {apiError}
              </div>
            )}
 
            {/* Result */}
            {result && (
              <div style={{ marginBottom: 20 }}>
                <ResultCard result={result} />
              </div>
            )}
 
            {/* Submit */}
            <button
              onClick={handleImport}
              disabled={!file || isLoading}
              style={{
                width: "100%", padding: 14, borderRadius: 12, border: "none",
                background: !file || isLoading
                  ? `${COLORS.lavender}60`
                  : `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`,
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: !file || isLoading ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: !file || isLoading ? "none" : "0 4px 16px rgba(26,15,46,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.2s",
              }}
            >
              {isLoading ? (
                <>
                  <span style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }} />
                  Importing...
                </>
              ) : (
                <>
                  <FiUploadCloud size={16} />
                  {file ? `Import "${file.name}"` : "Select a file to import"}
                </>
              )}
            </button>
          </div>
        )}
 
        {/* ── History Tab ────────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div style={{ padding: "0 0 8px" }}>
            {!history || history.length === 0 ? (
              <div style={{
                padding: 48, textAlign: "center",
                color: COLORS.mauve, fontSize: 13,
              }}>
                <FiClock size={32} style={{ marginBottom: 12, opacity: 0.35 }} />
                <div style={{ fontWeight: 700, marginBottom: 4 }}>No imports yet</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  Your import history will appear here
                </div>
              </div>
            ) : (
              <div>
                {/* Column headers */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "10px 16px",
                  background: `${COLORS.lavender}15`,
                  borderBottom: `1px solid ${COLORS.lavender}20`,
                  fontSize: 11, fontWeight: 700, color: COLORS.mauve,
                  textTransform: "uppercase", letterSpacing: "0.5px",
                }}>
                  <div style={{ width: 36 }} />
                  <div style={{ flex: 1 }}>File</div>
                  <div style={{ width: 140, textAlign: "right" }}>Created / Skipped / Failed</div>
                </div>
                {history.map((item) => (
                  <HistoryRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
 
      {/* Keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}