import { z } from "zod";

import type { PaginatedResponse } from "../tenants/tenants.types";

export const VerificationStatusSchema = z.enum([
	"SUCCESS",
	"FAILED",
	"PENDING",
	"ABANDONED",
	"ERROR",
	"PARTIAL",
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const VerificationTypeSchema = z.enum([
	"za_said_verification",
	"ng_bvn_verification",
	"ng_nin_verification",
	"ng_virtual_nin_verification",
	"ng_advanced_phone_number_verification",
	"ng_phone_number_lookup",
	"ng_cac_lookup",
	"ng_passport_verification",
	"gh_passport_lookup",
	"gh_voter_card_lookup",
	"gh_ssnit_lookup",
	"gh_drivers_license_lookup",
	"ke_passport_lookup",
	"ke_national_id_lookup",
	"ke_phone_number_lookup",
	"ke_tax_pin_verification",
	"id_document",
	"face_match",
	"address_verification",
	"aml_screening",
	"business_aml_screening",
	"crypto_wallet_screening",
	"kyb_screening",
	"risk_assessment",
	"age_verification",
	"two_fa_verification",
	"mixed_verification",
]);
export type VerificationType = z.infer<typeof VerificationTypeSchema>;

export const VerificationRequestsListQuerySchema = z.object({
	tenant_id: z.string().uuid(),
	batch_id: z.string().uuid().optional(),
	has_batch: z.boolean().optional(),
	status: VerificationStatusSchema.optional(),
	verification_type: VerificationTypeSchema.optional(),
	format: z.enum(["json", "json-html"]).optional(),
	offset: z.number().int().nonnegative().optional(),
	page_size: z.number().int().positive().optional(),
	page: z.number().int().positive().optional(),
});
export type VerificationRequestsListQuery = z.infer<
	typeof VerificationRequestsListQuerySchema
>;

export const VerificationBatchesListQuerySchema = z.object({
	tenant_id: z.string().uuid(),
	format: z.enum(["json", "json-html"]).optional(),
	offset: z.number().int().nonnegative().optional(),
	page_size: z.number().int().positive().optional(),
	page: z.number().int().positive().optional(),
});
export type VerificationBatchesListQuery = z.infer<
	typeof VerificationBatchesListQuerySchema
>;

export interface VerificationRequestList {
	id: string;
	verification_type: VerificationType | string;
	status: VerificationStatus | string;
	input_data: Record<string, unknown>;
	response_data: Record<string, unknown>;
	cost_charged: string;
	currency: string;
	created_at: string;
	batch_id: string | null;
	reference?: string;
	source?: string;
	link?: string;
	email_sent_at?: string | null;
}

export interface VerificationBatch {
	id: string;
	tenant: string;
	status: VerificationStatus | string;
	total_count: number;
	success_count: number;
	failed_count: number;
	inactive_count: number;
	created_at: string;
	updated_at: string;
}

export type VerificationRequestsListResponse =
	PaginatedResponse<VerificationRequestList>;
export type VerificationBatchesListResponse =
	PaginatedResponse<VerificationBatch>;

export const ReportsFiltersFormSchema = z.object({
	search: z.string(),
	verificationType: z.string(),
	status: z.string(),
	country: z.string(),
});
export type ReportsFiltersFormValues = z.infer<typeof ReportsFiltersFormSchema>;
