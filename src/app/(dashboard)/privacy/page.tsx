"use client";

import { useState, FormEvent } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import { useGetLatestPrivacyQuery, usePublishPrivacyMutation } from "@/store/terms.api";
import { useGetProfileQuery } from "@/store/auth.api";
import { FiShield, FiEdit2, FiX, FiClock } from "react-icons/fi";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PrivacyPolicyPage() {
  const { data: profile } = useGetProfileQuery();
  const isAdmin = profile?.designation === "ADMIN";
  const { data: policy, isLoading } = useGetLatestPrivacyQuery();
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <TopBar title="Privacy Policy" subtitle="Company privacy policy" />

      <div style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto" }}>
        {isAdmin && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <button onClick={() => setShowEdit(true)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>
              <FiEdit2 size={14} /> Edit Policy
            </button>
          </div>
        )}

        <div style={{
          background: COLORS.white, borderRadius: 16, padding: "28px 32px",
          border: `1px solid ${COLORS.lavender}30`, boxShadow: "0 2px 12px rgba(26,15,46,0.04)",
        }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>Loading...</div>
          ) : !policy || !policy.content ? (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>No privacy policy published yet.</div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FiShield size={18} color={COLORS.mauve} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkIndigo }}>
                    Privacy Policy {policy.version ? `(v${policy.version})` : ""}
                  </span>
                </div>
                {policy.updatedAt && (
                  <span style={{ fontSize: 12, color: COLORS.mauve, display: "flex", alignItems: "center", gap: 4 }}>
                    <FiClock size={12} /> {formatDate(policy.updatedAt)}
                  </span>
                )}
              </div>
              <div
                style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.darkIndigo, whiteSpace: "pre-wrap" }}
                dangerouslySetInnerHTML={{ __html: policy.content }}
              />
            </>
          )}
        </div>
      </div>

      {showEdit && <EditPolicyModal onClose={() => setShowEdit(false)} existing={policy?.content || ""} />}
    </>
  );
}

function EditPolicyModal({ onClose, existing }: { onClose: () => void; existing: string }) {
  const [publish, { isLoading }] = usePublishPrivacyMutation();
  const [content, setContent] = useState(existing);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try { await publish({ content }).unwrap(); onClose(); }
    catch (err: unknown) { setError((err as { data?: { message?: string } })?.data?.message || "Failed to publish"); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(26,15,46,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: 32, width: 600, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.2)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: COLORS.mauve }}><FiX size={20} /></button>
        <h2 style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif", color: COLORS.darkIndigo }}>Edit Privacy Policy</h2>
        {error && <div style={{ padding: "10px 14px", borderRadius: 8, background: COLORS.dangerLight, color: COLORS.danger, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={16} required style={{
            width: "100%", border: `1.5px solid ${COLORS.lavender}60`, borderRadius: 10, padding: "12px 14px",
            fontSize: 13, color: COLORS.darkIndigo, fontFamily: "'DM Sans', sans-serif", resize: "vertical",
            boxSizing: "border-box", marginBottom: 16,
          }} />
          <button type="submit" disabled={isLoading} style={{
            width: "100%", padding: 13, borderRadius: 10, border: "none",
            background: isLoading ? COLORS.lavender : `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
            color: "#fff", fontSize: 14, fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>{isLoading ? "Publishing..." : "Publish"}</button>
        </form>
      </div>
    </div>
  );
}
