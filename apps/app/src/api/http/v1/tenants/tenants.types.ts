import { z } from "zod";

export const TenantRoleSchema = z.enum(["admin", "member"]);
export type TenantRole = z.infer<typeof TenantRoleSchema>;

export const InvitationStatusSchema = z.enum([
	"pending",
	"accepted",
	"expired",
	"cancelled",
]);
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

export const TenantComplianceStatusEnumSchema = z.enum([
	"pending",
	"verified",
	"rejected",
]);
export type TenantComplianceStatusEnum = z.infer<
	typeof TenantComplianceStatusEnumSchema
>;

export const PaginationQuerySchema = z.object({
	offset: z.number().int().nonnegative().optional(),
	page_size: z.number().int().positive().optional(),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export interface PaginatedResponse<T> {
	next: string | null;
	previous: string | null;
	results: T[];
	count?: number;
}

export interface Tenant {
	id: string;
	name: string;
	slug?: string;
	created_at: string;
	compliance_data?: Record<string, unknown>;
	enabled_countries?: string[] | Record<string, unknown>;
	kyc_verified?: boolean;
	stripe_customer_id?: string;
	email?: string;
}

export interface UserTenantMembership {
	id: string;
	name: string;
	slug?: string;
	email: string;
	enabled_countries: string[];
	role: TenantRole;
	date_added: string;
	/** True when the user created this organization (not only invited into it). */
	is_owner?: boolean;
}

export interface TenantComplianceStatus {
	id: string;
	status: TenantComplianceStatusEnum;
	submitted_at: string;
	approved_by: string | null;
	approved_at: string | null;
	rejected_by: string | null;
	rejected_at: string | null;
	rejected_reason?: string;
}

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
	billing_plan: string;
	status?: string;
	created_at: string;
	updated_at: string;
}

export interface TenantCreateAndUpdate {
	id: string;
	name: string;
	slug?: string;
	email: string;
	compliance_data?: Record<string, unknown>;
	enabled_countries?: string[];
	kyc_verified?: boolean;
	created_at: string;
	compliance_status?: TenantComplianceStatus;
	reject_reason?: string;
	billing_information?: BillingInformation;
	custom_verification_cost?: string;
	use_custom_cost?: boolean;
	created_by?: string;
}

export interface SupportedCountry {
	code: string;
	name: string;
	region: string;
	flag_png: string | null;
}

export interface TenantAPIKey {
	key: string;
	is_active: boolean;
	last_used: string | null;
	expires_at: string | null;
}

export interface TenantWebHook {
	id: string;
	url: string;
	tenant: string;
	created_at: string;
	updated_at: string;
	is_active: boolean;
	use_auth: boolean;
	auth_token?: string;
	retry_count: number;
}

export interface Invitation {
	id: string;
	email: string;
	role: TenantRole;
	name?: string;
	tenant: Tenant;
	invitation_url: string;
	expires_at: string;
	status: InvitationStatus;
}

export interface AdminTenantCreateResponse {
	id: string;
	name: string;
	email: string;
}

export interface TenantDeleteResponse {
	detail: string;
}

export const TenantCreateFormSchema = z.object({
	name: z.string().min(1, { message: "Tenant name is required" }),
	email: z.email({ message: "Invalid email address" }),
	compliance_data: z.record(z.string(), z.unknown()).optional(),
});

export type TenantCreateFormValues = z.infer<typeof TenantCreateFormSchema>;
export type TenantCreatePayload = TenantCreateFormValues;

export const TenantUpdateFormSchema = z.object({
	name: z.string().min(1, { message: "Tenant name is required" }).optional(),
	email: z.email({ message: "Invalid email address" }).optional(),
	compliance_data: z.record(z.string(), z.unknown()).optional(),
	enabled_countries: z.array(z.string()).optional(),
	kyc_verified: z.boolean().optional(),
	reject_reason: z.string().optional(),
	custom_verification_cost: z.string().optional(),
	use_custom_cost: z.boolean().optional(),
});

export type TenantUpdateFormValues = z.infer<typeof TenantUpdateFormSchema>;
export type TenantUpdatePayload = TenantUpdateFormValues;

export const AdminTenantCreateFormSchema = z.object({
	name: z.string().min(1, { message: "Tenant name is required" }).max(150),
	email: z.email({ message: "Invalid tenant email address" }).max(254),
	admin_email: z.email({ message: "Invalid admin email address" }),
	admin_first_name: z
		.string()
		.min(1, { message: "Admin first name is required" }),
	admin_last_name: z
		.string()
		.min(1, { message: "Admin last name is required" }),
	admin_phone_number: z.string().optional(),
});

export type AdminTenantCreateFormValues = z.infer<
	typeof AdminTenantCreateFormSchema
>;
export type AdminTenantCreatePayload = AdminTenantCreateFormValues;

export const TenantAPIKeyUpdateFormSchema = z.object({
	is_active: z.boolean(),
});

export type TenantAPIKeyUpdateFormValues = z.infer<
	typeof TenantAPIKeyUpdateFormSchema
>;
export type TenantAPIKeyUpdatePayload = TenantAPIKeyUpdateFormValues;

export const TenantAPIKeyRotateFormSchema = z.object({
	key: z.literal("reset"),
	is_active: z.boolean().default(true),
});

export type TenantAPIKeyRotateFormValues = z.infer<
	typeof TenantAPIKeyRotateFormSchema
>;
export type TenantAPIKeyRotatePayload = TenantAPIKeyRotateFormValues;

export const TenantWebhookFormSchema = z.object({
	url: z.url({ message: "Invalid webhook URL" }).max(200),
	is_active: z.boolean().default(true),
	use_auth: z.boolean().default(false),
	auth_token: z.string().max(255).optional(),
	retry_count: z.number().int().default(0),
});

export type TenantWebhookFormValues = z.infer<typeof TenantWebhookFormSchema>;
export type TenantWebhookCreatePayload = TenantWebhookFormValues;

export const TenantWebhookUpdateFormSchema = TenantWebhookFormSchema.partial();

export type TenantWebhookUpdateFormValues = z.infer<
	typeof TenantWebhookUpdateFormSchema
>;
export type TenantWebhookUpdatePayload = TenantWebhookUpdateFormValues;

export const InvitationCreateFormSchema = z.object({
	email: z.email({ message: "Invalid email address" }),
	role: TenantRoleSchema.default("member"),
	name: z.string().optional(),
});

export type InvitationCreateFormValues = z.infer<
	typeof InvitationCreateFormSchema
>;
export type InvitationCreatePayload = InvitationCreateFormValues;

export const InvitationAcceptFormSchema = z.object({
	token: z.uuid({ message: "Invalid invitation token" }),
});

export type InvitationAcceptFormValues = z.infer<
	typeof InvitationAcceptFormSchema
>;
export type InvitationAcceptPayload = InvitationAcceptFormValues;

export const InvitationCompleteFormSchema = z.object({
	token: z.uuid({ message: "Invalid invitation token" }),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
	phone_number: z.string().optional(),
});

export type InvitationCompleteFormValues = z.infer<
	typeof InvitationCompleteFormSchema
>;
export type InvitationCompletePayload = InvitationCompleteFormValues;

export const UserRoleUpdateFormSchema = z.object({
	role: TenantRoleSchema,
});

export type UserRoleUpdateFormValues = z.infer<typeof UserRoleUpdateFormSchema>;
export type UserRoleUpdatePayload = UserRoleUpdateFormValues;

export type PaginatedTenantListResponse = PaginatedResponse<Tenant>;
export type PaginatedTenantManageListResponse =
	PaginatedResponse<TenantCreateAndUpdate>;
export type PaginatedInvitationListResponse = PaginatedResponse<Invitation>;
