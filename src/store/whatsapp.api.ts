import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "./api";

interface WhatsappTemplate {
  id: string;
  templateText: string;
  employeeId: string;
  createdAt: string;
  updatedAt: string;
}

interface Placeholder {
  key: string;
  label: string;
  example: string;
}

interface RenderResult {
  renderedMessage: string;
  whatsappUrl: string;
}

export const whatsappApi = createApi({
  reducerPath: "whatsappApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["WhatsappTemplate"],
  endpoints: (builder) => ({
    getPlaceholders: builder.query<Placeholder[], void>({
      query: () => "/whatsapp/placeholders",
    }),

    getMyTemplate: builder.query<WhatsappTemplate | null, void>({
      query: () => "/whatsapp/template",
      providesTags: [{ type: "WhatsappTemplate", id: "MINE" }],
    }),

    upsertTemplate: builder.mutation<WhatsappTemplate, { templateText: string }>({
      query: (body) => ({ url: "/whatsapp/template", method: "PUT", body }),
      invalidatesTags: [{ type: "WhatsappTemplate", id: "MINE" }],
    }),

    deleteTemplate: builder.mutation<void, void>({
      query: () => ({ url: "/whatsapp/template", method: "DELETE" }),
      invalidatesTags: [{ type: "WhatsappTemplate", id: "MINE" }],
    }),

    renderTemplate: builder.mutation<RenderResult, { leadId: string }>({
      query: (body) => ({ url: "/whatsapp/render", method: "POST", body }),
    }),

    getAllTemplates: builder.query<WhatsappTemplate[], void>({
      query: () => "/whatsapp/admin/all",
      providesTags: [{ type: "WhatsappTemplate", id: "ALL" }],
    }),
  }),
});

export const {
  useGetPlaceholdersQuery,
  useGetMyTemplateQuery,
  useUpsertTemplateMutation,
  useDeleteTemplateMutation,
  useRenderTemplateMutation,
  useGetAllTemplatesQuery,
} = whatsappApi;
