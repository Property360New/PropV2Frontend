"use client";

import { useState, useEffect, useRef } from "react";
import { COLORS } from "@/lib/colors";
import { FiBell, FiX, FiCheck, FiCheckCircle } from "react-icons/fi";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "@/store/notifications.api";
import type { AppNotification } from "@/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const TYPE_COLORS: Record<string, string> = {
  SALE_DONE: COLORS.success,
  TARGET_ALERT: COLORS.danger,
  LEAD_ASSIGNED: COLORS.mauve,
  FOLLOWUP_REMINDER: COLORS.gold,
  BIRTHDAY: "#E91E63",
  ANNIVERSARY: "#FF9800",
  SYSTEM: COLORS.darkIndigo,
};

export default function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useGetNotificationsQuery(
    { page: 1, limit: 50 },
    { skip: !open }
  );
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const notifications: AppNotification[] = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.2)",
          zIndex: 998,
          transition: "opacity 0.3s",
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 400,
          maxWidth: "100vw",
          height: "100vh",
          background: COLORS.white,
          zIndex: 999,
          boxShadow: "-4px 0 24px rgba(26,15,46,0.12)",
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${COLORS.lavender}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: `linear-gradient(135deg, ${COLORS.white}, ${COLORS.lavenderLight})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiBell size={20} color={COLORS.danger} />
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: COLORS.darkIndigo,
                fontFamily: "'Playfair Display', Georgia, serif",
              }}
            >
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span
                style={{
                  background: COLORS.danger,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 10,
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.lavender}50`,
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  color: COLORS.mauve,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <FiCheckCircle size={12} />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: `${COLORS.lavender}30`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiX size={16} color={COLORS.darkIndigo} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {isLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: COLORS.mauve,
                fontSize: 14,
              }}
            >
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                color: COLORS.mauve,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              No notifications
            </div>
          ) : (
            notifications.map((noti, idx) => {
              const isUnread = !noti.readAt;
              const typeColor =
                TYPE_COLORS[noti.type] || COLORS.mauve;
              // Use recipientId as key (unique per recipient), fall back to index
              const key = noti.recipientId || `${noti.id}-${idx}`;

              return (
                <div
                  key={key}
                  onClick={() => {
                    // Only mark as read if it's your own notification
                    if (isUnread && noti.isOwnNotification !== false) markAsRead(noti.id);
                  }}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    marginBottom: 8,
                    background: isUnread
                      ? `${typeColor}08`
                      : COLORS.white,
                    border: `1px solid ${isUnread ? `${typeColor}25` : `${COLORS.lavender}30`}`,
                    cursor: isUnread ? "pointer" : "default",
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                >
                  {/* Unread indicator */}
                  {isUnread && (
                    <div
                      style={{
                        position: "absolute",
                        top: 18,
                        left: 8,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: typeColor,
                      }}
                    />
                  )}
                  <div style={{ paddingLeft: isUnread ? 10 : 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isUnread ? 700 : 600,
                          color: COLORS.darkIndigo,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {noti.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: COLORS.mauve,
                          whiteSpace: "nowrap",
                          marginLeft: 8,
                        }}
                      >
                        {timeAgo(noti.createdAt)}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: `${COLORS.darkIndigo}B0`,
                        lineHeight: 1.4,
                      }}
                    >
                      {noti.message}
                    </p>
                    {/* Show recipient name for subordinate notifications */}
                    {noti.recipientEmployee && noti.isOwnNotification === false && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 10,
                          color: COLORS.mauve,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span style={{
                          padding: "1px 6px", borderRadius: 4,
                          background: `${COLORS.lavender}25`,
                        }}>
                          {noti.recipientEmployee.firstName} {noti.recipientEmployee.lastName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
