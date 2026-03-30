"use client";

import { useGetNotificationStripQuery } from "@/store/leads.api";
import { COLORS } from "@/lib/colors";

function formatDaysAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function AlertTicker() {
  const { data: strip = [] } = useGetNotificationStripQuery();

  if (!strip.length) return null;

  return (
    <div
      style={{
        display: "flex", gap: 12, overflowX: "auto",
        padding: "4px 0", scrollbarWidth: "none",
      }}
    >
      {strip.map((item) => {
        const isDanger = !item.hasSale;
        return (
          <div
            key={item.employeeId}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 10,
              background: isDanger
                ? `linear-gradient(135deg, ${COLORS.danger}15, ${COLORS.danger}08)`
                : `linear-gradient(135deg, ${COLORS.gold}15, ${COLORS.gold}08)`,
              border: `1px solid ${isDanger ? COLORS.danger + "30" : COLORS.gold + "30"}`,
              whiteSpace: "nowrap", flexShrink: 0,
              fontSize: 12, fontWeight: 600, color: COLORS.darkIndigo,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <span
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: isDanger ? COLORS.danger : COLORS.gold,
                flexShrink: 0,
              }}
            />
            {item.hasSale
              ? `${item.employeeName} made a sale ${formatDaysAgo(item.lastSaleAt)}, cheers!`
              : item.lastSaleAt
                ? `${item.employeeName} hasn't made any sale since ${formatDate(item.lastSaleAt)} (${formatDaysAgo(item.lastSaleAt)})`
                : `${item.employeeName} hasn't made any sales yet`}
          </div>
        );
      })}
    </div>
  );
}
