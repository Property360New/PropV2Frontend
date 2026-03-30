// ============================================================
// src/store/bulk-import.api.ts
// ============================================================

import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "./api";
import Cookies from "js-cookie";

export interface ImportHistoryItem {
  id: string;
  fileName: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  createdAt: string;
  uploadedById: string;
}

export interface ImportResult {
  importId: string;
  total: number;
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; reason: string }>;
}

export const bulkImportApi = createApi({
  reducerPath: "bulkImportApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["BulkImport"],
  endpoints: (builder) => ({
    getImportHistory: builder.query<ImportHistoryItem[], void>({
      query: () => "/bulk-import/history",
      transformResponse: (raw: any) => raw?.data ?? raw ?? [],
      providesTags: [{ type: "BulkImport", id: "LIST" }],
    }),

    downloadTemplate: builder.query<void, void>({
      queryFn: async (_arg, _queryApi, _extraOptions, _baseQuery) => {
        try {
          const token = Cookies.get("accessToken");
          const baseUrl =
            process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

          const response = await fetch(`${baseUrl}/bulk-import/template`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          if (!response.ok) {
            const text = await response.text();
            return {
              error: {
                status: response.status as number,
                statusText: response.statusText,
                data: text,
              } as const,
            };
          }

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "leads-import-template.xlsx";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          return { data: undefined as void };
        } catch (err: any) {
          return {
            error: {
              status: "FETCH_ERROR" as const,
              error: String(err?.message ?? err),
            },
          };
        }
      },
    }),

    importLeads: builder.mutation<ImportResult, { file: File; assignedToId?: string }>({
      queryFn: async ({ file, assignedToId }, _queryApi, _extraOptions, baseQuery) => {
        const formData = new FormData();
        formData.append("file", file);
        if (assignedToId) formData.append("assignedToId", assignedToId);

        const result = await baseQuery({
          url: "/bulk-import/leads",
          method: "POST",
          body: formData,
        });

        if (result.error) return { error: result.error };
        const raw = result.data as any;
        return { data: raw?.data ?? raw };
      },
      invalidatesTags: ["BulkImport"],
    }),
  }),
});

export const {
  useGetImportHistoryQuery,
  useLazyDownloadTemplateQuery,
  useImportLeadsMutation,
} = bulkImportApi;