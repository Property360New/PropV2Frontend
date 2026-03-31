"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { COLORS } from "@/lib/colors";
import { useGetNotificationsQuery } from "@/store/notifications.api";
import { useGetEmployeeDetailQuery } from "@/store/hierarchy.api";
import { useGetTodayCelebrationsQuery } from "@/store/leads.api";
import { FiX, FiUser, FiUsers } from "react-icons/fi";
import type { AppNotification } from "@/types";

// ── helpers ────────────────────────────────────────────────

function openWhatsAppWish(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, "");
  const intl = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
  window.open(`https://wa.me/${intl}?text=${encodeURIComponent(message)}`, "_blank");
}


function WishModal({
  name,
  phone,
  designation,
  type,
  onClose,
}: {
  name: string;
  phone: string | null;
  designation?: string;
  type: "BIRTHDAY" | "ANNIVERSARY";
  onClose: () => void;
}) {
  const isBirthday = type === "BIRTHDAY";
  const accent     = isBirthday ? "#E74C3C" : "#8E44AD";
  const lightBg    = isBirthday ? "#FFF5F5" : "#FDF5FF";
  const emoji      = isBirthday ? "🎂" : "💍";

  const shapes = isBirthday
    ? ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"]
    : ["#DDA0DD", "#FFB6C1", "#E6E6FA", "#C8A2C8", "#D8BFD8", "#EE82EE"];

  const [msg, setMsg] = useState(
  isBirthday
    ? `Dear *${name}* ji,\nA very Happy Birthday to you! 🎉\n\nOn behalf of Property 360 Degree Pvt. Ltd., we extend our warmest wishes for your continued success, excellent health, and a life filled with exclusive achievements.\n\nYour trust and association mean a lot to us. We truly appreciate the opportunity to serve you and look forward to strengthening this relationship further.\n\nHave a wonderful year ahead!\n\nWarm Regards,\nTeam Property 360 Degree Pvt. Ltd.\n📞 9873280984`
    : `Dear *${name}* ji,\nWarmest Wishes on your Wedding Anniversary! 💐\n\nOn behalf of Property 360 Degree Pvt. Ltd., we extend our heartfelt congratulations to you and your better half on this beautiful occasion. May your journey together continue to be filled with happiness, success, and cherished moments.\n\nWe truly value our association with you and wish you both a lifetime of togetherness and prosperity.\n\nWarm Regards,\nTeam Property 360 Degree Pvt. Ltd.\n📞 9873280984`
);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: "rgba(26,15,46,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(8px)", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(520px, 100%)",
        animation: "wishModalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <div style={{
          background: lightBg, borderRadius: 24, overflow: "hidden",
          boxShadow: `0 32px 80px ${accent}30, 0 8px 24px rgba(0,0,0,0.15)`,
          position: "relative",
        }}>
          {/* Top band */}
          <div style={{
            height: 120,
            background: `linear-gradient(135deg, ${accent}E0, ${accent}90)`,
            position: "relative", overflow: "hidden",
          }}>
            {shapes.map((color, i) => (
              <div key={i} style={{
                position: "absolute",
                width: [28, 18, 22, 14, 32, 16][i],
                height: [28, 18, 22, 14, 32, 16][i],
                borderRadius: "50%", background: color, opacity: 0.7,
                top: [20, 55, 10, 70, 40, 85][i],
                left: [`8%`, `18%`, `35%`, `50%`, `68%`, `82%`][i],
                animation: `floatBubble${i} ${[3.2,2.8,3.5,2.5,3.8,2.2][i]}s ease-in-out infinite`,
              }} />
            ))}
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 56, lineHeight: 1,
              animation: "bounceEmoji 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.15s both",
            }}>
              {emoji}
            </div>
            <button onClick={onClose} style={{
              position: "absolute", top: 12, right: 12,
              background: "rgba(255,255,255,0.25)", border: "none",
              borderRadius: 8, width: 30, height: 30, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", backdropFilter: "blur(4px)",
            }}>
              <FiX size={14} />
            </button>
          </div>

          <div style={{ padding: "20px 28px 28px" }}>
            {/* Person info chip */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
              padding: "10px 14px", borderRadius: 12,
              background: `${accent}08`, border: `1px solid ${accent}18`,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: `linear-gradient(135deg, ${accent}40, ${accent}20)`,
                color: accent, fontWeight: 800, fontSize: 15,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1.5px solid ${accent}30`,
              }}>
                {name[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a0f2e" }}>{name}</div>
                {designation && (
                  <div style={{ fontSize: 11, color: "#7a6a8a", marginTop: 1 }}>
                    {designation.replace(/_/g, " ")}
                    {phone && <span style={{ marginLeft: 6 }}>· {phone}</span>}
                  </div>
                )}
                {!designation && phone && (
                  <div style={{ fontSize: 11, color: "#7a6a8a", marginTop: 1 }}>{phone}</div>
                )}
              </div>
              <div style={{ fontSize: 20, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}12`, borderRadius: 10 }}>
                {emoji}
              </div>
            </div>

            {/* Message card */}
            <div style={{ borderRadius: 14, overflow: "hidden", border: `1.5px solid ${accent}20`, marginBottom: 14, boxShadow: `0 4px 16px ${accent}12` }}>
              <div style={{ padding: "8px 14px", background: `linear-gradient(135deg, ${accent}18, ${accent}08)`, borderBottom: `1px solid ${accent}15`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#25D366", boxShadow: "0 0 0 2px #25D36630" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#5a4a6a", textTransform: "uppercase", letterSpacing: "0.5px" }}>WhatsApp Message Preview</span>
                </div>
                <button onClick={handleCopy} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, border: `1px solid ${accent}30`, background: copied ? "#25D36615" : `${accent}08`, color: copied ? "#25D366" : accent, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <div style={{ padding: "12px 14px", background: "#ECE5DD" }}>
                <div style={{ background: "#fff", borderRadius: "12px 12px 12px 4px", padding: "10px 14px", maxWidth: "85%", boxShadow: "0 1px 2px rgba(0,0,0,0.12)", fontSize: 13, lineHeight: 1.6, color: "#1a1a1a", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {msg}
                  <div style={{ fontSize: 10, color: "#9a9a9a", marginTop: 4, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                    {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5L4.5 8.5L9 3" stroke="#34B7F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 5L8.5 8.5L13 3" stroke="#34B7F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
              <div style={{ padding: "10px 12px", background: "#fff", borderTop: `1px solid ${accent}10` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9a8aaa", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Edit message</div>
                <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} style={{ width: "100%", borderRadius: 8, padding: "8px 10px", border: `1.5px solid ${accent}20`, fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: "#1a0f2e", resize: "none", boxSizing: "border-box", lineHeight: 1.5, background: lightBg, outline: "none" }} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              {phone ? (
                <button onClick={() => openWhatsAppWish(phone, msg)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #25D366, #1DA851)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px #25D36640" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.122 1.528 5.855L.057 23.882l6.244-1.636A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.36-.213-3.706.972.988-3.614-.234-.372A9.818 9.818 0 1112 21.818z"/></svg>
                  Open in WhatsApp
                </button>
              ) : (
                <div style={{ flex: 1, padding: "13px 0", borderRadius: 12, textAlign: "center", background: "#f0eef5", color: "#9a8aaa", fontSize: 13, fontWeight: 600 }}>No phone number on file</div>
              )}
              <button onClick={onClose} style={{ padding: "13px 18px", borderRadius: 12, border: "1.5px solid #e0d8ec", background: "#fff", color: "#7a6a8a", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                Later
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wishModalIn { from{opacity:0;transform:scale(0.88) translateY(24px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes bounceEmoji { from{opacity:0;transform:scale(0.3) rotate(-20deg)} to{opacity:1;transform:scale(1) rotate(0deg)} }
        @keyframes floatBubble0{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes floatBubble1{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes floatBubble2{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes floatBubble3{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes floatBubble4{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes floatBubble5{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
      `}</style>
    </div>,
    document.body
  );
}

// ─ EmployeeWishCard — 

function EmployeeWishCard({
  notification,
  onWishClick,
}: {
  notification: AppNotification;
  onWishClick: () => void;
}) {
  const employeeId = (notification.metadata as any)?.employeeId as string | undefined;
  const { data: emp } = useGetEmployeeDetailQuery(employeeId ?? "", { skip: !employeeId });

  const isBirthday = notification.type === "BIRTHDAY";
  const accent = isBirthday ? "#E74C3C" : "#8E44AD";
  const empName = emp ? `${emp.firstName} ${emp.lastName ?? ""}`.trim() : "Loading...";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: `1px solid ${accent}20`, background: `${accent}04` }}>
      <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: `${accent}18`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>
        {emp ? `${emp.firstName[0]}${emp.lastName?.[0] ?? ""}` : "?"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.darkIndigo }}>{empName}</div>
        <div style={{ fontSize: 11, color: COLORS.mauve, marginTop: 1 }}>
          {isBirthday ? "🎂 Birthday today" : "💍 Anniversary today"}
          {emp?.designation && ` · ${emp.designation.replace(/_/g, " ")}`}
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onWishClick(); }} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${accent}, ${accent}CC)`, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: `0 2px 8px ${accent}30`, whiteSpace: "nowrap" }}>
        Wish 🎉
      </button>
    </div>
  );
}

// ── LeadWishCard ──

function LeadWishCard({
  name,
  phone,
  type,
  onWishClick,
}: {
  name: string;
  phone: string;
  type: "BIRTHDAY" | "ANNIVERSARY";
  onWishClick: () => void;
}) {
  const isBirthday = type === "BIRTHDAY";
  const accent = isBirthday ? "#E74C3C" : "#8E44AD";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: `1px solid ${accent}20`, background: `${accent}04` }}>
      <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: `${accent}18`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>
        {name[0]?.toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.darkIndigo }}>{name}</div>
        <div style={{ fontSize: 11, color: COLORS.mauve, marginTop: 1 }}>
          {isBirthday ? "🎂 Client birthday today" : "💍 Client anniversary today"}
          {phone && <span style={{ marginLeft: 4 }}>· {phone}</span>}
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onWishClick(); }} style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${accent}, ${accent}CC)`, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: `0 2px 8px ${accent}30`, whiteSpace: "nowrap" }}>
        Wish 🎉
      </button>
    </div>
  );
}

// ── Main SpecialDayBadge ──

type ActiveWish =
  | { kind: "employee"; notification: AppNotification }
  | { kind: "lead"; name: string; phone: string; type: "BIRTHDAY" | "ANNIVERSARY" };

export default function SpecialDayBadge() {
  const { data: notifData } = useGetNotificationsQuery({ page: 1, limit: 100 });
  const { data: leadCelebrations = [] } = useGetTodayCelebrationsQuery();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeWish, setActiveWish] = useState<ActiveWish | null>(null);
  const [activeTab, setActiveTab] = useState<"employees" | "leads">("employees");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const dropdown = document.getElementById("special-day-dropdown");
      if (btnRef.current?.contains(e.target as Node) || dropdown?.contains(e.target as Node)) return;
      setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const employeeSpecials = (notifData?.data ?? []).filter(
    (n) => n.type === "BIRTHDAY" || n.type === "ANNIVERSARY"
  );
  // Filter to only employee notifications (not lead ones) — lead ones have metadata.isLead=true
  const employeeNotifs = employeeSpecials.filter((n) => !(n.metadata as any)?.isLead);

  const totalCount = employeeNotifs.length + leadCelebrations.length;

  const handleToggle = () => {
    if (!dropdownOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      // Auto-switch to whichever tab has items
      if (employeeNotifs.length === 0 && leadCelebrations.length > 0) setActiveTab("leads");
      else setActiveTab("employees");
    }
    setDropdownOpen((x) => !x);
  };

  if (totalCount === 0) return null;

  const birthdays    = employeeNotifs.filter((n) => n.type === "BIRTHDAY");
  const anniversaries = employeeNotifs.filter((n) => n.type === "ANNIVERSARY");
  const label = totalCount > 1 ? `${totalCount} celebrations` : birthdays.length > 0 ? "Birthday today" : anniversaries.length > 0 ? "Anniversary today" : "Client celebration";

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 12px", borderRadius: 10,
          border: "1.5px solid rgba(255,255,255,0.25)",
          background: dropdownOpen ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)",
          color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700,
          fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", position: "relative",
        }}
      >
        <span style={{ fontSize: 14 }}>
          {(birthdays.length > 0 || leadCelebrations.some(l => l.type === "BIRTHDAY")) && "🎂"}
          {(anniversaries.length > 0 || leadCelebrations.some(l => l.type === "ANNIVERSARY")) && "💍"}
        </span>
        <span>{label}</span>
        <span style={{
          position: "absolute", top: -5, right: -5, width: 17, height: 17, borderRadius: "50%",
          background: "#E74C3C", color: "#fff", fontSize: 9, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid rgba(26,15,46,0.7)",
        }}>
          {totalCount}
        </span>
      </button>

      {/* Dropdown — portal */}
      {dropdownOpen && mounted && createPortal(
        <div
          id="special-day-dropdown"
          style={{
            position: "fixed", top: dropdownPos.top, right: dropdownPos.right,
            zIndex: 9998, width: 340, background: "#fff", borderRadius: 16,
            boxShadow: "0 16px 48px rgba(26,15,46,0.20)",
            border: `1px solid ${COLORS.lavender}30`, overflow: "hidden",
            animation: "sdDropIn 0.18s ease both",
          }}
        >
          {/* Header */}
          <div style={{ padding: "14px 16px 12px", background: `linear-gradient(135deg, ${COLORS.darkIndigo}, #2D1B4E)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>🎊 Today's Celebrations</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                {totalCount} celebration{totalCount > 1 ? "s" : ""} today
              </div>
            </div>
            <button onClick={() => setDropdownOpen(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 7, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <FiX size={13} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.lavender}25`, background: "#faf9fc" }}>
            {[
              { key: "employees" as const, icon: <FiUsers size={12} />, label: "Team", count: employeeNotifs.length },
              { key: "leads"     as const, icon: <FiUser  size={12} />, label: "Clients", count: leadCelebrations.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "10px 0", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  background: activeTab === tab.key ? "#fff" : "transparent",
                  color: activeTab === tab.key ? COLORS.darkIndigo : COLORS.mauve,
                  borderBottom: activeTab === tab.key ? `2px solid ${COLORS.gold}` : "2px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                {tab.icon}
                {tab.label}
                <span style={{
                  background: activeTab === tab.key ? COLORS.gold : `${COLORS.mauve}20`,
                  color: activeTab === tab.key ? "#fff" : COLORS.mauve,
                  fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10,
                  minWidth: 16, textAlign: "center",
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
            {activeTab === "employees" && (
              employeeNotifs.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: COLORS.mauve, fontSize: 13 }}>
                  No team birthdays or anniversaries today
                </div>
              ) : (
                employeeNotifs.map((n) => (
                  <EmployeeWishCard
                    key={n.id}
                    notification={n}
                    onWishClick={() => {
                      setDropdownOpen(false);
                      setActiveWish({ kind: "employee", notification: n });
                    }}
                  />
                ))
              )
            )}

            {activeTab === "leads" && (
              leadCelebrations.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: COLORS.mauve, fontSize: 13 }}>
                  No client birthdays or anniversaries today
                </div>
              ) : (
                leadCelebrations.map((c, i) => (
                  <LeadWishCard
                    key={`${c.leadId}-${c.type}-${i}`}
                    name={c.name}
                    phone={c.phone}
                    type={c.type}
                    onWishClick={() => {
                      setDropdownOpen(false);
                      setActiveWish({ kind: "lead", name: c.name, phone: c.phone, type: c.type });
                    }}
                  />
                ))
              )
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Wish modal */}
      {activeWish && mounted && (
        activeWish.kind === "employee" ? (() => {
          const employeeId = (activeWish.notification.metadata as any)?.employeeId as string;
          // We need the employee data — use a thin wrapper
          return <EmployeeWishModalWrapper notification={activeWish.notification} onClose={() => setActiveWish(null)} />;
        })() : (
          <WishModal
            name={activeWish.name}
            phone={activeWish.phone}
            type={activeWish.type}
            onClose={() => setActiveWish(null)}
          />
        )
      )}

      <style>{`
        @keyframes sdDropIn {
          from{opacity:0;transform:translateY(-8px) scale(0.97)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
      `}</style>
    </>
  );
}

// Thin wrapper so employee WishModal can fetch its own data
function EmployeeWishModalWrapper({ notification, onClose }: { notification: AppNotification; onClose: () => void }) {
  const employeeId = (notification.metadata as any)?.employeeId as string | undefined;
  const { data: emp } = useGetEmployeeDetailQuery(employeeId ?? "", { skip: !employeeId });
  if (!emp) return null;
  return (
    <WishModal
      name={`${emp.firstName} ${emp.lastName ?? ""}`.trim()}
      phone={emp.phone ?? null}
      designation={emp.designation}
      type={notification.type as "BIRTHDAY" | "ANNIVERSARY"}
      onClose={onClose}
    />
  );
}