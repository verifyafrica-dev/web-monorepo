import type {
	BillingInformationStatus,
	BillingPlan,
} from "#/api/http/v2/billing/billing.types";
import { z } from "zod";

import type {
	V2AxiosError,
	V2MessageSuccessResponse,
	V2PaginatedSuccessResponse,
	V2SuccessResponse,
} from "#/api/http/shared";

export type { SupportedCountry } from "#/api/http/v1/tenants/tenants.types";

export const TenantRoleSchema = z.enum(["admin", "member"]);
export type TenantRole = z.infer<typeof TenantRoleSchema>;

export const KycStatusSchema = z.enum([
	"draft",
	"submitted",
	"verified",
	"rejected",
]);
export type KycStatus = z.infer<typeof KycStatusSchema>;

export const InvitationStatusSchema = z.enum([
	"pending",
	"accepted",
	"expired",
	"canceled",
]);
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

export const KycComplianceSectionSchema = z.enum([
	"authorized-signature",
	"basic-information",
	"business-activity",
	"compliance-declarations",
	"directors-and-shareholders",
	"onboarding-questionnaire",
	"primary-contact",
]);
export type KycComplianceSection = z.infer<typeof KycComplianceSectionSchema>;

export const KycDocumentKeySchema = z.enum([
	"directors_identification",
	"proof_of_business_address",
	"proof_of_directors_address",
	"proof_of_website_domain_ownership",
	"legal_company_license",
]);
export type KycDocumentKey = z.infer<typeof KycDocumentKeySchema>;

export const TenantListQuerySchema = z.object({
	page: z.number().int().positive().optional(),
	per_page: z.number().int().positive().optional(),
	total_in_page: z.number().int().positive().optional(),
});

export type TenantListQuery = z.infer<typeof TenantListQuerySchema>;

export const TenantAllListKycStatusFilterSchema = z.enum([
	"verified",
	"pending",
	"not_started",
]);
export type TenantAllListKycStatusFilter = z.infer<
	typeof TenantAllListKycStatusFilterSchema
>;

export const TenantAllListQuerySchema = TenantListQuerySchema.extend({
	search: z.string().optional(),
	billing_plan: z.enum(["payg", "enterprise"]).optional(),
	kyc_status: TenantAllListKycStatusFilterSchema.optional(),
});

export type TenantAllListQuery = z.infer<typeof TenantAllListQuerySchema>;

export interface SectionRejectedReason {
	basic_information: string | null;
	primary_contact: string | null;
	directors_and_shareholders: string | null;
	business_activity: string | null;
	onboarding_questionnaire: string | null;
	documents_upload: string | null;
	compliance_declarations: string | null;
	authorized_signature: string | null;
}

export interface KycSummary {
	kyc_verified: boolean;
	kyc_status: KycStatus;
	kyc_submitted_at: string | null;
	kyc_last_submission_date: string | null;
	kyc_rejected_at: string | null;
}

export interface ComplianceData {
	basic_information: Record<string, unknown>;
	primary_contact: Record<string, unknown>;
	directors_and_shareholders: Record<string, unknown>;
	business_activity: Record<string, unknown>;
	onboarding_questionnaire: Record<string, unknown>;
	documents_upload: Record<string, unknown[]>;
	compliance_declarations: boolean;
	authorized_signature: Record<string, unknown>;
}

export interface KycCompletionStatus {
	basic_information: boolean;
	primary_contact: boolean;
	directors_and_shareholders: boolean;
	business_activity: boolean;
	onboarding_questionnaire: boolean;
	documents_upload: boolean;
	compliance_declarations: boolean;
	authorized_signature: boolean;
}

export interface KycUploadedDocument {
	id: string;
	file_name: string;
	file_size: number;
	file_type: string;
	uploaded_at: string;
	url: string;
	storage_path: string;
	author?: string;
}

export interface TenantDetail {
	id: string;
	name: string;
	slug: string;
	created_at: string;
	compliance_data: ComplianceData | Record<string, unknown>;
	enabled_countries: string[] | Record<string, unknown>;
	kyc: KycSummary;
	general_rejected_reason: string | null;
	section_rejected_reason: SectionRejectedReason;
	stripe_customer_id?: string;
	email: string;
}

export interface TenantListItem {
	id: string;
	name: string;
	slug: string;
	email: string;
	enabled_countries: string[] | Record<string, unknown>;
	kyc_verified: boolean;
	stripe_customer_id?: string;
	created_at: string;
	role: TenantRole;
	membership_active: boolean;
	joined_at: string;
}

export interface TenantAllListBilling {
	id: string;
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

export interface TenantAllListItem {
	id: string;
	name: string;
	slug: string;
	email: string;
	enabled_countries: string[] | Record<string, unknown>;
	kyc_verified: boolean;
	kyc_status: KycStatus;
	stripe_customer_id?: string;
	created_at: string;
	billing: TenantAllListBilling | null;
}

export interface TenantAPIKey {
	key: string;
	is_active: boolean;
	last_used: string | null;
	expires_at: string | null;
}

export interface TenantWebhook {
	id: string;
	url: string;
	is_active: boolean;
	use_auth: boolean;
	auth_token: string;
	retry_count: number;
	created_at: string;
	updated_at: string;
}

export interface TenantInvitation {
	id: string;
	email: string;
	role: TenantRole;
	name: string;
	invitation_url: string;
	expires_at: string;
	status: InvitationStatus;
}

export interface TenantInvitationVerifyTenant {
	id: string;
	name: string;
	email: string;
}

export interface TenantInvitationVerifyData {
	email: string;
	role: TenantRole;
	name: string;
	tenant: TenantInvitationVerifyTenant;
}

export interface TenantInvitationAcceptData {
	email: string;
	role: TenantRole;
	name: string;
	tenant_id: string;
}

export interface TenantUser {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
	avatar_url: string;
	is_active: boolean;
	role: TenantRole;
	membership_active: boolean;
	last_login: string | null;
	joined_at: string;
}

export interface TenantVerificationConfigRow {
	verification_type: string;
	source: string;
	global_price: string | null;
	global_is_active: boolean;
	has_override: boolean;
	override_is_enabled: boolean | null;
	override_price: string | null;
	effective_is_enabled: boolean;
	effective_price: string | null;
}

export interface TenantVerificationConfigListData {
	configs: TenantVerificationConfigRow[];
}

export interface TenantComplianceDataPayload {
	compliance_data: ComplianceData | Record<string, unknown>;
	completion_status: KycCompletionStatus;
	kyc: KycSummary;
}

export interface TenantComplianceDocumentRegisterData {
	document: KycUploadedDocument;
	compliance_data: Record<string, unknown>;
	completion_status: KycCompletionStatus;
}

export const TenantSelfServiceCreateSchema = z.object({
	name: z.string().min(1, { message: "Tenant name is required" }),
	email: z.email({ message: "Invalid email address" }),
});

export type TenantSelfServiceCreatePayload = z.infer<
	typeof TenantSelfServiceCreateSchema
>;

export const TenantStaffCreateSchema = TenantSelfServiceCreateSchema.extend({
	admin_email: z.email({ message: "Invalid admin email address" }),
	admin_first_name: z
		.string()
		.min(1, { message: "Admin first name is required" }),
	admin_last_name: z
		.string()
		.min(1, { message: "Admin last name is required" }),
	admin_phone_number: z.string().optional(),
});

export type TenantStaffCreatePayload = z.infer<typeof TenantStaffCreateSchema>;

export type TenantCreatePayload =
	| TenantSelfServiceCreatePayload
	| TenantStaffCreatePayload;

export const TenantUpdateSchema = z.object({
	name: z.string().min(1, { message: "Tenant name is required" }).optional(),
	email: z.email({ message: "Invalid email address" }).optional(),
	enabled_countries: z.array(z.string()).optional(),
	kyc_verified: z.boolean().optional(),
	general_rejected_reason: z.string().optional(),
	section_rejected_reason: z
		.object({
			basic_information: z.string().nullable().optional(),
			primary_contact: z.string().nullable().optional(),
			directors_and_shareholders: z.string().nullable().optional(),
			business_activity: z.string().nullable().optional(),
			onboarding_questionnaire: z.string().nullable().optional(),
			documents_upload: z.string().nullable().optional(),
			compliance_declarations: z.string().nullable().optional(),
			authorized_signature: z.string().nullable().optional(),
		})
		.optional(),
	reject_reason: z.string().optional(),
});

export type TenantUpdatePayload = z.infer<typeof TenantUpdateSchema>;

export const TenantAPIKeyUpdateSchema = z.object({
	key: z.string().optional(),
	is_active: z.boolean().optional(),
	expires_at: z.string().nullable().optional(),
});

export type TenantAPIKeyUpdatePayload = z.infer<typeof TenantAPIKeyUpdateSchema>;

export const TenantAPIKeyPutUpdateSchema = z.object({
	key: z.string().optional(),
	is_active: z.boolean(),
	expires_at: z.string().nullable().optional(),
});

export type TenantAPIKeyPutUpdatePayload = z.infer<
	typeof TenantAPIKeyPutUpdateSchema
>;

export const TenantWebhookCreateSchema = z.object({
	url: z.url({ message: "Invalid webhook URL" }).max(200),
	is_active: z.boolean().optional(),
	use_auth: z.boolean().optional(),
	auth_token: z.string().max(255).optional(),
	retry_count: z.number().int().optional(),
});

export type TenantWebhookCreatePayload = z.infer<
	typeof TenantWebhookCreateSchema
>;

export const TenantWebhookUpdateSchema = TenantWebhookCreateSchema.partial();

export type TenantWebhookUpdatePayload = z.infer<
	typeof TenantWebhookUpdateSchema
>;

export const TenantInvitationCreateSchema = z.object({
	email: z.email({ message: "Invalid email address" }),
	role: TenantRoleSchema.default("member"),
	name: z.string().max(150).optional(),
});

export type TenantInvitationCreatePayload = z.infer<
	typeof TenantInvitationCreateSchema
>;

export const TenantInvitationAcceptSchema = z.object({
	token: z.uuid({ message: "Invalid invitation token" }),
});

export type TenantInvitationAcceptPayload = z.infer<
	typeof TenantInvitationAcceptSchema
>;

export const TenantInvitationVerifySchema = z.object({
	token: z.uuid({ message: "Invalid invitation token" }),
});

export type TenantInvitationVerifyPayload = z.infer<
	typeof TenantInvitationVerifySchema
>;

export const TenantInvitationCreateUserSchema = z.object({
	token: z.uuid({ message: "Invalid invitation token" }),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
	phone_number: z.string().optional(),
});

export type TenantInvitationCreateUserPayload = z.infer<
	typeof TenantInvitationCreateUserSchema
>;

export const TenantUserRoleUpdateSchema = z.object({
	role: TenantRoleSchema,
});

export type TenantUserRoleUpdatePayload = z.infer<
	typeof TenantUserRoleUpdateSchema
>;

export const TenantUserMembershipUpdateSchema = z.object({
	membership_active: z.boolean(),
});

export type TenantUserMembershipUpdatePayload = z.infer<
	typeof TenantUserMembershipUpdateSchema
>;

const KYC_DATA_URL_PATTERN =
	/^data:(image\/(?:jpeg|png|gif)|application\/pdf);base64,.+/i;

function isValidKycDocumentUrl(value: string) {
	if (KYC_DATA_URL_PATTERN.test(value)) {
		return import.meta.env.DEV;
	}

	return z.url().safeParse(value).success;
}

export const TenantComplianceDocumentRegisterSchema = z.object({
	document_key: KycDocumentKeySchema,
	url: z
		.string()
		.min(1)
		.refine(isValidKycDocumentUrl, { message: "Invalid document URL" }),
	storage_path: z.string().min(1),
	file_name: z.string().min(1),
	file_size: z.number().int().positive(),
	file_type: z.string().min(1),
});

export type TenantComplianceDocumentRegisterPayload = z.infer<
	typeof TenantComplianceDocumentRegisterSchema
>;

export const TenantComplianceDocumentDeleteSchema = z.object({
	document_key: KycDocumentKeySchema,
	document_id: z.string().min(1),
});

export type TenantComplianceDocumentDeletePayload = z.infer<
	typeof TenantComplianceDocumentDeleteSchema
>;

export interface TenantComplianceDocumentDeleteData {
	document: KycUploadedDocument;
	compliance_data: ComplianceData | Record<string, unknown>;
	completion_status: KycCompletionStatus;
	kyc: KycSummary;
}

export const TenantVerificationConfigUpsertSchema = z.object({
	verification_type: z.string().min(1),
	is_enabled: z.boolean().optional(),
	price: z.string().nullable().optional(),
});

export const TenantVerificationConfigUpdateSchema = z.object({
	configs: z.array(TenantVerificationConfigUpsertSchema).min(1),
});

export type TenantVerificationConfigUpdatePayload = z.infer<
	typeof TenantVerificationConfigUpdateSchema
>;

export type KycSectionUpdatePayload = Record<string, unknown>;

export type TenantDetailResponse = V2SuccessResponse<TenantDetail>;
export type TenantListResponse = V2PaginatedSuccessResponse<TenantListItem>;
export type TenantAllListResponse = V2PaginatedSuccessResponse<TenantAllListItem>;
export type TenantInvitationListResponse =
	V2PaginatedSuccessResponse<TenantInvitation>;
export type TenantUserListResponse = V2PaginatedSuccessResponse<TenantUser>;
export type SupportedCountryListResponse = V2SuccessResponse<
	import("#/api/http/v1/tenants/tenants.types").SupportedCountry[]
>;
export type TenantAPIKeyResponse = V2SuccessResponse<TenantAPIKey>;
export type TenantWebhookResponse = V2SuccessResponse<TenantWebhook>;
export type TenantInvitationResponse = V2SuccessResponse<TenantInvitation>;
export type TenantComplianceDataResponse =
	V2SuccessResponse<TenantComplianceDataPayload>;
export type TenantComplianceDocumentRegisterResponse =
	V2SuccessResponse<TenantComplianceDocumentRegisterData>;
export type TenantComplianceDocumentDeleteResponse =
	V2SuccessResponse<TenantComplianceDocumentDeleteData>;
export type TenantInvitationVerifyResponse =
	V2SuccessResponse<TenantInvitationVerifyData>;
export type TenantInvitationAcceptResponse =
	V2SuccessResponse<TenantInvitationAcceptData>;
export type TenantVerificationConfigListResponse =
	V2SuccessResponse<TenantVerificationConfigListData>;
export type TenantUserResponse = V2SuccessResponse<TenantUser>;
export type MessageResponse = V2MessageSuccessResponse;

export interface PaginatedTenantListResult {
	items: TenantListItem[];
	meta: NonNullable<TenantListResponse["meta"]>;
	message: string;
}

export interface PaginatedTenantAllListResult {
	items: TenantAllListItem[];
	meta: NonNullable<TenantAllListResponse["meta"]>;
	message: string;
}

export interface PaginatedTenantInvitationListResult {
	items: TenantInvitation[];
	meta: NonNullable<TenantInvitationListResponse["meta"]>;
	message: string;
}

export interface PaginatedTenantUserListResult {
	items: TenantUser[];
	meta: NonNullable<TenantUserListResponse["meta"]>;
	message: string;
}

export type TenantApiErrorResponse = V2AxiosError;

// References still consumed from the v1 types module.
export type { PaginatedResponse, UserTenantMembership, PaginationQuery, BillingInformation } from "#/api/http/v1/tenants/tenants.types";
