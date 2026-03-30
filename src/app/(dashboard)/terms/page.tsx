"use client";

import { useState, FormEvent } from "react";
import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import { useGetLatestTermsQuery, useGetTermsHistoryQuery, usePublishTermsMutation, useAcceptTermsMutation, useGetNeedsAcceptanceQuery } from "@/store/terms.api";
import { useGetProfileQuery } from "@/store/auth.api";
import { FiFileText, FiCheck, FiPlus, FiX, FiClock } from "react-icons/fi";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TermsPage() {
  const { data: profile } = useGetProfileQuery();
  const isAdmin = profile?.designation === "ADMIN";
  const { data: latest, isLoading } = useGetLatestTermsQuery();
  const { data: history } = useGetTermsHistoryQuery(undefined, { skip: !isAdmin });
  const { data: acceptance } = useGetNeedsAcceptanceQuery();
  const [acceptTerms, { isLoading: accepting }] = useAcceptTermsMutation();
  const [showEdit, setShowEdit] = useState(false);

  const handleAccept = async () => {
    try {
      await acceptTerms({ termsId: latest?.id }).unwrap();
    } catch { alert("Failed to accept terms."); }
  };

  return (
    <>
      <TopBar title="Terms & Conditions" subtitle="Company terms of service" >
        <TutorialButton videoUrl={TUTORIALS.terms} />
      </TopBar>

      <div style={{ padding: "24px 32px", maxWidth: 900, margin: "0 auto" }}>
        {/* Accept Banner */}
        {acceptance?.mustAccept && (
          <div style={{
            background: `${COLORS.gold}10`, border: `2px solid ${COLORS.gold}40`, borderRadius: 14,
            padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkIndigo }}>
              You must accept the latest terms and conditions to continue using the CRM.
            </div>
            <button onClick={handleAccept} disabled={accepting} style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: accepting ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6,
            }}>
              <FiCheck size={14} /> {accepting ? "Accepting..." : "Accept Terms"}
            </button>
          </div>
        )}

        {/* Admin: Edit/Publish */}
        {isAdmin && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <button onClick={() => setShowEdit(true)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>
              <FiPlus size={16} /> Publish New Version
            </button>
          </div>
        )}

        {/* Current Terms */}
        <div style={{
          background: COLORS.white, borderRadius: 16, padding: "28px 32px",
          border: `1px solid ${COLORS.lavender}30`, boxShadow: "0 2px 12px rgba(26,15,46,0.04)", marginBottom: 24,
        }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>Loading...</div>
          ) : !latest ? (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.mauve }}>No terms and conditions published yet.</div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FiFileText size={18} color={COLORS.mauve} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkIndigo }}>Version {latest.version}</span>
                </div>
                <span style={{ fontSize: 12, color: COLORS.mauve, display: "flex", alignItems: "center", gap: 4 }}>
                  <FiClock size={12} /> {formatDate(latest.createdAt)}
                </span>
              </div>
              <div
                style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.darkIndigo, whiteSpace: "pre-wrap" }}
                dangerouslySetInnerHTML={{ __html: latest.content }}
              />
            </>
          )}
        </div>

        {/* Version History (Admin) */}
        {isAdmin && history && history.length > 1 && (
          <div style={{
            background: COLORS.white, borderRadius: 16, padding: "20px 24px",
            border: `1px solid ${COLORS.lavender}30`,
          }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: COLORS.darkIndigo }}>Version History</h3>
            {history.map(t => (
              <div key={t.id} style={{
                padding: "10px 14px", borderBottom: `1px solid ${COLORS.lavender}15`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.darkIndigo }}>
                  Version {t.version} {t.isActive && <span style={{ color: COLORS.success, fontSize: 11 }}>(Active)</span>}
                </span>
                <span style={{ fontSize: 12, color: COLORS.mauve }}>{formatDate(t.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEdit && <PublishTermsModal onClose={() => setShowEdit(false)} existing={latest?.content || ""} />}
    </>
  );
}

function PublishTermsModal({ onClose, existing }: { onClose: () => void; existing: string }) {
  const [publish, { isLoading }] = usePublishTermsMutation();
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
        <h2 style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display', Georgia, serif", color: COLORS.darkIndigo }}>Publish New Terms</h2>
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
