import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth, TAG_TYPES } from "./api";
import type { AttendanceRecord } from "@/types";

export const attendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: [TAG_TYPES.ATTENDANCE],
  endpoints: (builder) => ({

    getTodayAttendance: builder.query<AttendanceRecord | null, void>({
      query: () => "/attendance/today",
      providesTags: [{ type: TAG_TYPES.ATTENDANCE, id: "TODAY" }],
    }),

    // address is resolved on the frontend before calling — matches old app approach
    checkIn: builder.mutation<
      AttendanceRecord,
      { latitude: number; longitude: number; accuracy?: number; address?: string }
    >({
      query: (body) => ({ url: "/attendance/check-in", method: "POST", body }),
      // Immediately invalidates TODAY → RTK Query refetches → UI updates without manual refresh
      invalidatesTags: [{ type: TAG_TYPES.ATTENDANCE, id: "TODAY" }],
    }),

    checkOut: builder.mutation<
      AttendanceRecord,
      { latitude: number; longitude: number; accuracy?: number; address?: string }
    >({
      query: (body) => ({ url: "/attendance/check-out", method: "POST", body }),
      invalidatesTags: [{ type: TAG_TYPES.ATTENDANCE, id: "TODAY" }],
    }),

    getMyAttendance: builder.query<
      AttendanceRecord[],
      { startDate?: string; endDate?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/attendance/mine", params }),
      transformResponse: (res: AttendanceRecord[] | { data: AttendanceRecord[] }) =>
        Array.isArray(res) ? res : res.data,
      providesTags: [{ type: TAG_TYPES.ATTENDANCE, id: "MINE" }],
    }),

    getTeamAttendance: builder.query<
      AttendanceRecord[],
      { startDate?: string; endDate?: string; page?: number; limit?: number }
    >({
      query: (params) => ({ url: "/attendance", params }),
      transformResponse: (res: AttendanceRecord[] | { data: AttendanceRecord[] }) =>
        Array.isArray(res) ? res : res.data,
      providesTags: [{ type: TAG_TYPES.ATTENDANCE, id: "TEAM" }],
    }),

    getAttendanceSummary: builder.query<unknown, { month: number; year: number }>({
      query: (params) => ({ url: "/attendance/summary", params }),
      providesTags: [{ type: TAG_TYPES.ATTENDANCE, id: "SUMMARY" }],
    }),

    // ── Excel exports ────────────────────────────────────────

    downloadMyAttendance: builder.query<Blob, { startDate: string; endDate: string }>({
      query: (params) => ({
        url: "/attendance/export/mine",
        params,
        responseHandler: (response) => response.blob(),
        cache: "no-cache",
      }),
    }),

    downloadTeamAttendance: builder.query<
      Blob,
      { startDate: string; endDate: string; employeeId?: string }
    >({
      query: (params) => ({
        url: "/attendance/export/team",
        params,
        responseHandler: (response) => response.blob(),
        cache: "no-cache",
      }),
    }),

  }),
});

export const {
  useGetTodayAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useGetMyAttendanceQuery,
  useGetTeamAttendanceQuery,
  useGetAttendanceSummaryQuery,
  useLazyDownloadMyAttendanceQuery,
  useLazyDownloadTeamAttendanceQuery,
} = attendanceApi;