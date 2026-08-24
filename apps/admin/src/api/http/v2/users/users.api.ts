import {
	unwrapV2Data,
	unwrapV2Message,
	unwrapV2Paginated,
} from "@verifyafrica/api-client/http/shared";
import $http from "../../xhr";
import type {
	AdminAuthResponseData,
	AdminChangePasswordWithOtpPayload,
	AdminRequestPasswordOtpPayload,
	AdminResetPasswordWithOtpPayload,
	AdminUser,
	AuthResponseData,
	InvitationAcceptPayload,
	InvitationCreateUserPayload,
	LookupResponseData,
	PaginatedAdminUserListResult,
	RegisterResponseData,
	ResendActivationCodeResponseData,
	UserActivateAccountPayload,
	UserAdminPatchUpdatePayload,
	UserAdminPutUpdatePayload,
	UserChangePasswordPayload,
	UserForgotPasswordPayload,
	UserListQuery,
	UserLoginPayload,
	UserLookupQuery,
	UserMePatchUpdatePayload,
	UserMePutUpdatePayload,
	UserRegisterPayload,
	UserResendActivationCodePayload,
	UserResetPasswordPayload,
	UserSession,
	UserVerifyForgotPasswordTokenPayload,
	VerifyForgotPasswordTokenResponseData,
} from "./users.types";

const USER_V2_ENDPOINTS = {
	list: "/v2/users/",
	detail: (id: string) => `/v2/users/${id}/`,
	adminResetPassword: (id: string) => `/v2/users/${id}/reset-password/`,
	activateAccount: "/v2/users/activate-account/",
	adminLogin: "/v2/users/admin/login/",
	adminForgotPassword: "/v2/users/admin/forgot-password/",
	adminResetPasswordWithOtp: "/v2/users/admin/reset-password/",
	adminRequestChangePasswordOtp: "/v2/users/admin/request-change-password-otp/",
	adminChangePasswordWithOtp: "/v2/users/admin/change-password-with-otp/",
	changePassword: "/v2/users/change-password/",
	forgotPassword: "/v2/users/forgot-password/",
	login: "/v2/users/login/",
	logout: "/v2/users/logout/",
	lookup: "/v2/users/lookup/",
	me: "/v2/users/me/",
	refreshToken: "/v2/users/refresh-token/",
	register: "/v2/users/register/",
	resendActivationCode: "/v2/users/resend-activation-code/",
	resetPassword: "/v2/users/reset-password/",
	verifyForgotPasswordToken: "/v2/users/verify-forgot-password-token/",
	invitationAccept: "/v2/tenants/invitations/accept/",
	invitationCreateUser: "/v2/tenants/invitations/create-user/",
} as const;

export const USERS_V2_API = {
	LIST: async (params?: UserListQuery): Promise<PaginatedAdminUserListResult> =>
		await $http
			.get(USER_V2_ENDPOINTS.list, { params })
			.then((res) => unwrapV2Paginated<AdminUser>(res)),

	DETAIL: async (id: string): Promise<AdminUser> =>
		await $http
			.get(USER_V2_ENDPOINTS.detail(id))
			.then((res) => unwrapV2Data<AdminUser>(res)),

	REPLACE_DETAIL: async (
		id: string,
		data: UserAdminPutUpdatePayload,
	): Promise<AdminUser> =>
		await $http
			.put(USER_V2_ENDPOINTS.detail(id), data)
			.then((res) => unwrapV2Data<AdminUser>(res)),

	UPDATE_DETAIL: async (
		id: string,
		data: UserAdminPatchUpdatePayload,
	): Promise<AdminUser> =>
		await $http
			.patch(USER_V2_ENDPOINTS.detail(id), data)
			.then((res) => unwrapV2Data<AdminUser>(res)),

	ADMIN_RESET_PASSWORD: async (userId: string): Promise<string> =>
		await $http
			.post(USER_V2_ENDPOINTS.adminResetPassword(userId), {})
			.then((res) => unwrapV2Message(res)),

	ACTIVATE_ACCOUNT: async (
		data: UserActivateAccountPayload,
	): Promise<AuthResponseData> =>
		await $http
			.post(USER_V2_ENDPOINTS.activateAccount, data)
			.then((res) => unwrapV2Data<AuthResponseData>(res)),

	CHANGE_PASSWORD: async (
		data: UserChangePasswordPayload,
	): Promise<string> =>
		await $http
			.post(USER_V2_ENDPOINTS.changePassword, data)
			.then((res) => unwrapV2Message(res)),

	FORGOT_PASSWORD: async (data: UserForgotPasswordPayload): Promise<string> =>
		await $http
			.post(USER_V2_ENDPOINTS.forgotPassword, data)
			.then((res) => unwrapV2Message(res)),

	LOGIN: async (data: UserLoginPayload): Promise<AuthResponseData> =>
		await $http
			.post(USER_V2_ENDPOINTS.login, data)
			.then((res) => unwrapV2Data<AuthResponseData>(res)),

	ADMIN_LOGIN: async (data: UserLoginPayload): Promise<AdminAuthResponseData> =>
		await $http
			.post(USER_V2_ENDPOINTS.adminLogin, data)
			.then((res) => unwrapV2Data<AdminAuthResponseData>(res)),

	ADMIN_REQUEST_CHANGE_PASSWORD_OTP: async (): Promise<string> =>
		await $http
			.post(USER_V2_ENDPOINTS.adminRequestChangePasswordOtp, {})
			.then((res) => unwrapV2Message(res)),

	ADMIN_CHANGE_PASSWORD_WITH_OTP: async (
		data: AdminChangePasswordWithOtpPayload,
	): Promise<string> =>
		await $http
			.post(USER_V2_ENDPOINTS.adminChangePasswordWithOtp, data)
			.then((res) => unwrapV2Message(res)),

	ADMIN_FORGOT_PASSWORD: async (
		data: AdminRequestPasswordOtpPayload,
	): Promise<string> =>
		await $http
			.post(USER_V2_ENDPOINTS.adminForgotPassword, data)
			.then((res) => unwrapV2Message(res)),

	ADMIN_RESET_PASSWORD_WITH_OTP: async (
		data: AdminResetPasswordWithOtpPayload,
	): Promise<string> =>
		await $http
			.post(USER_V2_ENDPOINTS.adminResetPasswordWithOtp, data)
			.then((res) => unwrapV2Message(res)),

	LOGOUT: async (): Promise<string> =>
		await $http
			.post(USER_V2_ENDPOINTS.logout, {})
			.then((res) => unwrapV2Message(res)),

	LOOKUP: async (params: UserLookupQuery): Promise<LookupResponseData> =>
		await $http
			.get(USER_V2_ENDPOINTS.lookup, { params })
			.then((res) => unwrapV2Data<LookupResponseData>(res)),

	ME: async (): Promise<UserSession> =>
		await $http
			.get(USER_V2_ENDPOINTS.me)
			.then((res) => unwrapV2Data<UserSession>(res)),

	REPLACE_ME: async (data: UserMePutUpdatePayload): Promise<UserSession> =>
		await $http
			.put(USER_V2_ENDPOINTS.me, data)
			.then((res) => unwrapV2Data<UserSession>(res)),

	UPDATE_ME: async (data: UserMePatchUpdatePayload): Promise<UserSession> =>
		await $http
			.patch(USER_V2_ENDPOINTS.me, data)
			.then((res) => unwrapV2Data<UserSession>(res)),

	REFRESH_TOKEN: async (): Promise<string> =>
		await $http
			.post(USER_V2_ENDPOINTS.refreshToken, {})
			.then((res) => unwrapV2Data<{ access_token: string }>(res))
			.then((data) => data.access_token),

	REGISTER: async (data: UserRegisterPayload): Promise<RegisterResponseData> =>
		await $http
			.post(USER_V2_ENDPOINTS.register, data)
			.then((res) => unwrapV2Data<RegisterResponseData>(res)),

	RESEND_ACTIVATION_CODE: async (
		data: UserResendActivationCodePayload,
	): Promise<ResendActivationCodeResponseData> =>
		await $http
			.post(USER_V2_ENDPOINTS.resendActivationCode, data)
			.then((res) => unwrapV2Data<ResendActivationCodeResponseData>(res)),

	RESET_PASSWORD: async (data: UserResetPasswordPayload): Promise<string> =>
		await $http
			.post(USER_V2_ENDPOINTS.resetPassword, data)
			.then((res) => unwrapV2Message(res)),

	VERIFY_FORGOT_PASSWORD_TOKEN: async (
		data: UserVerifyForgotPasswordTokenPayload,
	): Promise<VerifyForgotPasswordTokenResponseData> =>
		await $http
			.post(USER_V2_ENDPOINTS.verifyForgotPasswordToken, data)
			.then((res) => unwrapV2Data<VerifyForgotPasswordTokenResponseData>(res)),

	ACCEPT_INVITATION: async (data: InvitationAcceptPayload): Promise<string> =>
		await $http
			.post(USER_V2_ENDPOINTS.invitationAccept, data)
			.then((res) => unwrapV2Message(res)),

	CREATE_USER_FROM_INVITATION: async (
		data: InvitationCreateUserPayload,
	): Promise<string> =>
		await $http
			.post(USER_V2_ENDPOINTS.invitationCreateUser, data)
			.then((res) => unwrapV2Message(res)),
};
