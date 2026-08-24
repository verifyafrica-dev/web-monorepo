import $http from "../../xhr";
import type {
	PaginatedUserDetailListResponse,
	UserActivateAccountPayload,
	UserActivateAccountResponse,
	UserAdminResetPasswordResponse,
	UserChangePasswordPayload,
	UserChangePasswordResponse,
	UserDetail,
	UserDetailUpdatePayload,
	UserForgotPasswordPayload,
	UserForgotPasswordResponse,
	UserLoginPayload,
	UserLoginResponse,
	UserLogoutResponse,
	UserLookupQuery,
	UserLookupResponse,
	UserProfileUpdatePayload,
	UserProfileUpdateResponse,
	UserRegisterPayload,
	UserRegisterResponse,
	UserResendActivationCodePayload,
	UserResendActivationCodeResponse,
	UserResetPasswordPayload,
	UserResetPasswordResponse,
	UserTokenRefreshPayload,
	UserTokenRefreshResponse,
} from "./users.types";

const USER_ENDPOINTS = {
	list: "/users/",
	detail: (id: string) => `/users/${id}/`,
	adminResetPassword: (userId: string) => `/users/${userId}/reset-password/`,
	activateAccount: "/users/activate-account/",
	changePassword: "/users/change-password/",
	forgotPassword: "/users/forgot-password/",
	login: "/users/login/",
	logout: "/users/logout/",
	lookup: "/users/lookup/",
	me: "/users/me/",
	updateMe: "/users/me/update/",
	register: "/users/register/",
	resendActivationCode: "/users/resend-activation-code/",
	resetPassword: "/users/reset-password/",
	tokenRefresh: "/users/token/refresh/",
} as const;

export const USERS_API = {
	LIST: async (params?: { offset?: number; page_size?: number }) =>
		await $http
			.get<PaginatedUserDetailListResponse>(USER_ENDPOINTS.list, { params })
			.then((res) => res.data),

	DETAIL: async (id: string) =>
		await $http
			.get<UserDetail>(USER_ENDPOINTS.detail(id))
			.then((res) => res.data),

	UPDATE_DETAIL: async (id: string, data: UserDetailUpdatePayload) =>
		await $http
			.patch<UserDetail>(USER_ENDPOINTS.detail(id), data)
			.then((res) => res.data),

	ADMIN_RESET_PASSWORD: async (userId: string) =>
		await $http
			.post<UserAdminResetPasswordResponse>(
				USER_ENDPOINTS.adminResetPassword(userId),
				{},
			)
			.then((res) => res.data),

	ACTIVATE_ACCOUNT: async (
		data: UserActivateAccountPayload,
	): Promise<UserActivateAccountResponse> =>
		await $http
			.post(USER_ENDPOINTS.activateAccount, data)
			.then((res) => res.data),

	CHANGE_PASSWORD: async (
		data: UserChangePasswordPayload,
	): Promise<UserChangePasswordResponse> =>
		await $http
			.post(USER_ENDPOINTS.changePassword, data)
			.then((res) => res.data),

	FORGOT_PASSWORD: async (
		data: UserForgotPasswordPayload,
	): Promise<UserForgotPasswordResponse> =>
		await $http
			.post(USER_ENDPOINTS.forgotPassword, data)
			.then((res) => res.data),

	LOGIN: async (data: UserLoginPayload): Promise<UserLoginResponse> =>
		await $http.post(USER_ENDPOINTS.login, data).then((res) => res.data),

	LOGOUT: async (): Promise<UserLogoutResponse> =>
		await $http.post(USER_ENDPOINTS.logout, {}).then((res) => res.data),

	LOOKUP: async (params: UserLookupQuery): Promise<UserLookupResponse> =>
		await $http.get(USER_ENDPOINTS.lookup, { params }).then((res) => res.data),

	ME: async () =>
		await $http.get<UserDetail>(USER_ENDPOINTS.me).then((res) => res.data),

	UPDATE_ME: async (
		data: UserProfileUpdatePayload,
	): Promise<UserProfileUpdateResponse> =>
		await $http.patch(USER_ENDPOINTS.updateMe, data).then((res) => res.data),

	REGISTER: async (data: UserRegisterPayload): Promise<UserRegisterResponse> =>
		await $http.post(USER_ENDPOINTS.register, data).then((res) => res.data),

	RESEND_ACTIVATION_CODE: async (
		data: UserResendActivationCodePayload,
	): Promise<UserResendActivationCodeResponse> =>
		await $http
			.post(USER_ENDPOINTS.resendActivationCode, data)
			.then((res) => res.data),

	RESET_PASSWORD: async (
		data: UserResetPasswordPayload,
	): Promise<UserResetPasswordResponse> =>
		await $http
			.post(USER_ENDPOINTS.resetPassword, data)
			.then((res) => res.data),

	TOKEN_REFRESH: async (
		data: UserTokenRefreshPayload,
	): Promise<UserTokenRefreshResponse> =>
		await $http.post(USER_ENDPOINTS.tokenRefresh, data).then((res) => res.data),
};
