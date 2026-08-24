import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { BILLING_API } from "./billing.api";
import type {
	BillingInformation,
	BillingInformationCreatePayload,
	BillingInformationListQuery,
	BillingInformationListResponse,
	BillingInformationTenantQuery,
	BillingInformationUpdatePayload,
	BillingPricing,
	BillingPricingListResponse,
	Invoice,
	TenantInvoicesListResponse,
} from "./billing.types";

const BILLING_STALE_TIME = 60_000;

export const BILLING_QUERY_KEYS = {
	all: ["billing"] as const,
	billingInformationList: (params?: BillingInformationListQuery) =>
		["billing", "information", "list", params ?? {}] as const,
	billingPricingList: (params?: { offset?: number; page_size?: number }) =>
		["billing", "pricing", "list", params ?? {}] as const,
	billingPricingDetail: (id: string) =>
		["billing", "pricing", "detail", id] as const,
	allInvoicesList: (params?: { offset?: number; page_size?: number }) =>
		["billing", "all-invoices", "list", params ?? {}] as const,
	allInvoiceDetail: (id: string) =>
		["billing", "all-invoices", "detail", id] as const,
	tenantInvoicesList: (
		tenantId: string,
		params?: { offset?: number; page_size?: number },
	) => ["billing", "tenant-invoices", tenantId, params ?? {}] as const,
} as const;

export const useBillingInformationListQuery = (
	params?: BillingInformationListQuery,
	enabled = true,
) =>
	useQuery<BillingInformationListResponse>({
		queryKey: BILLING_QUERY_KEYS.billingInformationList(params),
		queryFn: () => BILLING_API.BILLING_INFORMATION_LIST(params),
		enabled,
		staleTime: BILLING_STALE_TIME,
	});

export const useCreateBillingInformationMutation = () => {
	const queryClient = useQueryClient();

	return useMutation<
		BillingInformation,
		Error,
		BillingInformationCreatePayload
	>({
		mutationFn: BILLING_API.BILLING_INFORMATION_CREATE,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
		},
	});
};

export const useUpdateBillingInformationMutation = (
	tenantId: string | undefined,
) => {
	const queryClient = useQueryClient();

	return useMutation<
		BillingInformation,
		Error,
		BillingInformationUpdatePayload
	>({
		mutationFn: (payload) =>
			BILLING_API.BILLING_INFORMATION_UPDATE(
				{ tenant_id: tenantId ?? "" },
				payload,
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
		},
	});
};

export const usePartialUpdateBillingInformationMutation = (
	billingInformationId: string | undefined,
) => {
	const queryClient = useQueryClient();

	return useMutation<
		BillingInformation,
		Error,
		BillingInformationUpdatePayload
	>({
		mutationFn: (payload) =>
			BILLING_API.BILLING_INFORMATION_PARTIAL_UPDATE(
				billingInformationId ?? "",
				payload,
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
		},
	});
};

export const useDeleteBillingInformationMutation = (
	tenantId: string | undefined,
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () =>
			BILLING_API.BILLING_INFORMATION_DELETE({
				tenant_id: tenantId ?? "",
			} satisfies BillingInformationTenantQuery),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.all });
		},
	});
};

export const useBillingPricingListQuery = (
	params?: { offset?: number; page_size?: number },
	enabled = true,
) =>
	useQuery<BillingPricingListResponse>({
		queryKey: BILLING_QUERY_KEYS.billingPricingList(params),
		queryFn: () => BILLING_API.BILLING_PRICING_LIST(params),
		enabled,
		staleTime: BILLING_STALE_TIME,
	});

export const useBillingPricingDetailQuery = (
	id: string | undefined,
	enabled = true,
) =>
	useQuery<BillingPricing, Error>({
		queryKey: BILLING_QUERY_KEYS.billingPricingDetail(id ?? ""),
		queryFn: () => BILLING_API.BILLING_PRICING_DETAIL(id ?? ""),
		enabled: enabled && Boolean(id),
		staleTime: BILLING_STALE_TIME,
	});

export const useAllInvoicesListQuery = (
	params?: { offset?: number; page_size?: number },
	enabled = true,
) =>
	useQuery({
		queryKey: BILLING_QUERY_KEYS.allInvoicesList(params),
		queryFn: () => BILLING_API.ALL_INVOICES_LIST(params),
		enabled,
		staleTime: BILLING_STALE_TIME,
	});

export const useAllInvoiceDetailQuery = (
	id: string | undefined,
	enabled = true,
) =>
	useQuery<Invoice, Error>({
		queryKey: BILLING_QUERY_KEYS.allInvoiceDetail(id ?? ""),
		queryFn: () => BILLING_API.ALL_INVOICE_DETAIL(id ?? ""),
		enabled: enabled && Boolean(id),
		staleTime: BILLING_STALE_TIME,
	});

export const useTenantInvoicesQuery = (
	tenantId: string | undefined,
	params?: { offset?: number; page_size?: number },
	enabled = true,
) =>
	useQuery<TenantInvoicesListResponse>({
		queryKey: BILLING_QUERY_KEYS.tenantInvoicesList(tenantId ?? "", params),
		queryFn: () => BILLING_API.INVOICES_BY_TENANT(tenantId ?? "", params),
		enabled: enabled && Boolean(tenantId),
		staleTime: BILLING_STALE_TIME,
	});
