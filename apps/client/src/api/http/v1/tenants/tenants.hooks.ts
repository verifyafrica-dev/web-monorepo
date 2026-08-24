import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { TENANTS_API } from "./tenants.api";
import type {
	AdminTenantCreatePayload,
	InvitationAcceptPayload,
	InvitationCompletePayload,
	InvitationCreatePayload,
	PaginationQuery,
	TenantAPIKeyRotatePayload,
	TenantAPIKeyUpdatePayload,
	TenantCreatePayload,
	TenantUpdatePayload,
	TenantWebhookCreatePayload,
	TenantWebhookUpdatePayload,
	UserRoleUpdatePayload,
} from "./tenants.types";

const TENANTS_STALE_TIME = 60_000;

export const TENANTS_QUERY_KEYS = {
	all: ["tenants"] as const,
	list: (params?: PaginationQuery) =>
		["tenants", "list", params ?? {}] as const,
	detail: (id: string) => ["tenants", "detail", id] as const,
	manageList: (params?: PaginationQuery) =>
		["tenants", "manage", "list", params ?? {}] as const,
	manageDetail: (id: string) => ["tenants", "manage", "detail", id] as const,
	countries: ["tenants", "countries"] as const,
	apiKey: (tenantId: string) => ["tenants", "api-key", tenantId] as const,
	webhook: (tenantId: string) => ["tenants", "webhook", tenantId] as const,
	invitations: (tenantId: string, params?: PaginationQuery) =>
		["tenants", "invitations", tenantId, params ?? {}] as const,
	users: (tenantId: string, params?: PaginationQuery) =>
		["tenants", "users", tenantId, params ?? {}] as const,
} as const;

export const useTenantsListQuery = (params?: PaginationQuery, enabled = true) =>
	useQuery({
		queryKey: TENANTS_QUERY_KEYS.list(params),
		queryFn: () => TENANTS_API.LIST(params),
		enabled,
		staleTime: TENANTS_STALE_TIME,
	});

export const useTenantDetailQuery = (id: string | undefined, enabled = true) =>
	useQuery({
		queryKey: TENANTS_QUERY_KEYS.detail(id ?? ""),
		queryFn: () => TENANTS_API.DETAIL(id ?? ""),
		enabled: enabled && Boolean(id),
		staleTime: TENANTS_STALE_TIME,
	});

export const useTenantsManageListQuery = (
	params?: PaginationQuery,
	enabled = true,
) =>
	useQuery({
		queryKey: TENANTS_QUERY_KEYS.manageList(params),
		queryFn: () => TENANTS_API.MANAGE_LIST(params),
		enabled,
		staleTime: TENANTS_STALE_TIME,
	});

export const useTenantManageDetailQuery = (
	id: string | undefined,
	enabled = true,
) =>
	useQuery({
		queryKey: TENANTS_QUERY_KEYS.manageDetail(id ?? ""),
		queryFn: () => TENANTS_API.MANAGE_DETAIL(id ?? ""),
		enabled: enabled && Boolean(id),
		staleTime: TENANTS_STALE_TIME,
	});

export const useSupportedCountriesQuery = (enabled = true) =>
	useQuery({
		queryKey: TENANTS_QUERY_KEYS.countries,
		queryFn: TENANTS_API.COUNTRIES,
		enabled,
		staleTime: TENANTS_STALE_TIME,
	});

export const useTenantApiKeyQuery = (
	tenantId: string | undefined,
	enabled = true,
) =>
	useQuery({
		queryKey: TENANTS_QUERY_KEYS.apiKey(tenantId ?? ""),
		queryFn: () => TENANTS_API.API_KEY(tenantId ?? ""),
		enabled: enabled && Boolean(tenantId),
		staleTime: TENANTS_STALE_TIME,
	});

export const useTenantWebhookQuery = (
	tenantId: string | undefined,
	enabled = true,
) =>
	useQuery({
		queryKey: TENANTS_QUERY_KEYS.webhook(tenantId ?? ""),
		queryFn: () => TENANTS_API.WEBHOOK(tenantId ?? ""),
		enabled: enabled && Boolean(tenantId),
		staleTime: TENANTS_STALE_TIME,
	});

export const useTenantInvitationsQuery = (
	tenantId: string | undefined,
	params?: PaginationQuery,
	enabled = true,
) =>
	useQuery({
		queryKey: TENANTS_QUERY_KEYS.invitations(tenantId ?? "", params),
		queryFn: () => TENANTS_API.INVITATIONS_LIST(tenantId ?? "", params),
		enabled: enabled && Boolean(tenantId),
		staleTime: TENANTS_STALE_TIME,
	});

export const useTenantUsersQuery = (
	tenantId: string | undefined,
	params?: PaginationQuery,
	enabled = true,
) =>
	useQuery({
		queryKey: TENANTS_QUERY_KEYS.users(tenantId ?? "", params),
		queryFn: () => TENANTS_API.USERS_LIST(tenantId ?? "", params),
		enabled: enabled && Boolean(tenantId),
		staleTime: TENANTS_STALE_TIME,
	});

export const useCreateTenantMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantCreatePayload) =>
			TENANTS_API.MANAGE_CREATE(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEYS.all });
		},
	});
};

export const useUpdateTenantMutation = (id: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantUpdatePayload) =>
			TENANTS_API.MANAGE_UPDATE(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: TENANTS_QUERY_KEYS.manageDetail(id),
			});
			queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEYS.all });
		},
	});
};

export const useAdminCreateTenantMutation = () =>
	useMutation({
		mutationFn: (payload: AdminTenantCreatePayload) =>
			TENANTS_API.ADMIN_CREATE(payload),
	});

export const useUpdateTenantApiKeyMutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantAPIKeyUpdatePayload) =>
			TENANTS_API.API_KEY_UPDATE(tenantId, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(TENANTS_QUERY_KEYS.apiKey(tenantId), data);
		},
	});
};

export const useRotateTenantApiKeyMutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantAPIKeyRotatePayload = { key: "reset", is_active: true }) =>
			TENANTS_API.API_KEY_ROTATE(tenantId, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(TENANTS_QUERY_KEYS.apiKey(tenantId), data);
		},
	});
};

export const useCreateTenantWebhookMutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantWebhookCreatePayload) =>
			TENANTS_API.WEBHOOK_CREATE(tenantId, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(TENANTS_QUERY_KEYS.webhook(tenantId), data);
		},
	});
};

export const useUpdateTenantWebhookMutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: TenantWebhookUpdatePayload) =>
			TENANTS_API.WEBHOOK_UPDATE(tenantId, payload),
		onSuccess: (data) => {
			queryClient.setQueryData(TENANTS_QUERY_KEYS.webhook(tenantId), data);
		},
	});
};

export const useCreateTenantInvitationMutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: InvitationCreatePayload) =>
			TENANTS_API.INVITATION_CREATE(tenantId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["tenants", "invitations", tenantId],
			});
		},
	});
};

export const useDeleteTenantInvitationMutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (invitationId: string) =>
			TENANTS_API.INVITATION_DELETE(tenantId, invitationId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["tenants", "invitations", tenantId],
			});
		},
	});
};

export const useAcceptInvitationMutation = () =>
	useMutation({
		mutationFn: (payload: InvitationAcceptPayload) =>
			TENANTS_API.INVITATION_ACCEPT(payload),
	});

export const useCompleteInvitationMutation = () =>
	useMutation({
		mutationFn: (payload: InvitationCompletePayload) =>
			TENANTS_API.INVITATION_COMPLETE(payload),
	});

export const useUpdateTenantUserRoleMutation = (
	tenantId: string,
	userId: string,
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: UserRoleUpdatePayload) =>
			TENANTS_API.USER_ROLE_UPDATE(tenantId, userId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["tenants", "users", tenantId],
			});
		},
	});
};

export const useRemoveTenantUserMutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userId: string) => TENANTS_API.REMOVE_USER(tenantId, userId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["tenants", "users", tenantId],
			});
		},
	});
};

export const useDeleteTenantMutation = () =>
	useMutation({
		mutationFn: (tenantId: string) => TENANTS_API.DELETE(tenantId),
	});
