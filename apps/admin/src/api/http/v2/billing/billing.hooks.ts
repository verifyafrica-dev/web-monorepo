import {
	useMutation,
	useQuery,
	useQueryClient,
	type UseQueryResult,
} from "@tanstack/react-query";

import { BILLING_V2_API } from "./billing.api";
import type {
	AllInvoicesListQuery,
	BillingInformation,
	BillingInformationCreatePayload,
	BillingInformationUpdatePayload,
	BillingListQuery,
	BillingPricing,
	BillingPricingCreatePayload,
	BillingPricingListQuery,
	BillingPricingUpdatePayload,
	Invoice,
	PaginatedAllInvoiceListResult,
	PaginatedBillingInformationListResult,
	PaginatedBillingPricingListResult,
	PaginatedTenantInvoiceListResult,
} from "./billing.types";

const BILLING_V2_STALE_TIME = 60_000;

export const BILLING_V2_QUERY_KEYS = {
	all: ["billing-v2"] as const,
	billingInformation: (tenantId: string) =>
		["billing-v2", "billing-information", tenantId] as const,
	allBillingInformation: (params?: BillingListQuery) =>
		["billing-v2", "billing-information", "all", params ?? {}] as const,
	billingPricingList: (params?: BillingPricingListQuery) =>
		["billing-v2", "billing-pricing", "list", params ?? {}] as const,
	billingPricingDetail: (id: string) =>
		["billing-v2", "billing-pricing", "detail", id] as const,
	tenantInvoices: (tenantId: string, params?: BillingListQuery) =>
		["billing-v2", "invoices", tenantId, params ?? {}] as const,
	allInvoicesList: (params?: AllInvoicesListQuery) =>
		["billing-v2", "invoices", "all", params ?? {}] as const,
	allInvoiceDetail: (id: string) =>
		["billing-v2", "invoices", "all", "detail", id] as const,
} as const;

export const useTenantBillingInformationV2Query = (
	tenantId: string | undefined,
	enabled = true,
): UseQueryResult<BillingInformation> =>
	useQuery<BillingInformation>({
		queryKey: BILLING_V2_QUERY_KEYS.billingInformation(tenantId ?? ""),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return BILLING_V2_API.BILLING_INFORMATION(tenantId);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: BILLING_V2_STALE_TIME,
	});

export const useAllBillingInformationV2Query = (
	params?: BillingListQuery,
	enabled = true,
): UseQueryResult<PaginatedBillingInformationListResult> =>
	useQuery<PaginatedBillingInformationListResult>({
		queryKey: BILLING_V2_QUERY_KEYS.allBillingInformation(params),
		queryFn: () => BILLING_V2_API.ALL_BILLING_INFORMATION(params),
		enabled,
		staleTime: BILLING_V2_STALE_TIME,
	});

export const useBillingPricingListV2Query = (
	params?: BillingPricingListQuery,
	enabled = true,
): UseQueryResult<PaginatedBillingPricingListResult> =>
	useQuery<PaginatedBillingPricingListResult>({
		queryKey: BILLING_V2_QUERY_KEYS.billingPricingList(params),
		queryFn: () => BILLING_V2_API.BILLING_PRICING_LIST(params),
		enabled: enabled && !params?.id,
		staleTime: BILLING_V2_STALE_TIME,
	});

export const useBillingPricingDetailV2Query = (
	id: string | undefined,
	enabled = true,
): UseQueryResult<BillingPricing> =>
	useQuery<BillingPricing>({
		queryKey: BILLING_V2_QUERY_KEYS.billingPricingDetail(id ?? ""),
		queryFn: () => BILLING_V2_API.BILLING_PRICING_DETAIL(id ?? ""),
		enabled: enabled && Boolean(id),
		staleTime: BILLING_V2_STALE_TIME,
	});

export const useTenantInvoicesV2Query = (
	tenantId: string | undefined,
	params?: BillingListQuery,
	enabled = true,
): UseQueryResult<PaginatedTenantInvoiceListResult> =>
	useQuery<PaginatedTenantInvoiceListResult>({
		queryKey: BILLING_V2_QUERY_KEYS.tenantInvoices(tenantId ?? "", params),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return BILLING_V2_API.TENANT_INVOICES(tenantId, params);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: BILLING_V2_STALE_TIME,
	});

export const useAllInvoicesV2Query = (
	params?: AllInvoicesListQuery,
	enabled = true,
): UseQueryResult<PaginatedAllInvoiceListResult> =>
	useQuery<PaginatedAllInvoiceListResult>({
		queryKey: BILLING_V2_QUERY_KEYS.allInvoicesList(params),
		queryFn: () => BILLING_V2_API.ALL_INVOICES_LIST(params),
		enabled: enabled && !params?.id,
		staleTime: BILLING_V2_STALE_TIME,
	});

export const useAllInvoiceDetailV2Query = (
	id: string | undefined,
	enabled = true,
): UseQueryResult<Invoice> =>
	useQuery<Invoice>({
		queryKey: BILLING_V2_QUERY_KEYS.allInvoiceDetail(id ?? ""),
		queryFn: () => BILLING_V2_API.ALL_INVOICE_DETAIL(id ?? ""),
		enabled: enabled && Boolean(id),
		staleTime: BILLING_V2_STALE_TIME,
	});

export const useCreateBillingInformationV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: BillingInformationCreatePayload) =>
			BILLING_V2_API.CREATE_BILLING_INFORMATION(payload),
		onSuccess: (data) => {
			queryClient.setQueryData(
				BILLING_V2_QUERY_KEYS.billingInformation(data.tenant),
				data,
			);
			queryClient.invalidateQueries({ queryKey: BILLING_V2_QUERY_KEYS.all });
		},
	});
};

export const useUpdateTenantBillingInformationV2Mutation = (
	tenantId: string,
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: BillingInformationUpdatePayload) =>
			BILLING_V2_API.UPDATE_BILLING_INFORMATION(tenantId, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(
				BILLING_V2_QUERY_KEYS.billingInformation(tenantId),
				data,
			);
			queryClient.invalidateQueries({ queryKey: BILLING_V2_QUERY_KEYS.all });
		},
	});
};

export const useDeleteTenantBillingInformationV2Mutation = (
	tenantId: string,
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => BILLING_V2_API.DELETE_BILLING_INFORMATION(tenantId),
		onSuccess: () => {
			queryClient.removeQueries({
				queryKey: BILLING_V2_QUERY_KEYS.billingInformation(tenantId),
			});
			queryClient.invalidateQueries({ queryKey: BILLING_V2_QUERY_KEYS.all });
		},
	});
};

export const useCreateBillingPricingV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: BillingPricingCreatePayload) =>
			BILLING_V2_API.CREATE_BILLING_PRICING(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: BILLING_V2_QUERY_KEYS.all });
		},
	});
};

export const useUpdateBillingPricingV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: string;
			payload: BillingPricingUpdatePayload;
		}) => BILLING_V2_API.UPDATE_BILLING_PRICING(id, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(
				BILLING_V2_QUERY_KEYS.billingPricingDetail(data.id),
				data,
			);
			queryClient.invalidateQueries({ queryKey: BILLING_V2_QUERY_KEYS.all });
		},
	});
};

export const useDeleteBillingPricingV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => BILLING_V2_API.DELETE_BILLING_PRICING(id),
		onSuccess: (_message, id) => {
			queryClient.removeQueries({
				queryKey: BILLING_V2_QUERY_KEYS.billingPricingDetail(id),
			});
			queryClient.invalidateQueries({ queryKey: BILLING_V2_QUERY_KEYS.all });
		},
	});
};

export type {
	BillingInformation,
	BillingPricing,
	Invoice,
	PaginatedAllInvoiceListResult,
	PaginatedBillingInformationListResult,
	PaginatedBillingPricingListResult,
	PaginatedTenantInvoiceListResult,
};
