"use client";

import { useGetMyTargetQuery, useGetTodayStatsQuery } from "@/store/targets.api";
import { useAppSelector } from "@/store";
import { COLORS } from "@/lib/colors";

export default function TargetInfo() {
  const employee = useAppSelector((s) => s.auth.employee);
  const { data: target, isLoading: targetLoading } = useGetMyTargetQuery();
  const { data: today,  isLoading: todayLoading  } = useGetTodayStatsQuery();

  if (targetLoading || todayLoading || !target) return null;

  // ── Sales (monthly) — unchanged, was already correct ──────────────────────
  const salesAchieved = target.salesAchieved;
  const salesTarget   = target.salesTarget || Number(employee?.monthlySalesTarget || 0);
  const salesPct      = salesTarget > 0 ? Math.round((salesAchieved / salesTarget) * 100) : 0;

  // ── Calls (DAILY) — use today's stats, not monthly ────────────────────────
  const callsToday = today?.calls ?? 0;
  const callTarget = today?.dailyCallTarget || employee?.dailyCallTarget || 0;
  const callPct    = callTarget > 0 ? Math.round((callsToday / callTarget) * 100) : 0;

  return (
    <div style={{ display: "flex", gap: 12 }}>
      {/* Sales Target (Monthly) */}
      {salesTarget > 0 && (
        <div style={{
          padding: "8px 16px", borderRadius: 10,
          background: `${COLORS.gold}15`, border: `1px solid ${COLORS.gold}30`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ fontSize: 11, color: COLORS.mauve, fontWeight: 600 }}>Monthly Sales</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.goldDark }}>
            {salesAchieved} / {salesTarget}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
            background: salesPct >= 100 ? COLORS.successLight : COLORS.dangerLight,
            color: salesPct >= 100 ? COLORS.success : COLORS.danger,
          }}>
            {salesPct}%
          </div>
        </div>
      )}

      {/* Call Target (DAILY) */}
      {callTarget > 0 && (
        <div style={{
          padding: "8px 16px", borderRadius: 10,
          background: `${COLORS.mauve}15`, border: `1px solid ${COLORS.mauve}30`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ fontSize: 11, color: COLORS.mauve, fontWeight: 600 }}>Today's Calls</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.darkIndigo }}>
            {callsToday} / {callTarget}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
            background: callPct >= 100 ? COLORS.successLight : COLORS.dangerLight,
            color: callPct >= 100 ? COLORS.success : COLORS.danger,
          }}>
            {callPct}%
          </div>
        </div>
      )}
    </div>
  );
}