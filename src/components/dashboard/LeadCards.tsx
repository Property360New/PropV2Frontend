"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetTabCountsQuery, useGetTodaysFollowupsQuery } from "@/store/leads.api";
import { COLORS } from "@/lib/colors";

const LEAD_CARD_CONFIG = [
  { key: "FRESH", icon: "👥", label: "Fresh Leads", color: COLORS.mauve, leadsTab: "FRESH" },
  { key: "TODAYS_FOLLOWUP", icon: "📞", label: "Today's Follow-Up", color: COLORS.gold, highlight: true, leadsTab: "FOLLOW_UP" },
  { key: "VISIT_DONE", icon: "🏠", label: "Visit", color: "#3498DB", leadsTab: "VISIT_DONE" },
  { key: "SWITCH_OFF", icon: "📴", label: "Switch Off", color: "#95A5A6", leadsTab: "SWITCH_OFF" },
  { key: "CALL_BACK", icon: "📱", label: "Call Back", color: "#27AE60", leadsTab: "CALL_BACK" },
  { key: "FOLLOW_UP", icon: "🔁", label: "Follow-Up", color: "#8E44AD", leadsTab: "FOLLOW_UP" },
  { key: "MEETING_DONE", icon: "🤝", label: "Meeting", color: "#2980B9", leadsTab: "MEETING_DONE" },
  { key: "WRONG_NUMBER", icon: "❌", label: "Wrong Number", color: COLORS.danger, leadsTab: "WRONG_NUMBER" },
  { key: "RINGING", icon: "📳", label: "Ringing", color: "#E67E22", leadsTab: "RINGING" },
  { key: "DEAL_DONE", icon: "🤑", label: "Deal", color: COLORS.gold, leadsTab: "DEAL_DONE" },
  { key: "NOT_INTERESTED", icon: "🚫", label: "Not Interested", color: "#7F8C8D", leadsTab: "NOT_INTERESTED" },
  { key: "HOT_PROSPECT", icon: "🔥", label: "Hot Prospect", color: "#E74C3C", leadsTab: "HOT_PROSPECT" },
  { key: "SUSPECT", icon: "🕵️", label: "Suspect", color: "#9B59B6", leadsTab: "SUSPECT" },
];

function LeadCard({
  icon, label, count, color, highlight, index, onClick,
}: {
  icon: string; label: string; count: number; color: string;
  highlight?: boolean; index: number; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: COLORS.white,
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "pointer",
        border: highlight ? `1.5px solid ${COLORS.gold}` : `1px solid ${COLORS.lavender}40`,
        boxShadow: hov
          ? `0 8px 24px ${color}20, 0 0 0 2px ${color}20`
          : highlight
            ? `0 2px 12px ${COLORS.gold}15`
            : "0 1px 4px rgba(26,15,46,0.04)",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hov ? "translateY(-3px)" : "none",
        position: "relative", overflow: "hidden",
        animation: `fadeSlideIn 0.4s ease ${index * 0.04}s both`,
      }}
    >
      {highlight && (
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.goldLight})`,
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${color}12`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
            transition: "transform 0.3s",
            transform: hov ? "scale(1.1) rotate(-5deg)" : "none",
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: 13.5, fontWeight: 700, color: COLORS.darkIndigo,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 11, color: COLORS.mauve, marginTop: 2, opacity: 0.7,
            }}
          >
            Click to view details
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: highlight && count > 0 ? 26 : 22,
          fontWeight: 800,
          color: count > 0 ? color : "#BDB5C7",
          fontFamily: "'Playfair Display', Georgia, serif",
          minWidth: 32, textAlign: "right",
          transition: "all 0.3s",
          transform: hov && count > 0 ? "scale(1.15)" : "none",
        }}
      >
        {count}
      </div>
    </div>
  );
}

export default function LeadCards({
  onTodaysFollowupClick,
  staffId,
}: {
  onTodaysFollowupClick?: () => void;
  staffId?: string;
} = {}) {
  const router = useRouter();
  const tabCountsParams = staffId ? { assignedToId: staffId } : undefined;
  const { data: tabCounts, isLoading: loadingCounts } = useGetTabCountsQuery(tabCountsParams);
  const { data: todaysFollowups = [] } = useGetTodaysFollowupsQuery();

  const handleCardClick = (card: typeof LEAD_CARD_CONFIG[number]) => {
    if (card.key === "TODAYS_FOLLOWUP") {
      onTodaysFollowupClick?.();
      return;
    }
    router.push(`/leads?status=${card.leadsTab}`);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
      {LEAD_CARD_CONFIG.map((card, i) => {
        let count = 0;
        if (card.key === "TODAYS_FOLLOWUP") {
          count = todaysFollowups.length;
        } else if (tabCounts) {
          count = tabCounts[card.key] || 0;
        }
        return (
          <LeadCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            count={loadingCounts ? 0 : count}
            color={card.color}
            highlight={card.highlight}
            index={i}
            onClick={() => handleCardClick(card)}
          />
        );
      })}
    </div>
  );
}
