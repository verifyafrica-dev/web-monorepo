import {
	unwrapV2Data,
	unwrapV2Message,
	unwrapV2Paginated,
} from "#/api/http/shared";
import $http from "../../xhr";
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

const TENANT_ID_HEADER = "X-TENANT-ID";

const BILLING_V2_ENDPOINTS = {
	billingInformation: "/v2/billing/billing-information/",
	billingInformationAll: "/v2/billing/billing-information/all/",
	billingPricing: "/v2/billing/billing-pricing/",
	billingPricingDetail: (id: string) => `/v2/billing/billing-pricing/${id}/`,
	invoices: "/v2/billing/invoices/",
	invoicesAll: "/v2/billing/invoices/all/",
} as const;

const withTenantHeader = (tenantId: string) => ({
	headers: {
		[TENANT_ID_HEADER]: tenantId,
	},
});

export const BILLING_V2_API = {
	BILLING_INFORMATION: async (tenantId: string): Promise<BillingInformation> =>
		await $http
			.get(
				BILLING_V2_ENDPOINTS.billingInformation,
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Data<BillingInformation>(res)),

	CREATE_BILLING_INFORMATION: async (
		data: BillingInformationCreatePayload,
	): Promise<BillingInformation> =>
		await $http
			.post(BILLING_V2_ENDPOINTS.billingInformation, data)
			.then((res) => unwrapV2Data<BillingInformation>(res)),

	UPDATE_BILLING_INFORMATION: async (
		tenantId: string,
		data: BillingInformationUpdatePayload,
	): Promise<BillingInformation> =>
		await $http
			.patch(
				BILLING_V2_ENDPOINTS.billingInformation,
				data,
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Data<BillingInformation>(res)),

	DELETE_BILLING_INFORMATION: async (tenantId: string): Promise<string> =>
		await $http
			.delete(
				BILLING_V2_ENDPOINTS.billingInformation,
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Message(res)),

	ALL_BILLING_INFORMATION: async (
		params?: BillingListQuery,
	): Promise<PaginatedBillingInformationListResult> =>
		await $http
			.get(BILLING_V2_ENDPOINTS.billingInformationAll, { params })
			.then((res) => unwrapV2Paginated(res)),

	BILLING_PRICING_LIST: async (
		params?: BillingPricingListQuery,
	): Promise<PaginatedBillingPricingListResult> =>
		await $http
			.get(BILLING_V2_ENDPOINTS.billingPricing, { params })
			.then((res) => unwrapV2Paginated(res)),

	BILLING_PRICING_DETAIL: async (id: string): Promise<BillingPricing> =>
		await $http
			.get(BILLING_V2_ENDPOINTS.billingPricing, { params: { id } })
			.then((res) => unwrapV2Data<BillingPricing>(res)),

	CREATE_BILLING_PRICING: async (
		data: BillingPricingCreatePayload,
	): Promise<BillingPricing> =>
		await $http
			.post(BILLING_V2_ENDPOINTS.billingPricing, data)
			.then((res) => unwrapV2Data<BillingPricing>(res)),

	UPDATE_BILLING_PRICING: async (
		id: string,
		data: BillingPricingUpdatePayload,
	): Promise<BillingPricing> =>
		await $http
			.patch(BILLING_V2_ENDPOINTS.billingPricingDetail(id), data)
			.then((res) => unwrapV2Data<BillingPricing>(res)),

	DELETE_BILLING_PRICING: async (id: string): Promise<string> =>
		await $http
			.delete(BILLING_V2_ENDPOINTS.billingPricingDetail(id))
			.then((res) => unwrapV2Message(res)),

	TENANT_INVOICES: async (
		tenantId: string,
		params?: BillingListQuery,
	): Promise<PaginatedTenantInvoiceListResult> =>
		await $http
			.get(BILLING_V2_ENDPOINTS.invoices, {
				params,
				...withTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Paginated(res)),

	ALL_INVOICES_LIST: async (
		params?: AllInvoicesListQuery,
	): Promise<PaginatedAllInvoiceListResult> =>
		await $http
			.get(BILLING_V2_ENDPOINTS.invoicesAll, { params })
			.then((res) => unwrapV2Paginated(res)),

	ALL_INVOICE_DETAIL: async (id: string): Promise<Invoice> =>
		await $http
			.get(BILLING_V2_ENDPOINTS.invoicesAll, { params: { id } })
			.then((res) => unwrapV2Data<Invoice>(res)),
};
