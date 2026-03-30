"use client";

import { useState, FormEvent } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import {
  useGetMyTemplateQuery,
  useGetPlaceholdersQuery,
  useUpsertTemplateMutation,
  useDeleteTemplateMutation,
} from "@/store/whatsapp.api";
import { FiSave, FiTrash2, FiMessageSquare, FiInfo } from "react-icons/fi";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

// ─── Fallback list (shown if API is unavailable) ──────────────────────────────

const FALLBACK_PLACEHOLDERS = [
  { key: "lead_name",        label: "Lead Name",        example: "John Doe" },
  { key: "lead_phone",       label: "Lead Phone",       example: "9876543210" },
  { key: "lead_email",       label: "Lead Email",       example: "john@example.com" },
  { key: "lead_project",     label: "Project",          example: "Civitech Santoni" },
  { key: "lead_budget",      label: "Budget",           example: "50L - 1Cr" },
  { key: "followup_date",    label: "Follow-up Date",   example: "25 Mar 2026" },
  { key: "user_name",        label: "Your Name",        example: "Sales Rep" },
  { key: "user_designation", label: "Your Designation", example: "Sales Manager" },
];

/**
 * The backend returns { supportedPlaceholders: { '{lead_name}': 'desc', ... } }
 * — an object, NOT an array — so calling .map() on it crashes.
 *
 * This helper converts whatever the API sends into the flat array the UI needs.
 */
function normalisePlaceholders(
  raw: unknown,
): { key: string; label: string; example: string }[] {
  // Already a proper array → use directly
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;

    // Shape: { supportedPlaceholders: { '{lead_name}': 'Lead full name', ... } }
    const map = (obj.supportedPlaceholders ?? obj) as Record<string, string>;

    if (map && typeof map === "object" && !Array.isArray(map)) {
      const entries = Object.entries(map);
      if (entries.length > 0) {
        return entries.map(([bracketKey, description]) => {
          // Strip surrounding braces: "{lead_name}" → "lead_name"
          const key = bracketKey.replace(/^\{|\}$/g, "");
          return {
            key,
            label: description || key.replace(/_/g, " "),
            example: "",
          };
        });
      }
    }
  }

  return FALLBACK_PLACEHOLDERS;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WhatsAppTemplatePage() {
  const { data: template, isLoading }   = useGetMyTemplateQuery();
  const { data: rawPlaceholders }       = useGetPlaceholdersQuery();
  const [upsert, { isLoading: saving }]   = useUpsertTemplateMutation();
  const [remove, { isLoading: deleting }] = useDeleteTemplateMutation();

  const [text, setText] = useState<string | null>(null);
  const [msg,  setMsg]  = useState<{ ok: boolean; text: string } | null>(null);

  // Always an array now, regardless of API shape
  const placeholders = normalisePlaceholders(rawPlaceholders ?? FALLBACK_PLACEHOLDERS);

  // Use local draft while editing; fall back to saved template text
  const currentText = text !== null ? text : (template?.templateText ?? "");

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await upsert({ templateText: currentText }).unwrap();
      setMsg({ ok: true, text: "Template saved successfully!" });
      setText(null);
      setTimeout(() => setMsg(null), 3000);
    } catch (err: unknown) {
      setMsg({
        ok: false,
        text: (err as { data?: { message?: string } })?.data?.message || "Failed to save",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your WhatsApp template?")) return;
    setMsg(null);
    try {
      await remove().unwrap();
      setText("");
      setMsg({ ok: true, text: "Template deleted." });
      setTimeout(() => setMsg(null), 3000);
    } catch {
      setMsg({ ok: false, text: "Failed to delete template." });
    }
  };

  const insertPlaceholder = (key: string) => {
    setText(currentText + `{${key}}`);
  };

  return (
    <>
      <TopBar
        title="WhatsApp Template"
        subtitle="Customize your WhatsApp message template for leads"
      >
        <TutorialButton videoUrl={TUTORIALS.whatsappTemplate} />
      </TopBar>  

      <div style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto" }}>

        {/* ── Placeholders info card ── */}
        <div style={{
          background: COLORS.white, borderRadius: 16, padding: "20px 24px",
          marginBottom: 24, border: `1px solid ${COLORS.lavender}30`,
          boxShadow: "0 2px 12px rgba(26,15,46,0.04)",
        }}>
          <h3 style={{
            margin: "0 0 12px", fontSize: 15, fontWeight: 800,
            color: COLORS.darkIndigo, display: "flex", alignItems: "center", gap: 6,
          }}>
            <FiInfo size={16} color={COLORS.mauve} /> Available Placeholders
          </h3>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: COLORS.mauve }}>
            Click a placeholder to insert it into your template. These will be replaced
            with actual data when sending.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {placeholders.map((p) => (
              <button
                key={p.key}
                onClick={() => insertPlaceholder(p.key)}
                title={p.example ? `Example: ${p.example}` : undefined}
                style={{
                  padding: "6px 12px", borderRadius: 8,
                  border: "1px solid #25D36640", background: "#25D36608",
                  color: "#25D366", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s",
                }}
              >
                {`{${p.key}}`}
                <span style={{ color: COLORS.mauve, fontWeight: 400, marginLeft: 4 }}>
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Template editor ── */}
        <div style={{
          background: COLORS.white, borderRadius: 16, padding: "24px 28px",
          border: `1px solid ${COLORS.lavender}30`,
          boxShadow: "0 2px 12px rgba(26,15,46,0.04)",
        }}>
          <h3 style={{
            margin: "0 0 16px", fontSize: 16, fontWeight: 800,
            color: COLORS.darkIndigo, display: "flex", alignItems: "center", gap: 6,
          }}>
            <FiMessageSquare size={18} color="#25D366" /> Your Template
          </h3>

          {msg && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 16,
              background: msg.ok ? "#27AE6015" : COLORS.dangerLight,
              color: msg.ok ? "#27AE60" : COLORS.danger,
              fontSize: 13, fontWeight: 600,
            }}>
              {msg.text}
            </div>
          )}

          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>
              Loading template...
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <textarea
                value={currentText}
                onChange={(e) => setText(e.target.value)}
                rows={16}
                placeholder={
                  "Type your WhatsApp message template here...\n\n" +
                  "Use placeholders like {lead_name}, {user_name} etc."
                }
                style={{
                  width: "100%", border: `1.5px solid ${COLORS.lavender}60`,
                  borderRadius: 12, padding: "14px 16px", fontSize: 13,
                  color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif",
                  resize: "vertical", boxSizing: "border-box",
                  marginBottom: 16, lineHeight: 1.7, outline: "none",
                }}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1, display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 6,
                    padding: "12px 0", borderRadius: 10, border: "none",
                    background: saving
                      ? COLORS.lavender
                      : "linear-gradient(135deg, #25D366, #128C7E)",
                    color: "#fff", fontSize: 14, fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <FiSave size={16} /> {saving ? "Saving..." : "Save Template"}
                </button>

                {template && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 6,
                      padding: "12px 20px", borderRadius: 10,
                      border: `1.5px solid ${COLORS.danger}40`,
                      background: "transparent", color: COLORS.danger,
                      fontSize: 13, fontWeight: 700,
                      cursor: deleting ? "not-allowed" : "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <FiTrash2 size={14} /> {deleting ? "..." : "Delete"}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}