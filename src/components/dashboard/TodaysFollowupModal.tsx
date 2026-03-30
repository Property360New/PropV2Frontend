"use client";

import { useGetTodaysFollowupsQuery } from "@/store/leads.api";
import { COLORS } from "@/lib/colors";
import { FiX, FiPhone, FiBell } from "react-icons/fi";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TodaysFollowupModal({ open, onClose }: Props) {
  const { data: followups = [] } = useGetTodaysFollowupsQuery();

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(26,15,46,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.white, borderRadius: 20,
          width: "90%", maxWidth: 600, maxHeight: "75vh",
          overflow: "hidden", boxShadow: "0 24px 48px rgba(26,15,46,0.2)",
          animation: "fadeSlideIn 0.3s ease both",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            background: `linear-gradient(135deg, ${COLORS.mauve}, ${COLORS.mauveDark || COLORS.mauve})`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiBell size={20} color="#fff" />
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.white, fontFamily: "'Playfair Display', Georgia, serif" }}>
                Today&apos;s Follow-Ups
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.lavenderLight || "#E8D5E0" }}>
                {followups.length} follow-up{followups.length !== 1 ? "s" : ""} scheduled for today
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none",
              borderRadius: 8, width: 32, height: 32, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: COLORS.white, transition: "background 0.2s",
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "16px 24px", overflowY: "auto", maxHeight: "55vh" }}>
          {followups.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: COLORS.mauve, fontSize: 14 }}>
              No follow-ups scheduled for today
            </div>
          ) : (
            followups.map((f, i) => (
              <div
                key={f.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", marginBottom: 8, borderRadius: 12,
                  background: COLORS.pearl, border: `1px solid ${COLORS.lavender}30`,
                  animation: `fadeSlideIn 0.3s ease ${i * 0.05}s both`,
                  transition: "background 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${COLORS.mauve}15`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: COLORS.mauve, flexShrink: 0,
                  }}>
                    {f.lead.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.darkIndigo }}>
                      {f.lead.name}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.mauve, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                      <FiPhone size={11} /> {f.lead.phone}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    padding: "4px 10px", borderRadius: 6,
                    background: `${COLORS.gold}15`, color: COLORS.goldDark,
                    fontSize: 11, fontWeight: 700,
                  }}
                >
                  {f.lead.status.replace(/_/g, " ")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
