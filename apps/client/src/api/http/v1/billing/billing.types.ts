import { z } from "zod";

import type {
	PaginatedResponse,
	PaginationQuery,
	BillingInformation as TenantBillingInformation,
} from "../tenants/tenants.types";

export type BillingInformation = TenantBillingInformation;

export const BillingPaginationQuerySchema = z.object({
	offset: z.number().int().nonnegative().optional(),
	page_size: z.number().int().positive().optional(),
	format: z.enum(["json", "json-html"]).optional(),
});

export type BillingPaginationQuery = z.infer<
	typeof BillingPaginationQuerySchema
>;

export const BillingInformationListQuerySchema =
	BillingPaginationQuerySchema.extend({
		tenant_id: z.string().optional(),
	});

export type BillingInformationListQuery = z.infer<
	typeof BillingInformationListQuerySchema
>;

export const BillingInformationTenantQuerySchema = z.object({
	tenant_id: z.string(),
});

export type BillingInformationTenantQuery = z.infer<
	typeof BillingInformationTenantQuerySchema
>;

export type BillingListQuery = PaginationQuery;

export interface BillingInformationPayload {
	tenant?: string;
	billing_name?: string;
	billing_email?: string;
	billing_address?: string;
	billing_city?: string;
	billing_state?: string;
	billing_postal_code?: string;
	billing_country?: string;
	billing_plan?: string;
	status?: string;
}

export type BillingInformationCreatePayload = BillingInformationPayload;
export type BillingInformationUpdatePayload =
	Partial<BillingInformationPayload>;

export interface BillingPricing {
	id: string;
	billing_plan?: string;
	country?: string;
	price?: string;
	currency?: string;
	is_active?: boolean;
	created_at: string;
	updated_at: string;
	[key: string]: unknown;
}

export interface Invoice {
	id: string;
	invoice_id?: string;
	tenant?: string;
	description?: string;
	amount?: string;
	currency?: string;
	payment_status?: string;
	file_attachment?: string | null;
	created_at: string;
	due_at?: string | null;
	updated_at?: string;
	[key: string]: unknown;
}

export type BillingInformationListResponse =
	PaginatedResponse<BillingInformation>;
export type BillingPricingListResponse = PaginatedResponse<BillingPricing>;
export type AllInvoicesListResponse = PaginatedResponse<Invoice>;
export type TenantInvoicesListResponse = PaginatedResponse<Invoice>;
