import { z } from "zod";

import type {
	V2AxiosError,
	V2MessageSuccessResponse,
	V2PaginatedSuccessResponse,
	V2SuccessResponse,
} from "#/api/http/shared";
import {
	isBlockedregisterEmailDomain,
	PUBLIC_EMAIL_DOMAIN_ERROR_MESSAGE,
} from "#/lib/validators";

export const UserRoleSchema = z.enum(["admin", "member"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserListSortBySchema = z.enum([
	"asc",
	"dec",
	"desc",
	"recently_created",
	"recently_logged_in",
]);
export type UserListSortBy = z.infer<typeof UserListSortBySchema>;

export const UserLoginSchema = z.object({
	email: z
		.email({ message: "Invalid email address" })
		.refine((value) => !isBlockedregisterEmailDomain(value), {
			message: PUBLIC_EMAIL_DOMAIN_ERROR_MESSAGE,
		}),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
});

export type UserLoginPayload = z.infer<typeof UserLoginSchema>;

export type UserLoginMutationInput = {
	payload: UserLoginPayload;
};

export const UserRegisterSchema = z.object({
	tenant_name: z.string().min(1, { message: "Tenant name is required" }),
	tenant_email: z.email({ message: "Invalid tenant email address" }),
	first_name: z.string().min(1, { message: "First name is required" }),
	last_name: z.string().min(1, { message: "Last name is required" }),
	email: z
		.email({ message: "Invalid email address" })
		.refine((value) => !isBlockedregisterEmailDomain(value), {
			message: PUBLIC_EMAIL_DOMAIN_ERROR_MESSAGE,
		}),
	phone_number: z.string().max(20).optional(),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
});

export type UserRegisterPayload = z.infer<typeof UserRegisterSchema>;

export const UserActivateAccountSchema = z.object({
	email: z.email({ message: "Invalid email address" }),
	code: z
		.string()
		.length(5, { message: "Activation code must be 5 characters" }),
});

export type UserActivateAccountPayload = z.infer<
	typeof UserActivateAccountSchema
>;

export const UserActivateAccountSearchSchema = z.object({
	email: z.email({ message: "Invalid email address" }),
});

export type UserActivateAccountSearch = z.infer<
	typeof UserActivateAccountSearchSchema
>;

export const AcceptInvitationSearchSchema = z.object({
	token: z.uuid({ message: "Invalid invitation token" }),
});

export type AcceptInvitationSearch = z.infer<typeof AcceptInvitationSearchSchema>;

export const AcceptInvitationNewUserFormSchema = z.object({
	token: z.uuid({ message: "Invalid invitation token" }),
	first_name: z.string().min(1, { message: "First name is required" }),
	last_name: z.string().min(1, { message: "Last name is required" }),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
});

export type AcceptInvitationNewUserFormValues = z.infer<
	typeof AcceptInvitationNewUserFormSchema
>;

export const InvitationAcceptSchema = z.object({
	token: z.uuid({ message: "Invalid invitation token" }),
});

export type InvitationAcceptPayload = z.infer<typeof InvitationAcceptSchema>;

export type InvitationCreateUserPayload = AcceptInvitationNewUserFormValues;

export const UserForgotPasswordSchema = z.object({
	email: z.email({ message: "Invalid email address" }),
});

export type UserForgotPasswordPayload = z.infer<
	typeof UserForgotPasswordSchema
>;

export const UserResendActivationCodeSchema = z.object({
	email: z.email({ message: "Invalid email address" }),
});

export type UserResendActivationCodePayload = z.infer<
	typeof UserResendActivationCodeSchema
>;

export const UserChangePasswordSchema = z.object({
	old_password: z.string().min(1, { message: "Current password is required" }),
	new_password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
});

export type UserChangePasswordPayload = z.infer<typeof UserChangePasswordSchema>;

export const UserChangePasswordFormSchema = UserChangePasswordSchema.extend({
	confirm_password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
}).refine((data) => data.new_password === data.confirm_password, {
	message: "Passwords do not match",
	path: ["confirm_password"],
});

export type UserChangePasswordFormValues = z.infer<
	typeof UserChangePasswordFormSchema
>;

export const UserResetPasswordSchema = z.object({
	token: z.uuid({ message: "Invalid reset token" }),
	new_password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
	confirm_new_password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
});

export type UserResetPasswordPayload = z.infer<typeof UserResetPasswordSchema>;

export const UserResetPasswordFormSchema = UserResetPasswordSchema.refine(
	(data) => data.new_password === data.confirm_new_password,
	{
		message: "Passwords do not match",
		path: ["confirm_new_password"],
	},
);

export type UserResetPasswordFormValues = z.infer<
	typeof UserResetPasswordFormSchema
>;

export const UserVerifyForgotPasswordTokenSchema = z.object({
	token: z.uuid({ message: "Invalid reset token" }),
});

export type UserVerifyForgotPasswordTokenPayload = z.infer<
	typeof UserVerifyForgotPasswordTokenSchema
>;

export const UserResetPasswordSearchSchema = UserVerifyForgotPasswordTokenSchema;

export type UserResetPasswordSearch = z.infer<
	typeof UserResetPasswordSearchSchema
>;

export const UserResetPasswordFormWithoutTokenSchema = UserResetPasswordSchema.omit({
	token: true,
}).refine((data) => data.new_password === data.confirm_new_password, {
	message: "Passwords do not match",
	path: ["confirm_new_password"],
});

export type UserResetPasswordFormWithoutTokenValues = z.infer<
	typeof UserResetPasswordFormWithoutTokenSchema
>;

export const UserLookupQuerySchema = z.object({
	email: z.email({ message: "Invalid email address" }),
});

export type UserLookupQuery = z.infer<typeof UserLookupQuerySchema>;

export const UserListQuerySchema = z.object({
	page: z.number().int().positive().optional(),
	per_page: z.number().int().positive().optional(),
	sort_by: UserListSortBySchema.optional(),
});

export type UserListQuery = z.infer<typeof UserListQuerySchema>;

export const UserMePutUpdateSchema = z.object({
	first_name: z.string().min(1, { message: "First name is required" }),
	last_name: z.string().min(1, { message: "Last name is required" }),
	phone_number: z.string().max(20).nullable(),
	avatar_url: z.url({ message: "Invalid avatar URL" }),
});

export type UserMePutUpdatePayload = z.infer<typeof UserMePutUpdateSchema>;

export const UserMePatchUpdateSchema = z.object({
	first_name: z.string().max(150).optional(),
	last_name: z.string().max(150).optional(),
	phone_number: z.string().max(20).nullable().optional(),
	avatar_url: z.url({ message: "Invalid avatar URL" }).max(200).optional(),
});

export type UserMePatchUpdatePayload = z.infer<typeof UserMePatchUpdateSchema>;

export const UserProfileUpdateFormSchema = z.object({
	first_name: z.string().min(1, { message: "First name is required" }),
	last_name: z.string().min(1, { message: "Last name is required" }),
	phone_number: z.string(),
});

export type UserProfileUpdateFormValues = z.infer<
	typeof UserProfileUpdateFormSchema
>;

export const UserAdminPutUpdateSchema = z.object({
	first_name: z.string().min(1, { message: "First name is required" }),
	last_name: z.string().min(1, { message: "Last name is required" }),
	phone_number: z.string().max(20).nullable(),
	avatar_url: z.url({ message: "Invalid avatar URL" }),
	is_active: z.boolean(),
});

export type UserAdminPutUpdatePayload = z.infer<typeof UserAdminPutUpdateSchema>;

export const UserAdminPatchUpdateSchema = z.object({
	first_name: z.string().max(150).optional(),
	last_name: z.string().max(150).optional(),
	phone_number: z.string().max(20).nullable().optional(),
	avatar_url: z.url({ message: "Invalid avatar URL" }).max(200).optional(),
	is_active: z.boolean().optional(),
});

export type UserAdminPatchUpdatePayload = z.infer<
	typeof UserAdminPatchUpdateSchema
>;

export interface UserTenantMembership {
	id: string;
	name: string;
	slug: string;
	email: string;
	enabled_countries: string[];
	role: UserRole;
	date_added: string;
	/** True when the user created this organization (not only invited into it). */
	is_owner?: boolean;
}

export interface UserSession {
	id: string;
	email: string;
	first_name?: string;
	last_name?: string;
	phone_number?: string | null;
	avatar_url?: string;
	is_active?: boolean;
	tenants: UserTenantMembership[];
}

export interface AdminUser extends UserSession {
	is_superuser: boolean;
	last_login: string | null;
	created_at: string;
}

export interface AuthResponseData {
	access_token: string;
	user: UserSession;
}

export interface RegisterResponseData {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	phone_number?: string | null;
	activation_code: string;
}

export interface ResendActivationCodeResponseData {
	activation_code: string;
}

export interface LookupResponseData {
	exists: boolean;
}

export interface RefreshTokenResponseData {
	access_token: string;
}

export interface VerifyForgotPasswordTokenResponseData {
	email: string;
	first_name: string;
	last_name: string;
}

export type AuthResponse = V2SuccessResponse<AuthResponseData>;
export type MeResponse = V2SuccessResponse<UserSession>;
export type AdminUserResponse = V2SuccessResponse<AdminUser>;
export type RegisterResponse = V2SuccessResponse<RegisterResponseData>;
export type ResendActivationCodeResponse =
	V2SuccessResponse<ResendActivationCodeResponseData>;
export type LookupResponse = V2SuccessResponse<LookupResponseData>;
export type RefreshTokenResponse = V2SuccessResponse<RefreshTokenResponseData>;
export type VerifyForgotPasswordTokenResponse =
	V2SuccessResponse<VerifyForgotPasswordTokenResponseData>;
export type PaginatedAdminUserListResponse =
	V2PaginatedSuccessResponse<AdminUser>;
export type MessageResponse = V2MessageSuccessResponse;

export interface PaginatedAdminUserListResult {
	items: AdminUser[];
	meta: NonNullable<PaginatedAdminUserListResponse["meta"]>;
	message: string;
}

export interface UserLoginError {
	message: string;
	status: number;
}

export type UserApiErrorResponse = V2AxiosError;
