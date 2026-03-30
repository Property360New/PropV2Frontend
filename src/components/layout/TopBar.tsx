"use client";

import { useState } from "react";
import { COLORS } from "@/lib/colors";
import { FiBell } from "react-icons/fi";
import { useGetUnreadCountQuery } from "@/store/notifications.api";
import NotificationPanel from "@/components/dashboard/NotificationPanel";

interface TopBarProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function TopBar({ title, subtitle, children }: TopBarProps) {
  const { data: unreadCount = 0 } = useGetUnreadCountQuery();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <div
        style={{
          background: `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.lavenderLight} 100%)`,
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${COLORS.lavender}40`,
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0, fontSize: 24, fontWeight: 900,
              fontFamily: "'Playfair Display', Georgia, serif",
              color: COLORS.darkIndigo, letterSpacing: "-0.3px",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p style={{ margin: "2px 0 0", fontSize: 13, color: COLORS.mauve, fontWeight: 500 }}>
              {subtitle}
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {children}
          {/* Notification bell */}
          <div
            onClick={() => setNotifOpen(true)}
            style={{
              width: 42, height: 42, borderRadius: 12,
              background: COLORS.white,
              border: `1px solid ${COLORS.lavender}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative",
              boxShadow: "0 1px 4px rgba(26,15,46,0.06)",
            }}
          >
            <FiBell size={18} color={COLORS.darkIndigo} />
            {unreadCount > 0 && (
              <div
                style={{
                  position: "absolute", top: 6, right: 6,
                  minWidth: 8, height: 8, borderRadius: "50%",
                  background: COLORS.danger,
                  border: `2px solid ${COLORS.white}`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
