"use client";

import { COLORS } from "@/lib/colors";
import TopBar from "@/components/layout/TopBar";
import { useGetHierarchyTreeQuery } from "@/store/hierarchy.api";
import type { HierarchyNode } from "@/types";
import { useState } from "react";
import { FiUsers, FiChevronDown, FiChevronRight } from "react-icons/fi";
import TutorialButton from "@/components/layout/TutorialButton";
import { TUTORIALS } from "@/lib/tutorials";

const DESIG_COLORS: Record<string, string> = {
  ADMIN: "#E74C3C",
  SALES_COORDINATOR: "#8E44AD",
  VP_SALES: "#2980B9",
  GM: "#27AE60",
  DGM: "#16A085",
  AREA_MANAGER: "#E67E22",
  SALES_MANAGER: "#D4A017",
  TEAM_LEAD: "#3498DB",
  SALES_EXECUTIVE: "#9B5E8A",
};

/* ── The rank order so legend displays top→bottom ── */
const RANK_ORDER = [
  "ADMIN", "VP_SALES", "SALES_COORDINATOR", "GM", "DGM",
  "AREA_MANAGER", "SALES_MANAGER", "TEAM_LEAD", "SALES_EXECUTIVE",
];

function getColor(designation: string) {
  return DESIG_COLORS[designation] || COLORS.mauve;
}

/* ─────────────────── Single Node Card ─────────────────── */
function NodeCard({ node, onToggle, expanded, hasChildren }: {
  node: HierarchyNode;
  onToggle: () => void;
  expanded: boolean;
  hasChildren: boolean;
}) {
  const color = getColor(node.designation);
  const initials = `${node.firstName?.[0] || ""}${node.lastName?.[0] || ""}`;

  return (
    <div
      onClick={hasChildren ? onToggle : undefined}
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "14px 18px",
        minWidth: 160,
        maxWidth: 200,
        cursor: hasChildren ? "pointer" : "default",
        border: `1.5px solid ${color}30`,
        boxShadow: `0 3px 12px ${color}12, 0 1px 3px rgba(0,0,0,0.06)`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "box-shadow 0.2s, transform 0.15s",
        position: "relative",
      }}
    >
      {/* Avatar circle */}
      <div style={{
        width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
        background: `linear-gradient(135deg, ${color}, ${color}CC)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `2.5px solid ${color}25`,
        boxShadow: `0 0 0 3px ${color}10`,
      }}>
        {node.avatar ? (
          <img src={node.avatar} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>{initials}</span>
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: COLORS.darkIndigo,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {node.firstName} {node.lastName || ""}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 600, color, textTransform: "uppercase",
          letterSpacing: 0.3, marginTop: 2,
        }}>
          {node.designation.replace(/_/g, " ")}
        </div>
      </div>

      {/* Expand indicator */}
      {hasChildren && (
        <div style={{
          position: "absolute", bottom: -11, left: "50%", transform: "translateX(-50%)",
          width: 22, height: 22, borderRadius: "50%", zIndex: 3,
          background: "#fff", border: `1.5px solid ${color}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}>
          {expanded
            ? <FiChevronDown size={12} color={color} />
            : <FiChevronRight size={12} color={color} />
          }
        </div>
      )}
    </div>
  );
}

/* ───────────── Recursive Tree Node with connectors ───────────── */
function TreeNode({ node, depth = 0 }: { node: HierarchyNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const color = getColor(node.designation);

  return (
    <div className="org-node" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* The card itself */}
      <NodeCard
        node={node}
        onToggle={() => setExpanded(e => !e)}
        expanded={expanded}
        hasChildren={hasChildren}
      />

      {/* Children row */}
      {hasChildren && expanded && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          {/* Vertical line from parent down to the horizontal bar */}
          <div style={{
            width: 2, height: 30,
            background: `${color}40`,
          }} />

          <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
            {/* Horizontal connector bar across all children */}
            {node.children.length > 1 && (
              <div
                className="org-hbar"
                style={{
                  position: "absolute",
                  top: 0,
                  height: 2,
                  background: `${COLORS.lavender}60`,
                  /* spans from center of first child to center of last child */
                  left: `calc(${(100 / node.children.length) * 0.5}% )`,
                  right: `calc(${(100 / node.children.length) * 0.5}% )`,
                }}
              />
            )}

            {node.children.map((child) => {
              const childColor = getColor(child.designation);
              return (
                <div
                  key={child.id}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "0 10px",
                  }}
                >
                  {/* Vertical stub from horizontal bar down to child */}
                  <div style={{
                    width: 2, height: 24,
                    background: `${childColor}40`,
                  }} />
                  <TreeNode node={child} depth={depth + 1} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────── Page ───────────────────── */
export default function HierarchyPage() {
  const { data: tree, isLoading } = useGetHierarchyTreeQuery();

  return (
    <>
      <TopBar title="Hierarchy" subtitle="Organisational structure and reporting relationships" >
        <TutorialButton videoUrl={TUTORIALS.addEmployee} />
      </TopBar> 

      <div style={{ padding: "24px 32px" }}>
        {/* Legend */}
        <div style={{
          display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24,
          background: COLORS.white, borderRadius: 14, padding: "14px 22px",
          border: `1px solid ${COLORS.lavender}30`,
          boxShadow: "0 2px 8px rgba(26,15,46,0.04)",
          justifyContent: "center",
        }}>
          {RANK_ORDER.map((key) => {
            const bg = DESIG_COLORS[key];
            if (!bg) return null;
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: COLORS.darkIndigo }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: bg, boxShadow: `0 0 0 2px ${bg}30`,
                }} />
                {key.replace(/_/g, " ")}
              </div>
            );
          })}
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: COLORS.mauve }}>Loading hierarchy...</div>
        ) : !tree || tree.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 60, color: COLORS.mauve,
            background: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.lavender}30`,
          }}>
            <FiUsers size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div>No hierarchy data available.</div>
          </div>
        ) : (
          <div style={{
            background: `linear-gradient(180deg, ${COLORS.white} 0%, ${COLORS.pearl}80 100%)`,
            borderRadius: 20,
            padding: "48px 32px",
            border: `1px solid ${COLORS.lavender}20`,
            boxShadow: "0 4px 24px rgba(26,15,46,0.06)",
            overflowX: "auto",
          }}>
            <div style={{
              display: "inline-flex", flexDirection: "column", alignItems: "center",
              minWidth: "100%",
            }}>
              {tree.map(root => (
                <TreeNode key={root.id} node={root} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
