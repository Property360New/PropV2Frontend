// ============================================================
// src/store/reports.api.ts
// ============================================================
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "./api";

export interface ActivityStats {
  stats: {
    totalCalls: number;
    queries: number;
    remarks: number;
    followups: number;
    visits: number;
    meetings: number;
    deals: number;
    notInterested: number;
    hotProspects: number;
    ringing: number;
    switchOff: number;
    callBack: number;
    suspect: number;
  };
  hourly: Array<{ range: string; count: number }>;
  leads: Record<string, Array<{
    leadId: string; name: string; phone: string;
    source: string | null; status: string; createdAt: string;
    createdBy?: { id: string; firstName: string; lastName: string };
  }>>;
  dateRange: { gte: string; lte: string };
}

export interface TeamPerfRow {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  callsMade: number;
  queries: number;
  remarks: number;
  visitsCompleted: number;
  meetingsHeld: number;
  dealsDone: number;
  notInterested: number;
  followUps: number;
}

export const reportsApi = createApi({
  reducerPath: "reportsApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["REPORTS"],

  // ── Global cache TTL ──────────────────────────────────────────────────────
  // Reports data doesn't need to be live-updating like attendance.
  // Keep each result in cache for 5 minutes so switching tabs / employees
  // and coming back doesn't re-fetch if the data is still fresh.
  keepUnusedDataFor: 300,

  endpoints: (builder) => ({

    getDashboardSummary: builder.query<Record<string, number>, void>({
      query: () => "/reports/dashboard",
      transformResponse: (raw: any) => raw?.data ?? raw,
      providesTags: [{ type: "REPORTS", id: "DASHBOARD" }],
      // Dashboard summary is cheap (counts only) — keep it fresh for 2 min
      keepUnusedDataFor: 120,
    }),

    getActivityStats: builder.query<ActivityStats, {
      startDate?: string;
      endDate?: string;
      month?: number;
      year?: number;
      employeeId?: string;
    } | void>({
      query: (params) => ({ url: "/reports/activity", params: params ?? undefined }),
      transformResponse: (raw: any) => raw?.data ?? raw,
      // Each unique (startDate, endDate, employeeId) combination is cached
      // separately — switching employee or date reuses the cached result if
      // the same combination was fetched before within the TTL window.
      providesTags: (_, __, arg) => [
        { type: "REPORTS", id: `ACTIVITY-${JSON.stringify(arg)}` },
      ],
    }),

    getCallActivity: builder.query<{
      buckets: Array<{ range: string; count: number }>;
      total: number;
    }, { month?: number; year?: number; employeeId?: string } | void>({
      query: (params) => ({ url: "/reports/call-activity", params: params ?? undefined }),
      transformResponse: (raw: any) => raw?.data ?? raw,
      providesTags: (_, __, arg) => [
        { type: "REPORTS", id: `CALL_ACTIVITY-${JSON.stringify(arg)}` },
      ],
    }),

    getDailyCallActivity: builder.query<{
      buckets: Array<{ date: string; callsMade: number; callTarget: number }>;
      total: number;
      dailyCallTarget: number;
    }, { month?: number; year?: number; employeeId?: string } | void>({
      query: (params) => ({ url: "/reports/daily-call-activity", params: params ?? undefined }),
      transformResponse: (raw: any) => raw?.data ?? raw,
      providesTags: (_, __, arg) => [
        { type: "REPORTS", id: `DAILY_CALL_ACTIVITY-${JSON.stringify(arg)}` },
      ],
    }),

    getTeamPerformance: builder.query<{ data: TeamPerfRow[] }, {
      month?: number;
      year?: number;
      employeeId?: string;
    } | void>({
      query: (params) => ({ url: "/reports/team/performance", params: params ?? undefined }),
      transformResponse: (raw: any) => raw?.data ?? raw,
      providesTags: (_, __, arg) => [
        { type: "REPORTS", id: `TEAM_PERFORMANCE-${JSON.stringify(arg)}` },
      ],
    }),

    getLeadStatusReport: builder.query<unknown, { month?: number; year?: number } | void>({
      query: (params) => ({ url: "/reports/leads/status", params: params ?? undefined }),
      transformResponse: (raw: any) => raw?.data ?? raw,
    }),

    getLeadSourceReport: builder.query<unknown, { month?: number; year?: number } | void>({
      query: (params) => ({ url: "/reports/leads/source", params: params ?? undefined }),
      transformResponse: (raw: any) => raw?.data ?? raw,
    }),

    getDealsReport: builder.query<unknown, { startDate?: string; endDate?: string } | void>({
      query: (params) => ({ url: "/reports/deals", params: params ?? undefined }),
      transformResponse: (raw: any) => raw?.data ?? raw,
    }),

    getAttendanceReport: builder.query<unknown, { month?: number; year?: number } | void>({
      query: (params) => ({ url: "/reports/attendance", params: params ?? undefined }),
      transformResponse: (raw: any) => raw?.data ?? raw,
    }),

    getExpenseReport: builder.query<unknown, { month?: number; year?: number } | void>({
      query: (params) => ({ url: "/reports/expenses", params: params ?? undefined }),
      transformResponse: (raw: any) => raw?.data ?? raw,
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetActivityStatsQuery,
  useGetCallActivityQuery,
  useGetDailyCallActivityQuery,
  useGetTeamPerformanceQuery,
  useGetLeadStatusReportQuery,
  useGetLeadSourceReportQuery,
  useGetDealsReportQuery,
  useGetAttendanceReportQuery,
  useGetExpenseReportQuery,
} = reportsApi;