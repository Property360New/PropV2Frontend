// ============================================================
// src/store/targets.api.ts
// ============================================================
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth, TAG_TYPES } from "./api";
import type { MyTarget, TeamTarget } from "@/types";

export type Period = "1M" | "3M" | "6M" | "1Y";

export interface QuarterlyIncentives {
  Q1: number; // JFM — Jan, Feb, Mar
  Q2: number; // AMJ — Apr, May, Jun
  Q3: number; // JAS — Jul, Aug, Sep
  Q4: number; // OND — Oct, Nov, Dec
}

export interface TargetSummary {
  period: Period;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    designation: string;
    dailyCallTarget?: number;
  } | null;
  achieved: {
    calls: number;
    queries: number;
    remarks: number;
    visits: number;
    meetings: number;
    deals: number;
    salesRevenue: number;
    incentive: number;
  };
  targets: {
    calls: number;
    salesRevenue: number;
  };
  dateRange: { from: string; to: string };
  /** Quarterly incentive breakdown for the selected year */
  quarterlyIncentives?: QuarterlyIncentives;
}

export interface TodayStats {
  calls: number;
  visits: number;
  meetings: number;
  deals: number;
  dailyCallTarget: number;
}

export const targetsApi = createApi({
  reducerPath: "targetsApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: [TAG_TYPES.TARGETS ?? "TARGETS"],
  endpoints: (builder) => ({

    // ── Single month — my target ─────────────────────────────────────────────
    getMyTarget: builder.query<MyTarget, { month?: number; year?: number } | void>({
      query: (params) => ({ url: "/targets/mine", params: params ?? undefined }),
      transformResponse: (raw: any) => raw?.data ?? raw,
    }),

    // ── Multi-month series for trend graphs ──────────────────────────────────
    getMyTargetSeries: builder.query<MyTarget[], { months?: number; employeeId?: string } | void>({
      query: (params) => ({ url: "/targets/series/mine", params: params ?? undefined }),
      transformResponse: (raw: any) => raw?.data ?? raw,
    }),

    // ── Team targets for a specific month/year ───────────────────────────────
    // Response now includes quarterlyIncentives per employee row
    getTeamTargets: builder.query<TeamTarget[], { month?: number; year?: number; employeeId?: string } | void>({
      query: (params) => ({ url: "/targets/team", params: params ?? undefined }),
      transformResponse: (raw: any) => raw?.data ?? raw,
    }),

    // ── Period summary (1M/3M/6M/1Y) + optional month/year anchor ───────────
    // month/year anchor: when period = "1M", the summary is computed for that
    // specific month. For wider periods, month/year is used as the end-point.
    getTargetSummary: builder.query<
      TargetSummary,
      { employeeId?: string; period: Period; month?: number; year?: number }
    >({
      query: ({ employeeId, period, month, year }) => ({
        url: "/targets/summary",
        params: { employeeId, period, month, year },
      }),
      transformResponse: (raw: any) => raw?.data ?? raw,
    }),

    // ── Today's live stats ───────────────────────────────────────────────────
    getTodayStats: builder.query<TodayStats, { employeeId?: string } | void>({
      query: (params) => ({ url: "/targets/today", params: params ?? undefined }),
      transformResponse: (raw: any) => raw?.data ?? raw,
    }),

    // ── Quarterly incentive breakdown for a full year ────────────────────────
    // Returns { Q1, Q2, Q3, Q4 } — each being the sum of incentiveAmount
    // from deals closed in that quarter's months for the given employee & year.
    getQuarterlyIncentives: builder.query<
      QuarterlyIncentives,
      { employeeId: string; year: number }
    >({
      query: ({ employeeId, year }) => ({
        url: "/targets/quarterly-incentives",
        params: { employeeId, year },
      }),
      transformResponse: (raw: any) => raw?.data ?? raw,
    }),

    // ── Admin: set target ────────────────────────────────────────────────────
    setTarget: builder.mutation<void, {
      employeeId: string;
      month: number;
      year: number;
      callTarget?: number;
      salesTarget?: number;
    }>({
      query: (body) => ({ url: "/targets/set", method: "POST", body }),
      invalidatesTags: [TAG_TYPES.TARGETS ?? "TARGETS"],
    }),
  }),
});

export const {
  useGetMyTargetQuery,
  useGetMyTargetSeriesQuery,
  useGetTeamTargetsQuery,
  useGetTargetSummaryQuery,
  useGetTodayStatsQuery,
  useGetQuarterlyIncentivesQuery,
  useSetTargetMutation,
} = targetsApi;