import type { AxiosError } from "axios";
import { z } from "zod";
import type { UserTenantMembership } from "#/api/http/v1/tenants/tenants.types";
import {
	isBlockedregisterEmailDomain,
	PUBLIC_EMAIL_DOMAIN_ERROR_MESSAGE,
} from "#/lib/validators";

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
	rememberMe: boolean;
};

export const UserRegisterSchema = z.object({
	tenant_name: z.string().min(1, { message: "Tenant name is required" }),
	tenant_email: z.email({ message: "Invalid tenant email address" }),
	first_name: z.string().min(1, { message: "First name is required" }),
	last_name: z.string().min(1, { message: "Last name is required" }),
	email: z.email({ message: "Invalid email address" }),
	phone_number: z.string().optional(),
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

export const UserResetPasswordSchema = z.object({
	email: z.email({ message: "Invalid email address" }),
	code: z.string().min(1, { message: "Reset code is required" }),
	new_password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" }),
});

export type UserResetPasswordPayload = z.infer<typeof UserResetPasswordSchema>;

export const UserResetPasswordSearchSchema = z.object({
	email: z.email({ message: "Invalid email address" }),
});

export const UserResetPasswordFormSchema = UserResetPasswordSchema.omit({
	code: true,
})
	.extend({
		code: z.string().length(5, { message: "Reset code must be 5 characters" }),
		confirm_password: z
			.string()
			.min(8, { message: "Password must be at least 8 characters long" }),
	})
	.refine((data) => data.new_password === data.confirm_password, {
		message: "Passwords do not match",
		path: ["confirm_password"],
	});

export type UserResetPasswordFormValues = z.infer<
	typeof UserResetPasswordFormSchema
>;

export const UserTokenRefreshSchema = z.object({
	refresh: z.string().min(1, { message: "Refresh token is required" }),
});

export type UserTokenRefreshPayload = z.infer<typeof UserTokenRefreshSchema>;

export const UserLookupQuerySchema = z.object({
	email: z.email({ message: "Invalid email address" }),
});

export type UserLookupQuery = z.infer<typeof UserLookupQuerySchema>;

export const UserProfileUpdateSchema = z.object({
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	phone_number: z.string().optional(),
	avatar_url: z.url({ message: "Invalid avatar URL" }).optional(),
});

export type UserProfileUpdatePayload = z.infer<typeof UserProfileUpdateSchema>;

export const UserProfileUpdateFormSchema = z.object({
	first_name: z.string().min(1, { message: "First name is required" }),
	last_name: z.string().min(1, { message: "Last name is required" }),
	phone_number: z.string(),
});

export type UserProfileUpdateFormValues = z.infer<
	typeof UserProfileUpdateFormSchema
>;

export const UserDetailUpdateSchema = z.object({
	email: z.email({ message: "Invalid email address" }).optional(),
	first_name: z.string().optional(),
	last_name: z.string().optional(),
	phone_number: z.string().optional(),
	avatar_url: z.url({ message: "Invalid avatar URL" }).optional(),
	is_active: z.boolean().optional(),
});

export type UserDetailUpdatePayload = z.infer<typeof UserDetailUpdateSchema>;

export interface UserLoginResponse {
	// OpenAPI maps login response to the Login serializer.
	// In practice backend may include token keys.
	refresh: string;
	access: string;
}

export interface UserActivateAccountResponse {
	email: string;
	code: string;
}

export interface UserForgotPasswordResponse {
	email: string;
}

export interface UserResendActivationCodeResponse {
	email: string;
}

export interface UserResetPasswordResponse {
	email: string;
	code: string;
	new_password?: string;
}

export interface UserTokenRefreshResponse {
	access: string;
}

export interface UserLookupResponse {
	exists: boolean;
}

export interface UserRegisterResponse {
	tenant_name: string;
	tenant_email: string;
	first_name: string;
	last_name: string;
	email: string;
	// phone_number?: string;
}

export interface UserDetail {
	id: string;
	email: string;
	first_name?: string;
	last_name?: string;
	phone_number?: string;
	avatar_url?: string;
	tenants: UserTenantMembership | UserTenantMembership[] | null;
	is_active?: boolean;
	last_login?: string | null;
	created_at: string;
}

export interface PaginatedUserDetailListResponse {
	next: string | null;
	previous: string | null;
	results: UserDetail[];
}

export interface UserProfileUpdateResponse {
	first_name?: string;
	last_name?: string;
	phone_number?: string;
	avatar_url?: string;
}

export interface UserAdminResetPasswordResponse {
	detail: string;
}

export type UserChangePasswordPayload = {
	old_password: string;
	new_password: string;
};

export const UserChangePasswordFormSchema = z
	.object({
		old_password: z
			.string()
			.min(1, { message: "Current password is required" }),
		new_password: z
			.string()
			.min(8, { message: "Password must be at least 8 characters long" }),
		confirm_password: z
			.string()
			.min(8, { message: "Password must be at least 8 characters long" }),
	})
	.refine((data) => data.new_password === data.confirm_password, {
		message: "Passwords do not match",
		path: ["confirm_password"],
	});

export type UserChangePasswordFormValues = z.infer<
	typeof UserChangePasswordFormSchema
>;

export type UserChangePasswordResponse = {
	detail: string;
};

export type UserLogoutResponse = {
	detail: string;
};

export interface UserLoginError {
	message: string;
	status: number;
}

export type UserResetPasswordErrorResponse = AxiosError<{
	non_field_errors: string[];
}>;

export type UserChangePasswordErrorResponse = AxiosError<{
	old_password?: string[];
	new_password?: string[];
	detail?: string;
}>;

export interface UserAuthTokenInvalidErrorResponse {
	detail: string;
	code: string;
	messages: {
		token_class: string;
		token_type: string;
		message: string;
	}[];
}
