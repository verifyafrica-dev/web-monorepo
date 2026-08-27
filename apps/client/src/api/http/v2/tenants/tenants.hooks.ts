import {
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";

import {
	useOrganizationQueryKey,
	withOrganizationId,
} from "../organization-query";
import { USER_V2_QUERY_KEYS } from "../users/users.hooks";
import { TENANTS_V2_API } from "./tenants.api";
import type {
	KycComplianceSection,
	KycSectionUpdatePayload,
	PaginatedTenantAllListResult,
	PaginatedTenantInvitationListResult,
	PaginatedTenantListResult,
	PaginatedTenantUserListResult,
	PaginatedTenantWebhookEventListResult,
	SupportedCountry,
	TenantAllListQuery,
	TenantAPIKey,
	TenantAPIKeyPutUpdatePayload,
	TenantAPIKeyUpdatePayload,
	TenantComplianceDocumentDeletePayload,
	TenantComplianceDocumentRegisterPayload,
	TenantCreatePayload,
	TenantDetail,
	TenantInvitationAcceptPayload,
	TenantInvitationCreatePayload,
	TenantInvitationCreateUserPayload,
	TenantInvitationListQuery,
	TenantInvitationVerifyData,
	TenantInvitationVerifyPayload,
	TenantListQuery,
	TenantUpdatePayload,
	TenantUserListQuery,
	TenantUserMembershipUpdatePayload,
	TenantUserRoleUpdatePayload,
	TenantProductSettingListData,
	TenantProductSettingUpdatePayload,
	TenantVerificationConfigListData,
	TenantVerificationConfigUpdatePayload,
	TenantWebhook,
	TenantWebhookCreatePayload,
	TenantWebhookEventListQuery,
	TenantWebhookUpdatePayload,
} from "./tenants.types";

function isTenantWebhookNotFoundError(error: unknown) {
	const axiosError = error as V2AxiosError | null;

	if (axiosError?.response?.status === 404) {
		return true;
	}

	const errors = axiosError?.response?.data?.errors ?? [];
	return errors.some((entry) => entry.toLowerCase().includes("tenantwebhook"));
}

const TENANTS_V2_STALE_TIME = 60_000;

export const TENANTS_V2_QUERY_KEYS = {
	all: ["tenants-v2"] as const,
	detail: (tenantId: string) => ["tenants-v2", "detail", tenantId] as const,
	allList: (params?: TenantAllListQuery) =>
		["tenants-v2", "all", params ?? {}] as const,
	list: (params?: TenantListQuery) =>
		["tenants-v2", "list", params ?? {}] as const,
	countries: ["tenants-v2", "countries"] as const,
	apiKey: (tenantId: string) => ["tenants-v2", "api-key", tenantId] as const,
	webhook: (tenantId: string) => ["tenants-v2", "webhook", tenantId] as const,
	webhookEvents: (tenantId: string, params?: TenantWebhookEventListQuery) =>
		["tenants-v2", "webhook-events", tenantId, params ?? {}] as const,
	invitations: (tenantId: string, params?: TenantInvitationListQuery) =>
		["tenants-v2", "invitations", tenantId, params ?? {}] as const,
	users: (tenantId: string, params?: TenantUserListQuery) =>
		["tenants-v2", "users", tenantId, params ?? {}] as const,
	verificationConfigs: (tenantId: string) =>
		["tenants-v2", "verification-configs", tenantId] as const,
	productSettings: (tenantId: string) =>
		["tenants-v2", "product-settings", tenantId] as const,
	verifyInvitation: (token: string) =>
		["tenants-v2", "verify-invitation", token] as const,
} as const;

export const useTenantV2DetailQuery = (
	tenantId: string | undefined,
	enabled = true,
): UseQueryResult<TenantDetail> => {
	return useQuery<TenantDetail>({
		queryKey: useOrganizationQueryKey(
			TENANTS_V2_QUERY_KEYS.detail(tenantId ?? ""),
		),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return TENANTS_V2_API.DETAIL(tenantId);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: TENANTS_V2_STALE_TIME,
	});
};

export const useTenantsAllV2Query = (
	params?: TenantAllListQuery,
	enabled = true,
): UseQueryResult<PaginatedTenantAllListResult> => {
	return useQuery<PaginatedTenantAllListResult>({
		queryKey: useOrganizationQueryKey(
			TENANTS_V2_QUERY_KEYS.allList(params),
		),
		queryFn: () => TENANTS_V2_API.ALL_LIST(params),
		enabled,
		staleTime: TENANTS_V2_STALE_TIME,
	});
};

export const useTenantsListV2Query = (
	params?: TenantListQuery,
	enabled = true,
): UseQueryResult<PaginatedTenantListResult> => {
	return useQuery<PaginatedTenantListResult>({
		queryKey: useOrganizationQueryKey(
			TENANTS_V2_QUERY_KEYS.list(params),
		),
		queryFn: () => TENANTS_V2_API.LIST(params),
		enabled,
		staleTime: TENANTS_V2_STALE_TIME,
	});
};

export const useSupportedCountriesV2Query = (
	enabled = true,
): UseQueryResult<SupportedCountry[]> =>
	useQuery<SupportedCountry[]>({
		queryKey: TENANTS_V2_QUERY_KEYS.countries,
		queryFn: TENANTS_V2_API.COUNTRIES,
		enabled,
		staleTime: TENANTS_V2_STALE_TIME,
	});

export const useTenantApiKeyV2Query = (
	tenantId: string | undefined,
	enabled = true,
): UseQueryResult<TenantAPIKey> => {
	return useQuery<TenantAPIKey>({
		queryKey: useOrganizationQueryKey(
			TENANTS_V2_QUERY_KEYS.apiKey(tenantId ?? ""),
		),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return TENANTS_V2_API.API_KEY(tenantId);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: TENANTS_V2_STALE_TIME,
	});
};

export const useTenantWebhookV2Query = (
	tenantId: string | undefined,
	enabled = true,
): UseQueryResult<TenantWebhook | null> => {
	return useQuery<TenantWebhook | null>({
		queryKey: useOrganizationQueryKey(
			TENANTS_V2_QUERY_KEYS.webhook(tenantId ?? ""),
		),
		queryFn: async () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			try {
				return await TENANTS_V2_API.WEBHOOK(tenantId);
			} catch (error) {
				if (isTenantWebhookNotFoundError(error)) {
					return null;
				}

				throw error;
			}
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: TENANTS_V2_STALE_TIME,
		retry: (failureCount, error) => {
			if (isTenantWebhookNotFoundError(error)) {
				return false;
			}

			return failureCount < 3;
		},
	});
};

export const useTenantWebhookEventsV2Query = (
	tenantId: string | undefined,
	params?: TenantWebhookEventListQuery,
	enabled = true,
): UseQueryResult<PaginatedTenantWebhookEventListResult> => {
	return useQuery<PaginatedTenantWebhookEventListResult>({
		queryKey: useOrganizationQueryKey(
			TENANTS_V2_QUERY_KEYS.webhookEvents(tenantId ?? "", params),
		),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return TENANTS_V2_API.WEBHOOK_EVENTS_LIST(tenantId, params);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: TENANTS_V2_STALE_TIME,
	});
};

export const useRetryTenantWebhookEventV2Mutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (eventId: string) =>
			TENANTS_V2_API.WEBHOOK_EVENT_RETRY(tenantId, eventId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["tenants-v2", "webhook-events", tenantId],
			});
		},
	});
};

export const useTenantInvitationsV2Query = (
	tenantId: string | undefined,
	params?: TenantInvitationListQuery,
	enabled = true,
): UseQueryResult<PaginatedTenantInvitationListResult> => {
	return useQuery<PaginatedTenantInvitationListResult>({
		queryKey: useOrganizationQueryKey(
			TENANTS_V2_QUERY_KEYS.invitations(tenantId ?? "", params),
		),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return TENANTS_V2_API.INVITATIONS_LIST(tenantId, params);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: TENANTS_V2_STALE_TIME,
	});
};

export const useTenantUsersV2Query = (
	tenantId: string | undefined,
	params?: TenantUserListQuery,
	enabled = true,
): UseQueryResult<PaginatedTenantUserListResult> => {
	return useQuery<PaginatedTenantUserListResult>({
		queryKey: useOrganizationQueryKey(
			TENANTS_V2_QUERY_KEYS.users(tenantId ?? "", params),
		),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return TENANTS_V2_API.USERS_LIST(tenantId, params);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: TENANTS_V2_STALE_TIME,
	});
};

export const useTenantVerificationConfigsV2Query = (
	tenantId: string | undefined,
	enabled = true,
): UseQueryResult<TenantVerificationConfigListData> => {
	return useQuery<TenantVerificationConfigListData>({
		queryKey: useOrganizationQueryKey(
			TENANTS_V2_QUERY_KEYS.verificationConfigs(tenantId ?? ""),
		),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return TENANTS_V2_API.VERIFICATION_CONFIGS(tenantId);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: TENANTS_V2_STALE_TIME,
	});
};

export const useTenantProductSettingsV2Query = (
	tenantId: string | undefined,
	enabled = true,
): UseQueryResult<TenantProductSettingListData> => {
	return useQuery<TenantProductSettingListData>({
		queryKey: useOrganizationQueryKey(
			TENANTS_V2_QUERY_KEYS.productSettings(tenantId ?? ""),
		),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return TENANTS_V2_API.PRODUCT_SETTINGS(tenantId);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: TENANTS_V2_STALE_TIME,
	});
};

export const useCreateTenantV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantCreatePayload) =>
			TENANTS_V2_API.CREATE(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: TENANTS_V2_QUERY_KEYS.all });
			queryClient.invalidateQueries({ queryKey: USER_V2_QUERY_KEYS.me });
		},
	});
};

export const useUpdateTenantV2Mutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantUpdatePayload) =>
			TENANTS_V2_API.UPDATE(tenantId, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(
				withOrganizationId(
					TENANTS_V2_QUERY_KEYS.detail(tenantId),
				),
				data,
			);
			queryClient.invalidateQueries({ queryKey: TENANTS_V2_QUERY_KEYS.all });
		},
	});
};

export const useDeleteTenantV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (tenantId: string) => TENANTS_V2_API.DELETE(tenantId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: TENANTS_V2_QUERY_KEYS.all });
		},
	});
};

export const useReplaceTenantApiKeyV2Mutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantAPIKeyPutUpdatePayload) =>
			TENANTS_V2_API.REPLACE_API_KEY(tenantId, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(
				withOrganizationId(
					TENANTS_V2_QUERY_KEYS.apiKey(tenantId),
				),
				data,
			);
		},
	});
};

export const useUpdateTenantApiKeyV2Mutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantAPIKeyUpdatePayload) =>
			TENANTS_V2_API.UPDATE_API_KEY(tenantId, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(
				withOrganizationId(
					TENANTS_V2_QUERY_KEYS.apiKey(tenantId),
				),
				data,
			);
		},
	});
};

export const useRegisterTenantComplianceDocumentV2Mutation = (
	tenantId: string,
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantComplianceDocumentRegisterPayload) =>
			TENANTS_V2_API.REGISTER_COMPLIANCE_DOCUMENT(tenantId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: TENANTS_V2_QUERY_KEYS.detail(tenantId),
			});
		},
	});
};

export const useDeleteTenantComplianceDocumentV2Mutation = (
	tenantId: string,
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantComplianceDocumentDeletePayload) =>
			TENANTS_V2_API.DELETE_COMPLIANCE_DOCUMENT(tenantId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: TENANTS_V2_QUERY_KEYS.detail(tenantId),
			});
		},
	});
};

export const useSubmitTenantComplianceV2Mutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => TENANTS_V2_API.SUBMIT_COMPLIANCE(tenantId),
		onSuccess: (data) => {
			queryClient.setQueryData(
				withOrganizationId(
					TENANTS_V2_QUERY_KEYS.detail(tenantId),
				),
				data,
			);
		},
	});
};

export const useUpdateTenantComplianceSectionV2Mutation = (
	tenantId: string,
	section: KycComplianceSection,
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: KycSectionUpdatePayload) =>
			TENANTS_V2_API.UPDATE_COMPLIANCE_SECTION(tenantId, section, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: TENANTS_V2_QUERY_KEYS.detail(tenantId),
			});
		},
	});
};

export const useCreateTenantInvitationV2Mutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantInvitationCreatePayload) =>
			TENANTS_V2_API.INVITATION_CREATE(tenantId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["tenants-v2", "invitations", tenantId],
			});
		},
	});
};

export const useDeleteTenantInvitationMutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (invitationId: string) =>
			TENANTS_V2_API.INVITATION_DELETE(tenantId, invitationId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["tenants-v2", "invitations", tenantId],
			});
		},
	});
};

export const useResendTenantInvitationV2Mutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (invitationId: string) =>
			TENANTS_V2_API.INVITATION_RESEND(tenantId, invitationId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["tenants-v2", "invitations", tenantId],
			});
		},
	});
};

export const useVerifyInvitationV2Query = (
	token: string | undefined,
	enabled = true,
): UseQueryResult<TenantInvitationVerifyData> =>
	useQuery<TenantInvitationVerifyData>({
		queryKey: TENANTS_V2_QUERY_KEYS.verifyInvitation(token ?? ""),
		queryFn: () => {
			if (!token) {
				throw new Error("Invitation token is required");
			}

			return TENANTS_V2_API.VERIFY_INVITATION({ token });
		},
		enabled: enabled && Boolean(token),
		retry: false,
		staleTime: TENANTS_V2_STALE_TIME,
	});

export const useVerifyInvitationV2Mutation = () =>
	useMutation({
		mutationFn: (payload: TenantInvitationVerifyPayload) =>
			TENANTS_V2_API.VERIFY_INVITATION(payload),
	});

export const useAcceptTenantInvitationV2Mutation = () =>
	useMutation({
		mutationFn: (payload: TenantInvitationAcceptPayload) =>
			TENANTS_V2_API.INVITATION_ACCEPT(payload),
	});

export const useCreateUserFromTenantInvitationV2Mutation = () =>
	useMutation({
		mutationFn: (payload: TenantInvitationCreateUserPayload) =>
			TENANTS_V2_API.INVITATION_CREATE_USER(payload),
	});

export const useRemoveTenantUserV2Mutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userId: string) =>
			TENANTS_V2_API.REMOVE_USER(tenantId, userId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["tenants-v2", "users", tenantId],
			});
		},
	});
};

export const useUpdateTenantUserMembershipV2Mutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			userId,
			...payload
		}: TenantUserMembershipUpdatePayload & { userId: string }) =>
			TENANTS_V2_API.UPDATE_USER_MEMBERSHIP(tenantId, userId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["tenants-v2", "users", tenantId],
			});
		},
	});
};

export const useUpdateTenantUserRoleV2Mutation = (
	tenantId: string,
	userId: string,
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantUserRoleUpdatePayload) =>
			TENANTS_V2_API.UPDATE_USER_ROLE(tenantId, userId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["tenants-v2", "users", tenantId],
			});
		},
	});
};

export const useUpdateTenantProductSettingsV2Mutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantProductSettingUpdatePayload) =>
			TENANTS_V2_API.UPDATE_PRODUCT_SETTINGS(tenantId, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(
				withOrganizationId(TENANTS_V2_QUERY_KEYS.productSettings(tenantId)),
				data,
			);
		},
	});
};

export const useReplaceTenantVerificationConfigsV2Mutation = (
	tenantId: string,
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantVerificationConfigUpdatePayload) =>
			TENANTS_V2_API.REPLACE_VERIFICATION_CONFIGS(tenantId, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(
				withOrganizationId(
					TENANTS_V2_QUERY_KEYS.verificationConfigs(tenantId),
				),
				data,
			);
		},
	});
};

export const useUpdateTenantVerificationConfigsV2Mutation = (
	tenantId: string,
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantVerificationConfigUpdatePayload) =>
			TENANTS_V2_API.UPDATE_VERIFICATION_CONFIGS(tenantId, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(
				withOrganizationId(
					TENANTS_V2_QUERY_KEYS.verificationConfigs(tenantId),
				),
				data,
			);
		},
	});
};

export const useCreateTenantWebhookV2Mutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantWebhookCreatePayload) =>
			TENANTS_V2_API.WEBHOOK_CREATE(tenantId, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(
				withOrganizationId(
					TENANTS_V2_QUERY_KEYS.webhook(tenantId),
				),
				data,
			);
		},
	});
};

export const useUpdateTenantWebhookV2Mutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantWebhookUpdatePayload) =>
			TENANTS_V2_API.WEBHOOK_UPDATE(tenantId, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(
				withOrganizationId(
					TENANTS_V2_QUERY_KEYS.webhook(tenantId),
				),
				data,
			);
		},
	});
};

export type {
	PaginatedTenantAllListResult,
	PaginatedTenantInvitationListResult,
	PaginatedTenantListResult,
	PaginatedTenantUserListResult,
};
