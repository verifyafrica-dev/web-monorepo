import { z } from "zod";

import type { PaginatedResponse } from "../tenants/tenants.types";

export {
	VerificationStatusSchema,
	VerificationTypeSchema,
	type VerificationStatus,
	type VerificationType,
} from "@verifyafrica/api-client/http/v1/verifications/verifications.types";

/** Precomputed option lists (keep next to schema defs to avoid SSR chunk TDZ). */
export const VERIFICATION_TYPE_OPTIONS = VerificationTypeSchema.options;
export const VERIFICATION_STATUS_OPTIONS = VerificationStatusSchema.options;

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
