import { z } from "zod";

import type {
	V2AxiosError,
	V2PaginatedSuccessResponse,
	V2SuccessResponse,
} from "#/api/http/shared";

export const BillingListQuerySchema = z.object({
	page: z.number().int().positive().optional(),
	per_page: z.number().int().positive().optional(),
	total_in_page: z.number().int().positive().optional(),
	format: z.enum(["json", "json-html"]).optional(),
});

export type BillingListQuery = z.infer<typeof BillingListQuerySchema>;

export const BillingPricingListQuerySchema = BillingListQuerySchema.extend({
	id: z.uuid().optional(),
});

export type BillingPricingListQuery = z.infer<
	typeof BillingPricingListQuerySchema
>;

export const AllInvoicesListQuerySchema = BillingListQuerySchema.extend({
	id: z.string().uuid().optional(),
});

export type AllInvoicesListQuery = z.infer<typeof AllInvoicesListQuerySchema>;

export const BillingPlanSchema = z.enum(["payg", "enterprise"]);
export type BillingPlan = z.infer<typeof BillingPlanSchema>;

export const PlanSchema = BillingPlanSchema;
export type Plan = z.infer<typeof PlanSchema>;

export const BillingInformationStatusSchema = z.enum(["active", "inactive"]);
export type BillingInformationStatus = z.infer<
	typeof BillingInformationStatusSchema
>;

export const PaymentStatusSchema = z.enum([
	"SUCCESS",
	"FAILED",
	"PENDING",
	"DUE",
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

const billingAddressFields = {
	billing_name: z.string().max(255).optional(),
	billing_email: z.email({ message: "Invalid billing email address" }).optional(),
	billing_address: z.string().optional(),
	billing_city: z.string().max(255).optional(),
	billing_state: z.string().max(255).optional(),
	billing_postal_code: z.string().max(255).optional(),
	billing_country: z.string().optional(),
	billing_plan: BillingPlanSchema,
	status: BillingInformationStatusSchema.optional(),
};

export const BillingInformationCreateSchema = z.object({
	tenant: z.string().uuid(),
	...billingAddressFields,
});

export type BillingInformationCreatePayload = z.infer<
	typeof BillingInformationCreateSchema
>;

export const BillingInformationUpdateSchema = z.object({
	tenant: z.string().uuid().optional(),
	billing_name: z.string().max(255).optional(),
	billing_email: z.email({ message: "Invalid billing email address" }).optional(),
	billing_address: z.string().optional(),
	billing_city: z.string().max(255).optional(),
	billing_state: z.string().max(255).optional(),
	billing_postal_code: z.string().max(255).optional(),
	billing_country: z.string().optional(),
	billing_plan: BillingPlanSchema.optional(),
	status: BillingInformationStatusSchema.optional(),
});

export type BillingInformationUpdatePayload = z.infer<
	typeof BillingInformationUpdateSchema
>;

export const BillingPricingCreateSchema = z.object({
	plan: PlanSchema,
	price: z.string(),
	currency: z.string().max(3).optional(),
});

export type BillingPricingCreatePayload = z.infer<
	typeof BillingPricingCreateSchema
>;

export const BillingPricingUpdateSchema = BillingPricingCreateSchema.partial();

export type BillingPricingUpdatePayload = z.infer<
	typeof BillingPricingUpdateSchema
>;

export interface BillingInformation {
	id: string;
	tenant: string;
	billing_name?: string;
	billing_email?: string;
	billing_address?: string;
	billing_city?: string;
	billing_state?: string;
	billing_postal_code?: string;
	billing_country?: string;
	billing_plan: BillingPlan;
	status?: BillingInformationStatus;
	created_at: string;
	updated_at: string;
}

export interface BillingPricing {
	id: string;
	plan: Plan;
	price: string;
	currency?: string;
	created_at: string;
	updated_at: string;
}

export interface InvoiceItem {
	id: string;
	invoice: string;
	stripe_invoice_item_id?: string;
	description: string;
	quantity?: number;
	unit_price?: string;
	total_price?: string;
	created_at: string;
	updated_at: string;
}

export interface Invoice {
	id: string;
	tenant: string;
	tenant_name?: string;
	tenant_email?: string;
	tenant_slug?: string;
	tenant_stripe_customer_id?: string;
	tenant_kyc_verified?: boolean;
	stripe_invoice_id?: string;
	stripe_status?: string;
	total_amount?: string;
	currency?: string;
	description: string;
	payment_status?: PaymentStatus;
	file_attachment?: string | null;
	paid_by?: string | null;
	due_at?: string | null;
	paid_amount?: string;
	created_at: string;
	updated_at: string;
	items: InvoiceItem[];
	invoice_id?: string;
}

export type BillingInformationResponse = V2SuccessResponse<BillingInformation>;
export type BillingPricingResponse = V2SuccessResponse<BillingPricing>;
export type InvoiceResponse = V2SuccessResponse<Invoice>;
export type BillingInformationListResponse =
	V2PaginatedSuccessResponse<BillingInformation>;
export type BillingPricingListResponse =
	V2PaginatedSuccessResponse<BillingPricing>;
export type TenantInvoiceListResponse = V2PaginatedSuccessResponse<Invoice>;
export type AllInvoiceListResponse = V2PaginatedSuccessResponse<Invoice>;

export interface PaginatedBillingInformationListResult {
	items: BillingInformation[];
	meta: NonNullable<BillingInformationListResponse["meta"]>;
	message: string;
}

export interface PaginatedBillingPricingListResult {
	items: BillingPricing[];
	meta: NonNullable<BillingPricingListResponse["meta"]>;
	message: string;
}

export interface PaginatedTenantInvoiceListResult {
	items: Invoice[];
	meta: NonNullable<TenantInvoiceListResponse["meta"]>;
	message: string;
}

export interface PaginatedAllInvoiceListResult {
	items: Invoice[];
	meta: NonNullable<AllInvoiceListResponse["meta"]>;
	message: string;
}

export type BillingApiErrorResponse = V2AxiosError;
