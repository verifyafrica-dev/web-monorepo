import {
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import type { UserDetail } from "#/api/http/v1/users/users.types";
import { deleteAllCookies } from "#/lib/cookies";
import { useAuthStore } from "#/stores/auth-store";
import { setAccessToken } from "../../xhr";
import { useOrganizationQueryKey } from "../organization-query";
import { USERS_V2_API } from "./users.api";
import type {
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
	UserApiErrorResponse,
	UserChangePasswordPayload,
	UserForgotPasswordPayload,
	UserListQuery,
	UserLoginError,
	UserLoginMutationInput,
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

export const USER_V2_QUERY_KEYS = {
	all: ["users-v2"] as const,
	list: (params?: UserListQuery) => ["users-v2", "list", params ?? {}] as const,
	detail: (id: string) => ["users-v2", "detail", id] as const,
	me: ["users-v2", "me"] as const,
	lookup: (query: UserLookupQuery) => ["users-v2", "lookup", query] as const,
	verifyForgotPasswordToken: (token: string) =>
		["users-v2", "verify-forgot-password-token", token] as const,
} as const;

const toAuthStoreUser = (user: UserSession): UserDetail => ({
	...user,
	phone_number: user.phone_number ?? undefined,
	tenants: user.tenants,
	created_at: "",
});

export const useUsersV2ListQuery = (
	params?: UserListQuery,
): UseQueryResult<PaginatedAdminUserListResult> => {
	return useQuery<PaginatedAdminUserListResult>({
		queryKey: useOrganizationQueryKey(USER_V2_QUERY_KEYS.list(params)),
		queryFn: () => USERS_V2_API.LIST(params),
	});
};

export const useUserV2DetailQuery = (id: string): UseQueryResult<AdminUser> => {
	return useQuery<AdminUser>({
		queryKey: useOrganizationQueryKey(USER_V2_QUERY_KEYS.detail(id)),
		queryFn: () => USERS_V2_API.DETAIL(id),
		enabled: Boolean(id),
	});
};

export const useMeV2Query = (
	isEnabled = true,
): UseQueryResult<UserSession, Error> => {
	const query = useQuery<UserSession, Error>({
		queryKey: USER_V2_QUERY_KEYS.me,
		queryFn: USERS_V2_API.ME,
		enabled: isEnabled,
		staleTime: 60_000,
	});

	useEffect(() => {
		if (query.data) {
			useAuthStore.setState({
				user: toAuthStoreUser(query.data),
			});
		}
	}, [query.data]);

	return query;
};

export const useUserV2LookupQuery = (
	query: UserLookupQuery,
	enabled = true,
): UseQueryResult<LookupResponseData> =>
	useQuery<LookupResponseData>({
		queryKey: USER_V2_QUERY_KEYS.lookup(query),
		queryFn: () => USERS_V2_API.LOOKUP(query),
		enabled,
	});

export const useVerifyForgotPasswordTokenV2Query = (
	token: string,
	enabled = true,
): UseQueryResult<
	VerifyForgotPasswordTokenResponseData,
	UserApiErrorResponse
> =>
	useQuery({
		queryKey: USER_V2_QUERY_KEYS.verifyForgotPasswordToken(token),
		queryFn: () => USERS_V2_API.VERIFY_FORGOT_PASSWORD_TOKEN({ token }),
		enabled: enabled && Boolean(token),
		retry: false,
	});

export const useUserV2LoginMutation = () =>
	useMutation<AuthResponseData, UserLoginError, UserLoginMutationInput>({
		mutationFn: ({ payload }) => USERS_V2_API.LOGIN(payload),
		onSuccess: async (data) => {
			setAccessToken(data.access_token);
			useAuthStore.setState({
				access_token: data.access_token,
				user: toAuthStoreUser(data.user),
			});

			const user = await USERS_V2_API.ME();
			useAuthStore.setState({ user: toAuthStoreUser(user) });
		},
	});

export const useUserV2RegisterMutation = () =>
	useMutation<RegisterResponseData, UserLoginError, UserRegisterPayload>({
		mutationFn: USERS_V2_API.REGISTER,
	});

export const useUserV2ActivateAccountMutation = () =>
	useMutation<AuthResponseData, UserLoginError, UserActivateAccountPayload>({
		mutationFn: USERS_V2_API.ACTIVATE_ACCOUNT,
		onSuccess: (data) => {
			setAccessToken(data.access_token);
			useAuthStore.setState({
				access_token: data.access_token,
				user: toAuthStoreUser(data.user),
			});
		},
	});

export const useUserV2ResendActivationCodeMutation = () =>
	useMutation<
		ResendActivationCodeResponseData,
		UserLoginError,
		UserResendActivationCodePayload
	>({
		mutationFn: USERS_V2_API.RESEND_ACTIVATION_CODE,
	});

export const useUserV2ForgotPasswordMutation = () =>
	useMutation<string, UserLoginError, UserForgotPasswordPayload>({
		mutationFn: USERS_V2_API.FORGOT_PASSWORD,
	});

export const useUserV2VerifyForgotPasswordTokenMutation = () =>
	useMutation<
		VerifyForgotPasswordTokenResponseData,
		UserApiErrorResponse,
		UserVerifyForgotPasswordTokenPayload
	>({
		mutationFn: USERS_V2_API.VERIFY_FORGOT_PASSWORD_TOKEN,
	});

export const useUserV2ResetPasswordMutation = () =>
	useMutation<string, UserApiErrorResponse, UserResetPasswordPayload>({
		mutationFn: USERS_V2_API.RESET_PASSWORD,
	});

export const useAcceptInvitationV2Mutation = () =>
	useMutation<string, UserApiErrorResponse, InvitationAcceptPayload>({
		mutationFn: USERS_V2_API.ACCEPT_INVITATION,
	});

export const useCreateUserFromInvitationV2Mutation = () =>
	useMutation<string, UserApiErrorResponse, InvitationCreateUserPayload>({
		mutationFn: USERS_V2_API.CREATE_USER_FROM_INVITATION,
	});

export const useUserV2TokenRefreshMutation = () =>
	useMutation<string, UserLoginError, void>({
		mutationFn: USERS_V2_API.REFRESH_TOKEN,
		onSuccess: (accessToken) => {
			setAccessToken(accessToken);
			useAuthStore.setState({ access_token: accessToken });
		},
	});

export const useUserV2ChangePasswordMutation = () =>
	useMutation<string, UserLoginError, UserChangePasswordPayload>({
		mutationFn: USERS_V2_API.CHANGE_PASSWORD,
	});

export const useUserV2LogoutMutation = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const mutation = useMutation<string, UserLoginError, void>({
		mutationFn: USERS_V2_API.LOGOUT,
		onSettled: () => {
			navigate({ to: "/login", replace: true });
			deleteAllCookies();
			localStorage.clear();
			useAuthStore.getState().clearAuth();
			queryClient.clear();
		},
	});

	return {
		logout: () => mutation.mutate(),
		isLoggingOut: mutation.isPending,
	};
};

export const useUpdateMeV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation<UserSession, UserLoginError, UserMePatchUpdatePayload>({
		mutationFn: USERS_V2_API.UPDATE_ME,
		onSuccess: async (data) => {
			const currentUser = useAuthStore.getState().user;
			const updatedUser = toAuthStoreUser(data);

			if (currentUser) {
				useAuthStore.setState({ user: updatedUser });
				queryClient.setQueryData(USER_V2_QUERY_KEYS.me, data);
				return;
			}

			const user = await USERS_V2_API.ME();
			useAuthStore.setState({ user: toAuthStoreUser(user) });
			queryClient.setQueryData(USER_V2_QUERY_KEYS.me, user);
		},
	});
};

export const useReplaceMeV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation<UserSession, UserLoginError, UserMePutUpdatePayload>({
		mutationFn: USERS_V2_API.REPLACE_ME,
		onSuccess: (data) => {
			useAuthStore.setState({ user: toAuthStoreUser(data) });
			queryClient.setQueryData(USER_V2_QUERY_KEYS.me, data);
		},
	});
};

export const useUpdateUserV2DetailMutation = (id: string) =>
	useMutation<AdminUser, UserLoginError, UserAdminPatchUpdatePayload>({
		mutationFn: (payload) => USERS_V2_API.UPDATE_DETAIL(id, payload),
	});

export const useReplaceUserV2DetailMutation = (id: string) =>
	useMutation<AdminUser, UserLoginError, UserAdminPutUpdatePayload>({
		mutationFn: (payload) => USERS_V2_API.REPLACE_DETAIL(id, payload),
	});

export type { PaginatedAdminUserListResult, LookupResponseData };
