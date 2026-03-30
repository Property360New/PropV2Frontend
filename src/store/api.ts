import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = Cookies.get("accessToken");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Unwrap the backend's { success, data, timestamp } envelope
function unwrapResponse<T>(result: T): T {
  const r = result as { data?: unknown };
  if (r.data && typeof r.data === "object" && "data" in (r.data as Record<string, unknown>)) {
    return { ...result, data: (r.data as { data: unknown }).data };
  }
  return result;
}

// Wraps the base query to handle 401 → refresh token flow and unwrap envelope
export const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshToken = Cookies.get("refreshToken");
    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
          headers: { Authorization: `Bearer ${refreshToken}` },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const unwrapped = unwrapResponse(refreshResult);
        const data = unwrapped.data as { accessToken: string; refreshToken: string };
        Cookies.set("accessToken", data.accessToken, { sameSite: "strict" });
        Cookies.set("refreshToken", data.refreshToken, { sameSite: "strict" });
        // Retry original request
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    } else {
      Cookies.remove("accessToken");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  return unwrapResponse(result);
};

export const TAG_TYPES = {
  AUTH: "Auth" as const,
  LEADS: "Leads" as const,
  TAB_COUNTS: "TabCounts" as const,
  NOTIFICATION_STRIP: "NotificationStrip" as const,
  TODAYS_FOLLOWUPS: "TodaysFollowups" as const,
  ATTENDANCE: "Attendance" as const,
  TARGETS: "Targets" as const,
  NOTIFICATIONS: "Notifications" as const,
  REPORTS: "Reports" as const,
  CUSTOMERS: "Customers" as const,
  INVENTORY: "Inventory" as const,
  EMPLOYEES: "Employees" as const,
  HIERARCHY: "Hierarchy" as const,
  PROJECTS: "Projects" as const,
  EXPENSES: "Expenses" as const,
};
