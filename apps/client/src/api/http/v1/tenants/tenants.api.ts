import $http from "../../xhr";
import type { PaginatedUserDetailListResponse } from "../users/users.types";
import type {
	AdminTenantCreatePayload,
	AdminTenantCreateResponse,
	Invitation,
	InvitationAcceptPayload,
	InvitationCompletePayload,
	InvitationCreatePayload,
	PaginatedInvitationListResponse,
	PaginatedTenantListResponse,
	PaginatedTenantManageListResponse,
	PaginationQuery,
	SupportedCountry,
	Tenant,
	TenantAPIKey,
	TenantAPIKeyRotatePayload,
	TenantAPIKeyUpdatePayload,
	TenantCreateAndUpdate,
	TenantCreatePayload,
	TenantDeleteResponse,
	TenantUpdatePayload,
	TenantWebHook,
	TenantWebhookCreatePayload,
	TenantWebhookUpdatePayload,
	UserRoleUpdatePayload,
} from "./tenants.types";

const TENANT_ENDPOINTS = {
	list: "/tenants/list/",
	createAdmin: "/tenants/create/",
	countries: "/tenants/countries/",
	detail: (id: string) => `/tenants/${id}/`,
	manage: "/tenants/manage/",
	manageDetail: (id: string) => `/tenants/manage/${id}/`,
	verificationConfigs: (tenantId: string) =>
		`/tenants/manage/${tenantId}/verification-configs/`,
	apiKey: (tenantId: string) => `/tenants/${tenantId}/api-key/`,
	webhook: (tenantId: string) => `/tenants/${tenantId}/webhook/`,
	delete: (tenantId: string) => `/tenants/${tenantId}/delete/`,
	invitations: (tenantId: string) => `/tenants/${tenantId}/invitations/`,
	invitationDetail: (tenantId: string, invitationId: string) =>
		`/tenants/${tenantId}/invitations/${invitationId}/`,
	invitationAccept: "/tenants/invitations/accept/",
	invitationComplete: "/tenants/invitations/complete/",
	users: (tenantId: string) => `/tenants/${tenantId}/users/`,
	userRole: (tenantId: string, userId: string) =>
		`/tenants/${tenantId}/users/${userId}/role/`,
	removeUser: (tenantId: string, userId: string) =>
		`/tenants/${tenantId}/users/${userId}/remove/`,
} as const;

export const TENANTS_API = {
	LIST: async (params?: PaginationQuery) =>
		await $http
			.get<PaginatedTenantListResponse>(TENANT_ENDPOINTS.list, { params })
			.then((res) => res.data),

	DETAIL: async (id: string) =>
		await $http
			.get<Tenant>(TENANT_ENDPOINTS.detail(id))
			.then((res) => res.data),

	MANAGE_LIST: async (params?: PaginationQuery) =>
		await $http
			.get<PaginatedTenantManageListResponse>(TENANT_ENDPOINTS.manage, {
				params,
			})
			.then((res) => res.data),

	MANAGE_DETAIL: async (id: string) =>
		await $http
			.get<TenantCreateAndUpdate>(TENANT_ENDPOINTS.manageDetail(id))
			.then((res) => res.data),

	MANAGE_CREATE: async (data: TenantCreatePayload) =>
		await $http
			.post<TenantCreateAndUpdate>(TENANT_ENDPOINTS.manage, data)
			.then((res) => res.data),

	MANAGE_UPDATE: async (id: string, data: TenantUpdatePayload) =>
		await $http
			.patch<TenantCreateAndUpdate>(TENANT_ENDPOINTS.manageDetail(id), data)
			.then((res) => res.data),

	ADMIN_CREATE: async (data: AdminTenantCreatePayload) =>
		await $http
			.post<AdminTenantCreateResponse>(TENANT_ENDPOINTS.createAdmin, data)
			.then((res) => res.data),

	COUNTRIES: async () =>
		await $http
			.get<SupportedCountry[]>(TENANT_ENDPOINTS.countries)
			.then((res) => res.data),

	API_KEY: async (tenantId: string) =>
		await $http
			.get<TenantAPIKey>(TENANT_ENDPOINTS.apiKey(tenantId))
			.then((res) => res.data),

	API_KEY_UPDATE: async (tenantId: string, data: TenantAPIKeyUpdatePayload) =>
		await $http
			.patch<TenantAPIKey>(TENANT_ENDPOINTS.apiKey(tenantId), data)
			.then((res) => res.data),

	API_KEY_ROTATE: async (tenantId: string, data: TenantAPIKeyRotatePayload) =>
		await $http
			.put<TenantAPIKey>(TENANT_ENDPOINTS.apiKey(tenantId), data)
			.then((res) => res.data),

	WEBHOOK: async (tenantId: string) =>
		await $http
			.get<TenantWebHook>(TENANT_ENDPOINTS.webhook(tenantId))
			.then((res) => res.data),

	WEBHOOK_CREATE: async (
		tenantId: string,
		data: TenantWebhookCreatePayload,
	) =>
		await $http
			.post<TenantWebHook>(TENANT_ENDPOINTS.webhook(tenantId), data)
			.then((res) => res.data),

	WEBHOOK_UPDATE: async (
		tenantId: string,
		data: TenantWebhookUpdatePayload,
	) =>
		await $http
			.patch<TenantWebHook>(TENANT_ENDPOINTS.webhook(tenantId), data)
			.then((res) => res.data),

	INVITATIONS_LIST: async (tenantId: string, params?: PaginationQuery) =>
		await $http
			.get<PaginatedInvitationListResponse>(
				TENANT_ENDPOINTS.invitations(tenantId),
				{ params },
			)
			.then((res) => res.data),

	INVITATION_CREATE: async (
		tenantId: string,
		data: InvitationCreatePayload,
	) =>
		await $http
			.post<Invitation>(TENANT_ENDPOINTS.invitations(tenantId), data)
			.then((res) => res.data),

	INVITATION_DELETE: async (tenantId: string, invitationId: string) =>
		await $http
			.delete(TENANT_ENDPOINTS.invitationDetail(tenantId, invitationId))
			.then((res) => res.data),

	INVITATION_ACCEPT: async (data: InvitationAcceptPayload) =>
		await $http
			.post(TENANT_ENDPOINTS.invitationAccept, data)
			.then((res) => res.data),

	INVITATION_COMPLETE: async (data: InvitationCompletePayload) =>
		await $http
			.post(TENANT_ENDPOINTS.invitationComplete, data)
			.then((res) => res.data),

	USERS_LIST: async (tenantId: string, params?: PaginationQuery) =>
		await $http
			.get<PaginatedUserDetailListResponse>(TENANT_ENDPOINTS.users(tenantId), {
				params,
			})
			.then((res) => res.data),

	USER_ROLE_UPDATE: async (
		tenantId: string,
		userId: string,
		data: UserRoleUpdatePayload,
	) =>
		await $http
			.patch(TENANT_ENDPOINTS.userRole(tenantId, userId), data)
			.then((res) => res.data),

	REMOVE_USER: async (tenantId: string, userId: string) =>
		await $http
			.delete(TENANT_ENDPOINTS.removeUser(tenantId, userId))
			.then((res) => res.data),

	DELETE: async (tenantId: string) =>
		await $http
			.delete<TenantDeleteResponse>(TENANT_ENDPOINTS.delete(tenantId))
			.then((res) => res.data),
};
