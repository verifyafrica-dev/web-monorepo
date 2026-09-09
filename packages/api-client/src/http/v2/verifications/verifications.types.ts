import { z } from "zod";

import type {
	V2AxiosError,
	V2PaginatedSuccessResponse,
	V2SuccessResponse,
} from "../../shared";

export interface VerificationLink {
	id: string;
	link: string;
	inner_link: string;
	created_at: string;
	verification_id: string;
	verification_reference: string;
	provider: string;
	link_type?: "shufti" | "new_link" | string;
	ttl_minutes?: number | null;
	expires_at?: string | null;
	used_at?: string | null;
}

export interface VerificationRequest {
	id: string;
	verification_type: VerificationType | string;
	status: VerificationStatus | string;
	input_data: VerificationInputData;
	response_data: VerificationResponseData;
	cost_charged: string;
	currency: string;
	created_at: string;
	submitted_at: string | null;
	batch_id: string | null;
	reference?: string;
	source?: string;
	link?: VerificationLink | null;
	email_sent_at?: string | null;
	by_api: boolean | null;
	api_key_id: string | null;
}

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
	"AML Screening": ["aml_screening"],
	"Business AML Screening": ["business_aml_screening"],
	"Crypto Wallet Screening": ["crypto_wallet_screening"],
	"KYB Screening": ["kyb_screening"],
	"Risk Assessment": ["risk_assessment"],
	"Age Verification": ["age_verification"],
	"2FA Verification": ["two_fa_verification"],
	"Mixed Verification": ["mixed_verification"],
} as const satisfies Record<string, readonly VerificationType[]>;

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

export const VerificationRequestCreateSchema = z.object({
	verification_type: VerificationTypeSchema,
	input_data: z.record(z.string(), z.unknown()),
	method_type: z.string().optional(),
	notification_email: z.string().email().optional(),
});

export type VerificationRequestCreatePayload = z.infer<
	typeof VerificationRequestCreateSchema
>;

export const VERIFICATION_STATUS_OPTIONS = VerificationStatusSchema.options;
export const VERIFICATION_TYPE_OPTIONS = VerificationTypeSchema.options;

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

export interface VerificationInputDataBase {
	email?: string;
	country?: string;
	language?: string;
	ttl?: number;
	reference?: string;
	customer_unique_id?: string;
}

export interface VerificationCollectConfig {
	dob?: boolean;
	age?: boolean;
	gender?: boolean;
	backside_proof_required?: boolean;
	verification_instructions?: string;
}

export interface DocumentVerificationInputName {
	first_name?: string;
	last_name?: string;
	fuzzy_match?: string;
}

export interface DocumentVerificationInputDocument {
	name?: DocumentVerificationInputName;
	proof?: string;
	backside_proof?: string;
	allow_online?: string;
	allow_offline?: string;
	verification_mode?: string;
	fetch_enhanced_data?: string;
	backside_proof_required?: string;
	dob?: string;
	age?: number | string;
	gender?: string;
}

export interface DocumentVerificationInputData extends VerificationInputDataBase {
	document?: DocumentVerificationInputDocument;
	collect?: VerificationCollectConfig;
}

export interface AddressVerificationInputAddress {
	full_address?: string;
	proof?: string;
	supported_types?: string[];
	address_fuzzy_match?: string;
	verification_mode?: string;
}

export interface AddressVerificationInputData extends VerificationInputDataBase {
	address?: AddressVerificationInputAddress;
	collect?: Pick<VerificationCollectConfig, "verification_instructions">;
}

export interface FaceVerificationInputFace {
	proof?: string;
	verification_mode?: string;
	allow_offline?: string;
	allow_online?: string;
	check_duplicate_request?: string;
	age?: {
		min?: string;
		max?: string;
	};
}

export interface FaceVerificationInputData extends VerificationInputDataBase {
	face?: FaceVerificationInputFace;
	collect?: Pick<VerificationCollectConfig, "verification_instructions">;
}

export interface AmlBackgroundChecksName {
	full_name?: string;
	first_name?: string;
	last_name?: string;
	match_score?: number;
}

export interface AmlBackgroundChecksInput {
	name?: AmlBackgroundChecksName;
	filters?: string[];
	countries?: string[];
	match_score?: number;
	rca_search?: string;
	alias_search?: string;
	dob?: string;
	legacy_version?: string;
	ongoing?: string;
}

export interface AmlScreeningInputData extends VerificationInputDataBase {
	background_checks?: AmlBackgroundChecksInput;
}

export interface BusinessAmlScreeningInput {
	filters?: string[];
	match_score?: number;
	alias_search?: string;
	rca_search?: string;
	business_name?: string;
	business_incorporation_date?: string;
	countries?: string[];
}

export interface BusinessAmlScreeningInputData extends VerificationInputDataBase {
	aml_for_businesses?: BusinessAmlScreeningInput;
}

export interface CryptoWalletScreeningInputData extends VerificationInputDataBase {
	is_crypto_request?: boolean;
	verification_mode?: string;
	background_checks?: AmlBackgroundChecksInput;
}

export interface KybScreeningInput {
	company_registration_number?: string;
	company_jurisdiction_code?: string;
	search_type?: string;
}

export interface KybScreeningInputData extends VerificationInputDataBase {
	kyb?: KybScreeningInput;
}

export interface RiskAssessmentInput {
	phone_number?: string;
	risk_reference?: string;
}

export interface RiskAssessmentInputData extends VerificationInputDataBase {
	risk_assessment?: RiskAssessmentInput;
}

export interface GovernmentRegistryChecksInputData extends VerificationInputDataBase {
	nin?: string;
	bvn?: string;
	id?: string;
	phone_number?: string;
	last_name?: string;
	first_name?: string;
	date_of_birth?: string;
	selfie?: string;
}

export interface MixedVerificationInputData extends VerificationInputDataBase {
	is_mixed?: boolean;
	verification_id?: string;
	full_address?: string;
	notification_email?: string;
}

export interface VerificationInputData extends VerificationInputDataBase {
	document?: DocumentVerificationInputDocument;
	address?: AddressVerificationInputAddress;
	face?: FaceVerificationInputFace;
	collect?: VerificationCollectConfig;
	background_checks?: AmlBackgroundChecksInput;
	aml_for_businesses?: BusinessAmlScreeningInput;
	kyb?: KybScreeningInput;
	risk_assessment?: RiskAssessmentInput;
	is_crypto_request?: boolean;
	verification_mode?: string;
	nin?: string;
	bvn?: string;
	id?: string;
	phone_number?: string;
	last_name?: string;
	first_name?: string;
	date_of_birth?: string;
	selfie?: string;
	is_mixed?: boolean;
	verification_id?: string;
	full_address?: string;
	notification_email?: string;
}

export interface VerificationAgentInfo {
	is_desktop?: boolean;
	is_phone?: boolean;
	device_name?: string;
	useragent?: string;
	browser_name?: string;
	platform_name?: string;
	fingerprint_id?: string;
}

export interface VerificationGeoLocation {
	host?: string;
	ip?: string;
	rdns?: string;
	asn?: string;
	isp?: string;
	country?: string;
	country_name?: string;
	country_code?: string;
	region?: string;
	region_name?: string;
	region_code?: string;
	city?: string;
	postal_code?: string;
	continent_name?: string;
	continent_code?: string;
	latitude?: string;
	longitude?: string;
	metro_code?: string;
	timezone?: string;
	ip_type?: string;
	capital?: string;
	currency?: string;
}

export interface DocumentVerificationDataDocument {
	name?: {
		first_name?: string;
		last_name?: string;
	};
	country?: string;
	selected_type?: string[];
	supported_types?: string[];
}

export interface DocumentVerificationResultDocument {
	document?: number | null;
	document_country?: number | null;
	document_must_not_be_expired?: number | null;
	document_proof?: number | null;
	document_visibility?: number | null;
	name?: number | null;
	selected_type?: number | null;
}

export interface DocumentVerificationAdditionalProof {
	dob?: string;
	mrz?: string;
	face?: string;
	gender?: string;
	country?: string;
	category?: string;
	authority?: string;
	full_name?: string;
	last_name?: string;
	signature?: string;
	first_name?: string;
	issue_date?: string;
	expiry_date?: string;
	nationality?: string;
	country_code?: string;
	document_country?: string;
	country_native?: string;
	place_of_birth?: string;
	document_number?: string;
	personal_number?: string;
	document_country_code?: string;
	nationality_native?: string;
	document_type?: string;
	document_official_name?: string;
}

export interface AmlVerificationData {
	background_checks?: {
		name?: AmlBackgroundChecksName;
		aml_data?: {
			filters?: string[];
			hits?: Record<string, unknown>[];
		};
	};
}

export interface AmlScreeningResponsePayload {
	reference?: string;
	event?: string;
	country?: string;
	email?: string;
	customer_unique_id?: string;
	verification_url?: string;
	verification_data?: AmlVerificationData;
	verification_result?: {
		background_checks?: boolean | string | number;
	};
	info?: {
		agent?: VerificationAgentInfo;
		geolocation?: VerificationGeoLocation;
	};
	background_checks?: AmlBackgroundChecksInput;
	proofs?: VerificationProofs;
	declined_reason?: string;
	declined_codes?: string[];
	status?: string;
}

export interface GovernmentRegistryChecksResponsePayload {
	data?: Record<string, unknown>;
	status?: boolean | string;
	message?: string;
	event?: string;
	email?: string;
	country?: string;
	customer_unique_id?: string;
	info?: Record<string, unknown>;
	verification_data?: Record<string, unknown>;
	verification_result?: Record<string, unknown>;
	verification_url?: string;
}

export interface VerificationResponseData {
	reference?: string;
	event?: string;
	country?: string | null;
	email?: string;
	customer_unique_id?: string;
	proofs?: VerificationProofs;
	verification_url?: string;
	data?: Record<string, unknown>;
	message?: string;
	status?: boolean | string;
	verification_data?: {
		document?: DocumentVerificationDataDocument;
		background_checks?: AmlVerificationData["background_checks"];
	};
	verification_result?: {
		document?: DocumentVerificationResultDocument;
		background_checks?: boolean | string | number;
	};
	info?: {
		agent?: VerificationAgentInfo;
		geolocation?: VerificationGeoLocation;
	};
	additional_data?: {
		document?: {
			proof?: DocumentVerificationAdditionalProof;
		};
	};
	background_checks?: AmlBackgroundChecksInput;
	declined_reason?: string;
	declined_codes?: string[];
}

export type AmlScreeningVerificationRequestDetail = Omit<
	VerificationRequestDetail,
	"verification_type"
> & {
	verification_type: "aml_screening";
};

export function isAmlScreeningVerificationDetail(
	verification: VerificationRequestDetail,
): verification is AmlScreeningVerificationRequestDetail {
	return verification.verification_type === "aml_screening";
}

export type DocumentVerificationRequestDetail = Omit<
	VerificationRequestDetail,
	"verification_type"
> & {
	verification_type: "id_document";
};

export function isDocumentVerificationDetail(
	verification: VerificationRequestDetail,
): verification is DocumentVerificationRequestDetail {
	return verification.verification_type === "id_document";
}

type GovernmentRegistryChecksVerificationType =
	| (typeof VERIFICATION_TYPES_BY_PRODUCT)["Government Registry Checks"][number]
	| "government_registry_checks"
	| "government-registry-checks";

export type GovernmentRegistryChecksVerificationRequestDetail = Omit<
	VerificationRequestDetail,
	"verification_type"
> & {
	verification_type: GovernmentRegistryChecksVerificationType;
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
