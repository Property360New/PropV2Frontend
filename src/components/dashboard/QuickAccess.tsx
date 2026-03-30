"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COLORS } from "@/lib/colors";
import { FiUsers, FiPackage, FiTarget, FiBarChart2, FiLayers,  } from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";

const QUICK_ACCESS = [
  { icon: FiUsers, label: "Customers", desc: "View and manage customers", color: COLORS.mauve, path: "/customers" },
  { icon: FiPackage, label: "Inventory", desc: "View and manage inventory", color: "#3498DB", path: "/inventory" },
  { icon: FiTarget, label: "Target vs Achievement", desc: "Track performance", color: COLORS.gold, path: "/targets" },
  { icon: FiBarChart2, label: "Reports", desc: "View and manage reports", color: "#27AE60", path: "/reports" },
  { icon: FiLayers, label: "Project Details", desc: "View project details", color: "#8E44AD", path: "/projects" },
  { icon: TbCurrencyRupee, label: "Expenses", desc: "View and manage expenses", color: "#E67E22", path: "/expenses" },
];

function QuickAccessCard({
  icon: Icon, label, desc, color, path, index,
}: {
  icon: typeof FiUsers; label: string; desc: string;
  color: string; path: string; index: number;
}) {
  const [hov, setHov] = useState(false);
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(path)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: COLORS.white,
        borderRadius: 16, padding: "28px 20px 24px",
        textAlign: "center", cursor: "pointer",
        border: `1px solid ${COLORS.lavender}40`,
        boxShadow: hov ? `0 12px 32px ${color}20` : "0 2px 8px rgba(26,15,46,0.04)",
        transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
        transform: hov ? "translateY(-6px)" : "none",
        position: "relative", overflow: "hidden",
        animation: `fadeSlideIn 0.5s ease ${0.3 + index * 0.08}s both`,
      }}
    >
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: hov ? 4 : 0,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          transition: "height 0.3s",
        }}
      />
      <div
        style={{
          width: 56, height: 56, borderRadius: 16,
          background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px",
          transition: "transform 0.4s",
          transform: hov ? "scale(1.12) rotate(-3deg)" : "none",
          border: `1px solid ${color}20`,
        }}
      >
        <Icon size={26} color={color} />
      </div>
      <div
        style={{
          fontSize: 14, fontWeight: 700, color: COLORS.darkIndigo,
          marginBottom: 4, fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 11.5, color: COLORS.mauve, opacity: 0.7, lineHeight: 1.4,
        }}
      >
        {desc}
      </div>
    </div>
  );
}

export default function QuickAccess() {
  return (
    <div>
      <h2
        style={{
          margin: "0 0 18px", fontSize: 22, fontWeight: 800,
          fontFamily: "'Playfair Display', Georgia, serif",
          color: COLORS.darkIndigo,
          animation: "fadeSlideIn 0.5s ease 0.25s both",
        }}
      >
        Quick Access
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {QUICK_ACCESS.map((item, i) => (
          <QuickAccessCard key={item.label} {...item} index={i} />
        ))}
      </div>
    </div>
  );
}
