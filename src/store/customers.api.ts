import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth, TAG_TYPES } from "./api";
import type { Customer, PaginatedResponse } from "@/types";

interface ListCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  assignedToId?: string;
}

export const customersApi = createApi({
  reducerPath: "customersApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: [TAG_TYPES.CUSTOMERS],
  endpoints: (builder) => ({
    getCustomers: builder.query<PaginatedResponse<Customer>, ListCustomersParams | void>({
      query: (params) => ({ url: "/customers", params: params || undefined }),
      providesTags: [{ type: TAG_TYPES.CUSTOMERS, id: "LIST" }],
    }),

    getCustomerDetail: builder.query<Customer, string>({
      query: (id) => `/customers/${id}`,
      providesTags: (_r, _e, id) => [{ type: TAG_TYPES.CUSTOMERS, id }],
    }),

    updateDealDetails: builder.mutation<
  unknown,
  { id: string; queryId: string; body: Record<string, unknown> }
>({
  query: ({ id, queryId, body }) => ({
    url: `/customers/${id}/deal-details/${queryId}`,
    method: "PATCH",
    body,
  }),
  invalidatesTags: [TAG_TYPES.CUSTOMERS],
}),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerDetailQuery,
  useUpdateDealDetailsMutation,
} = customersApi;
