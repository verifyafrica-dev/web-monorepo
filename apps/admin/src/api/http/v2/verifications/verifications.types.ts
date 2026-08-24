import { z } from "zod";
import {
	type VerificationStatus,
	type VerificationType,
	VerificationStatusSchema,
	VerificationTypeSchema,
} from "@verifyafrica/api-client/http/v1/verifications/verifications.types";
import type {
	V2AxiosError,
	V2PaginatedSuccessResponse,
	V2SuccessResponse,
} from "@verifyafrica/api-client/http/shared";

export type { VerificationStatus, VerificationType };
export { VerificationStatusSchema, VerificationTypeSchema };

export const VerificationListQuerySchema = z.object({
	page: z.number().int().positive().optional(),
	per_page: z.number().int().positive().optional(),
	total_in_page: z.number().int().positive().optional(),
	batch_id: z.string().uuid().optional(),
	status: VerificationStatusSchema.optional(),
	verification_type: VerificationTypeSchema.optional(),
	has_batch: z.boolean().optional(),
	search: z.string().optional(),
	country: z.string().optional(),
	tenant_id: z.string().uuid().optional(),
});

export type VerificationListQuery = z.infer<typeof VerificationListQuerySchema>;

export const VerificationBatchListQuerySchema = z.object({
	page: z.number().int().positive().optional(),
	per_page: z.number().int().positive().optional(),
	total_in_page: z.number().int().positive().optional(),
	status: VerificationStatusSchema.optional(),
	search: z.string().optional(),
	tenant_id: z.string().uuid().optional(),
});

export type VerificationBatchListQuery = z.infer<
	typeof VerificationBatchListQuerySchema
>;

export const MixedVerificationListQuerySchema =
	VerificationBatchListQuerySchema.extend({
		is_custom: z.boolean().optional(),
	});

export type MixedVerificationListQuery = z.infer<
	typeof MixedVerificationListQuerySchema
>;

export const VerificationProofKeySchema = z.enum([
	"document",
	"face",
	"verification_video",
	"verification_report",
]);

export type VerificationProofKey = z.infer<typeof VerificationProofKeySchema>;

export const VerificationRequestCreateSchema = z.object({
	verification_type: VerificationTypeSchema,
	input_data: z.record(z.string(), z.unknown()),
	method_type: z.string().optional(),
	notification_email: z.string().email().optional(),
});

export type VerificationRequestCreatePayload = z.infer<
	typeof VerificationRequestCreateSchema
>;

export const BulkVerificationItemSchema = z.object({
	verification_type: VerificationTypeSchema,
	input_data: z.record(z.string(), z.unknown()),
	method_type: z.string().optional(),
});

export const BulkVerificationCreateSchema = z.object({
	items: z.array(BulkVerificationItemSchema).min(1),
});

export type BulkVerificationCreatePayload = z.infer<
	typeof BulkVerificationCreateSchema
>;

export const MixedVerificationStartSchema = z.object({
	email: z.string().email(),
	is_mixed: z.literal(true),
	verification_id: z.string().uuid(),
	full_address: z.string().optional(),
	reference: z.string().optional(),
	notification_email: z.string().email().optional(),
});

export type MixedVerificationStartPayload = z.infer<
	typeof MixedVerificationStartSchema
>;

export const MixedVerificationUpsertSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	verifications: z.array(z.string()).min(1),
	price: z.string().optional(),
	is_active: z.boolean().optional(),
	is_custom: z.boolean().optional(),
	journey_id: z.string().optional(),
});

export type MixedVerificationUpsertPayload = z.infer<
	typeof MixedVerificationUpsertSchema
>;

export interface VerificationLink {
	id: string;
	link: string;
	inner_link: string;
	created_at: string;
	verification_id: string;
	verification_reference: string;
	provider: string;
}

export interface VerificationRequest {
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
	link?: VerificationLink | null;
	email_sent_at?: string | null;
}

export interface VerificationRequestDetail extends VerificationRequest {
	proofs_available: boolean;
	proofs: Record<string, unknown>;
}

export const VERIFICATION_TYPES_BY_PRODUCT = {
	"Government Registry Checks": [
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
	],
	"Document Verification": ["id_document"],
	"Facial Screening": ["face_match"],
	"Address Verification": ["address_verification"],
	"AML Screening": [
		"aml_screening",
	],
	"Business AML Screening": [
		"business_aml_screening",
	],
	"Crypto Wallet Screening": [
		"crypto_wallet_screening",
	],
	"KYB Screening": ["kyb_screening"],
	"Risk Assessment": ["risk_assessment"],
	"Age Verification": ["age_verification"],
	"2FA Verification": ["two_fa_verification"],
	"Mixed Verification": ["mixed_verification"],
} as const satisfies Record<string, readonly VerificationType[]>;

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

export interface VerificationTypeDefinition {
	verification_type: string;
	required_parameters: string[];
	validation_parameters: string[];
}

export interface MixedVerification {
	id: string;
	tenant: string | null;
	name: string;
	description: string;
	verifications: string[];
	price: string | null;
	calculated_price: string | null;
	is_active: boolean;
	is_custom: boolean;
	journey_id: string | null;
	deleted_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface VerificationPrice {
	id: number;
	verification_type: string;
	cost_price: string;
	selling_price: string;
	currency: string;
	plan: string;
	is_active: boolean;
	source: string;
	created_at: string;
	updated_at: string;
}

export interface VerificationTypePrice {
	id: number;
	verification_type: string;
	is_active: boolean;
	plan: string;
}

export interface VerificationSendEmailData {
	email_sent_at: string | null;
}

export type VerificationRequestResponse = V2SuccessResponse<VerificationRequest>;
export type VerificationRequestDetailResponse =
	V2SuccessResponse<VerificationRequestDetail>;
export type VerificationBatchResponse = V2SuccessResponse<VerificationBatch>;
export type VerificationTypeListResponse = V2SuccessResponse<
	VerificationTypeDefinition[]
>;
export type MixedVerificationResponse = V2SuccessResponse<MixedVerification>;
export type VerificationPriceResponse = V2SuccessResponse<VerificationPrice>;
export type VerificationLinkResponse = V2SuccessResponse<VerificationLink>;
export type VerificationSendEmailResponse =
	V2SuccessResponse<VerificationSendEmailData>;

export type VerificationRequestListResponse =
	V2PaginatedSuccessResponse<VerificationRequest>;
export type VerificationBatchListResponse =
	V2PaginatedSuccessResponse<VerificationBatch>;
export type MixedVerificationListResponse =
	V2PaginatedSuccessResponse<MixedVerification>;
export type VerificationPriceListResponse =
	V2PaginatedSuccessResponse<VerificationPrice>;
export type VerificationTypePriceListResponse =
	V2PaginatedSuccessResponse<VerificationTypePrice>;

export interface PaginatedVerificationRequestListResult {
	items: VerificationRequest[];
	meta: NonNullable<VerificationRequestListResponse["meta"]>;
	message: string;
}

export interface PaginatedVerificationBatchListResult {
	items: VerificationBatch[];
	meta: NonNullable<VerificationBatchListResponse["meta"]>;
	message: string;
}

export interface PaginatedMixedVerificationListResult {
	items: MixedVerification[];
	meta: NonNullable<MixedVerificationListResponse["meta"]>;
	message: string;
}

export interface PaginatedVerificationPriceListResult {
	items: VerificationPrice[];
	meta: NonNullable<VerificationPriceListResponse["meta"]>;
	message: string;
}

export interface PaginatedVerificationTypePriceListResult {
	items: VerificationTypePrice[];
	meta: NonNullable<VerificationTypePriceListResponse["meta"]>;
	message: string;
}

export type VerificationsApiErrorResponse = V2AxiosError;
