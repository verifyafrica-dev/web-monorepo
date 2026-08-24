import { z } from "zod";

import type {
	V2AxiosError,
	V2PaginatedSuccessResponse,
	V2SuccessResponse,
} from "@verifyafrica/api-client/http/shared";
import {
	type VerificationStatus,
	VerificationStatusSchema,
	type VerificationType,
	VerificationTypeSchema,
} from "@verifyafrica/api-client/http/v1/verifications/verifications.types";
import { VERIFICATION_TYPES_BY_PRODUCT } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

export type { VerificationStatus, VerificationType };
export { VerificationStatusSchema, VerificationTypeSchema };
export const VERIFICATION_STATUS_OPTIONS = VerificationStatusSchema.options;
export const VERIFICATION_TYPE_OPTIONS = VerificationTypeSchema.options;
export {
	VERIFICATION_TYPES_BY_PRODUCT,
	VerificationRequestCreateSchema,
	type VerificationLink,
	type VerificationRequest,
	type VerificationRequestCreatePayload,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

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

export interface VerificationProofUrlObject {
	proof?: string;
}

export interface VerificationProofs {
	access_token?: string;
	address?: VerificationProofUrlObject;
	document?: VerificationProofUrlObject;
	face?: VerificationProofUrlObject;
	verification_video?: string;
	verification_report?: string;
}

export interface VerificationRequestDetail extends VerificationRequest {
	proofs_available: boolean;
	proofs: VerificationProofs;
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

export type VerificationSendEmailData = {
	email_sent_at: string | null;
};

export interface VerificationSupportedCountriesData {
	verification_type: string;
	countries: Array<{ name: string; code: string }>;
}

export type VerificationRequestResponse =
	V2SuccessResponse<VerificationRequest>;
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

type UnknownRecord = Record<string, unknown>;

type AmlBackgroundChecksName = {
	full_name?: string;
	first_name?: string;
	last_name?: string;
};

type AmlBackgroundChecksInput = {
	name?: AmlBackgroundChecksName;
	filters?: string[];
	countries?: string[];
	match_score?: number;
	rca_search?: string;
	alias_search?: string;
};

type AmlVerificationData = {
	background_checks?: {
		name?: AmlBackgroundChecksName;
		aml_data?: {
			filters?: string[];
			hits?: UnknownRecord[];
		};
	};
};

type AmlGeoLocation = {
	ip?: string;
	city?: string;
	region?: string;
	country?: string;
	timezone?: string;
	isp?: string;
};

type AmlAgentInfo = {
	is_desktop?: boolean;
	is_phone?: boolean;
	device_name?: string;
	useragent?: string;
	browser_name?: string;
	platform_name?: string;
};

export type AmlScreeningResponsePayload = UnknownRecord & {
	reference?: string;
	event?: string;
	country?: string;
	email?: string;
	customer_unique_id?: string;
	verification_data?: AmlVerificationData;
	verification_result?: {
		background_checks?: boolean | string | number;
	};
	info?: {
		agent?: AmlAgentInfo;
		geolocation?: AmlGeoLocation;
	};
	background_checks?: AmlBackgroundChecksInput;
};

export type AmlScreeningVerificationRequestDetail = Omit<
	VerificationRequestDetail,
	"verification_type" | "input_data" | "response_data"
> & {
	verification_type: "aml_screening";
	input_data: UnknownRecord & {
		email?: string;
		country?: string;
		language?: string;
		reference?: string;
		background_checks?: AmlBackgroundChecksInput;
	};
	response_data: AmlScreeningResponsePayload
	
};

export function isAmlScreeningVerificationDetail(
	verification: VerificationRequestDetail,
): verification is AmlScreeningVerificationRequestDetail {
	return verification.verification_type === "aml_screening";
}

type DocumentVerificationInputName = {
	first_name?: string;
	last_name?: string;
	fuzzy_match?: string;
};

type DocumentVerificationInputDocument = {
	name?: DocumentVerificationInputName;
	proof?: string;
	allow_online?: string;
	allow_offline?: string;
	verification_mode?: string;
	fetch_enhanced_data?: string;
	backside_proof_required?: string;
};

type DocumentVerificationDataDocument = {
	name?: {
		first_name?: string;
		last_name?: string;
	};
	country?: string;
	selected_type?: string[];
	supported_types?: string[];
};

type DocumentVerificationResultDocument = {
	document?: number | null;
	document_country?: number | null;
	document_must_not_be_expired?: number | null;
	document_proof?: number | null;
	document_visibility?: number | null;
	name?: number | null;
	selected_type?: number | null;
};

type DocumentVerificationGeoLocation = UnknownRecord & {
	ip?: string;
	city?: string;
	region_name?: string;
	country_name?: string;
	country_code?: string;
	timezone?: string;
	isp?: string;
};

type DocumentVerificationAgentInfo = {
	is_desktop?: boolean;
	is_phone?: boolean;
	device_name?: string;
	useragent?: string;
	browser_name?: string;
	platform_name?: string;
};

type DocumentVerificationAdditionalProof = UnknownRecord & {
	dob?: string;
	gender?: string;
	full_name?: string;
	first_name?: string;
	last_name?: string;
	nationality?: string;
	place_of_birth?: string;
	document_number?: string;
	document_type?: string;
	document_country?: string;
	document_country_code?: string;
	document_official_name?: string;
};

export type DocumentVerificationResponsePayload = UnknownRecord & {
	reference?: string;
	event?: string;
	country?: string | null;
	email?: string;
	customer_unique_id?: string;
	verification_data?: {
		document?: DocumentVerificationDataDocument;
	};
	verification_result?: {
		document?: DocumentVerificationResultDocument;
	};
	info?: {
		agent?: DocumentVerificationAgentInfo;
		geolocation?: DocumentVerificationGeoLocation;
	};
	additional_data?: {
		document?: {
			proof?: DocumentVerificationAdditionalProof;
		};
	};
	declined_reason?: string;
	declined_codes?: string[];
	status?: string;
};

export type DocumentVerificationRequestDetail = Omit<
	VerificationRequestDetail,
	"verification_type" | "input_data" | "response_data"
> & {
	verification_type: "id_document";
	input_data: UnknownRecord & {
		ttl?: number;
		email?: string;
		country?: string;
		language?: string;
		reference?: string;
		document?: DocumentVerificationInputDocument;
	};
	response_data: DocumentVerificationResponsePayload;	
};

export function isDocumentVerificationDetail(
	verification: VerificationRequestDetail,
): verification is DocumentVerificationRequestDetail {
	return verification.verification_type === "id_document";
}

type GovernmentRegistryChecksVerificationType =
	(typeof VERIFICATION_TYPES_BY_PRODUCT["Government Registry Checks"])[number] |
		"government_registry_checks" |
		"government-registry-checks";

export type GovernmentRegistryChecksResponsePayload = UnknownRecord & {
	data?: UnknownRecord;
	status?: boolean | string;
	message?: string;
	event?: string;
	email?: string;
	country?: string;
	customer_unique_id?: string;
	info?: UnknownRecord;
	verification_data?: UnknownRecord;
	verification_result?: UnknownRecord;
};

export type GovernmentRegistryChecksVerificationRequestDetail = Omit<
	VerificationRequestDetail,
	"verification_type" | "input_data" | "response_data"
> & {
	verification_type: GovernmentRegistryChecksVerificationType;
	input_data: UnknownRecord & {
		nin?: string;
		bvn?: string;
		id?: string;
		phone_number?: string;
		email?: string;
		country?: string;
		reference?: string;
	};
	response_data: GovernmentRegistryChecksResponsePayload;
};

const GOVERNMENT_REGISTRY_CHECKS_TYPES = [
	...VERIFICATION_TYPES_BY_PRODUCT["Government Registry Checks"],
	"government_registry_checks",
	"government-registry-checks",
] as const;

export function isGovernmentRegistryChecksVerificationDetail(
	verification: VerificationRequestDetail,
): verification is GovernmentRegistryChecksVerificationRequestDetail {
	return GOVERNMENT_REGISTRY_CHECKS_TYPES.includes(
		verification.verification_type as GovernmentRegistryChecksVerificationType,
	);
}
