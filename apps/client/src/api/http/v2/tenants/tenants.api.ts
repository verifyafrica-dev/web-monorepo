import {
	unwrapV2Data,
	unwrapV2Message,
	unwrapV2Paginated,
} from "#/api/http/shared";
import type { SupportedCountry } from "#/api/http/v1/tenants/tenants.types";
import $http from "../../xhr";
import type {
	KycComplianceSection,
	KycSectionUpdatePayload,
	PaginatedTenantAllListResult,
	PaginatedTenantInvitationListResult,
	PaginatedTenantListResult,
	PaginatedTenantUserListResult,
	PaginatedTenantWebhookEventListResult,
	TenantAllListQuery,
	TenantAPIKey,
	TenantAPIKeyPutUpdatePayload,
	TenantAPIKeyUpdatePayload,
	TenantComplianceDataPayload,
	TenantComplianceDocumentDeleteData,
	TenantComplianceDocumentDeletePayload,
	TenantComplianceDocumentRegisterData,
	TenantComplianceDocumentRegisterPayload,
	TenantCreatePayload,
	TenantDetail,
	TenantInvitation,
	TenantInvitationAcceptData,
	TenantInvitationAcceptPayload,
	TenantInvitationCreatePayload,
	TenantInvitationCreateUserPayload,
	TenantInvitationListQuery,
	TenantInvitationVerifyData,
	TenantInvitationVerifyPayload,
	TenantListQuery,
	TenantUpdatePayload,
	TenantUser,
	TenantUserListQuery,
	TenantUserMembershipUpdatePayload,
	TenantUserRoleUpdatePayload,
	TenantVerificationConfigListData,
	TenantVerificationConfigUpdatePayload,
	TenantWebhook,
	TenantWebhookCreatePayload,
	TenantWebhookEventListQuery,
	TenantWebhookUpdatePayload,
} from "./tenants.types";

const TENANT_ID_HEADER = "X-TENANT-ID";

const TENANTS_V2_ENDPOINTS = {
	root: "/v2/tenants/",
	all: "/v2/tenants/all/",
	list: "/v2/tenants/list/",
	apiKey: "/v2/tenants/api-key/",
	complianceDocuments: "/v2/tenants/compliance/documents/",
	complianceSubmit: "/v2/tenants/compliance/submit/",
	complianceSection: (section: KycComplianceSection) =>
		`/v2/tenants/compliance/${section}/`,
	countries: "/v2/tenants/countries/",
	invitations: "/v2/tenants/invitations/",
	invitationResend: (invitationId: string) =>
		`/v2/tenants/invitations/${invitationId}/resend/`,
	invitationAccept: "/v2/tenants/invitations/accept/",
	invitationCreateUser: "/v2/tenants/invitations/create-user/",
	verifyInvitation: "/v2/tenants/verify-invitation/",
	users: "/v2/tenants/users/",
	userDetail: (userId: string) => `/v2/tenants/users/${userId}/`,
	userMembership: (userId: string) => `/v2/tenants/users/${userId}/membership/`,
	userRole: (userId: string) => `/v2/tenants/users/${userId}/role/`,
	verificationConfigs: "/v2/tenants/verification-configs/",
	webhook: "/v2/tenants/webhook/",
	webhookEvents: "/v2/tenants/webhook/events/",
} as const;

const withTenantHeader = (tenantId: string) => ({
	headers: {
		[TENANT_ID_HEADER]: tenantId,
	},
});

export const TENANTS_V2_API = {
	DETAIL: async (tenantId: string): Promise<TenantDetail> =>
		await $http
			.get(TENANTS_V2_ENDPOINTS.root, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TenantDetail>(res)),

	CREATE: async (data: TenantCreatePayload): Promise<TenantDetail> =>
		await $http
			.post(TENANTS_V2_ENDPOINTS.root, data)
			.then((res) => unwrapV2Data<TenantDetail>(res)),

	UPDATE: async (
		tenantId: string,
		data: TenantUpdatePayload,
	): Promise<TenantDetail> =>
		await $http
			.patch(TENANTS_V2_ENDPOINTS.root, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TenantDetail>(res)),

	DELETE: async (tenantId: string): Promise<string> =>
		await $http
			.delete(TENANTS_V2_ENDPOINTS.root, withTenantHeader(tenantId))
			.then((res) => unwrapV2Message(res)),

	ALL_LIST: async (
		params?: TenantAllListQuery,
	): Promise<PaginatedTenantAllListResult> =>
		await $http
			.get(TENANTS_V2_ENDPOINTS.all, { params })
			.then((res) => unwrapV2Paginated(res)),

	LIST: async (params?: TenantListQuery): Promise<PaginatedTenantListResult> =>
		await $http
			.get(TENANTS_V2_ENDPOINTS.list, { params })
			.then((res) => unwrapV2Paginated(res)),

	API_KEY: async (tenantId: string): Promise<TenantAPIKey> =>
		await $http
			.get(TENANTS_V2_ENDPOINTS.apiKey, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TenantAPIKey>(res)),

	REPLACE_API_KEY: async (
		tenantId: string,
		data: TenantAPIKeyPutUpdatePayload,
	): Promise<TenantAPIKey> =>
		await $http
			.put(TENANTS_V2_ENDPOINTS.apiKey, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TenantAPIKey>(res)),

	UPDATE_API_KEY: async (
		tenantId: string,
		data: TenantAPIKeyUpdatePayload,
	): Promise<TenantAPIKey> =>
		await $http
			.patch(TENANTS_V2_ENDPOINTS.apiKey, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TenantAPIKey>(res)),

	REGISTER_COMPLIANCE_DOCUMENT: async (
		tenantId: string,
		data: TenantComplianceDocumentRegisterPayload,
	): Promise<TenantComplianceDocumentRegisterData> =>
		await $http
			.post(
				TENANTS_V2_ENDPOINTS.complianceDocuments,
				data,
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Data<TenantComplianceDocumentRegisterData>(res)),

	DELETE_COMPLIANCE_DOCUMENT: async (
		tenantId: string,
		data: TenantComplianceDocumentDeletePayload,
	): Promise<TenantComplianceDocumentDeleteData> =>
		await $http
			.delete(TENANTS_V2_ENDPOINTS.complianceDocuments, {
				data,
				...withTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Data<TenantComplianceDocumentDeleteData>(res)),

	SUBMIT_COMPLIANCE: async (tenantId: string): Promise<TenantDetail> =>
		await $http
			.post(
				TENANTS_V2_ENDPOINTS.complianceSubmit,
				{},
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Data<TenantDetail>(res)),

	UPDATE_COMPLIANCE_SECTION: async (
		tenantId: string,
		section: KycComplianceSection,
		data: KycSectionUpdatePayload,
	): Promise<TenantComplianceDataPayload> =>
		await $http
			.patch(
				TENANTS_V2_ENDPOINTS.complianceSection(section),
				data,
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Data<TenantComplianceDataPayload>(res)),

	COUNTRIES: async (): Promise<SupportedCountry[]> =>
		await $http
			.get(TENANTS_V2_ENDPOINTS.countries)
			.then((res) => unwrapV2Data<SupportedCountry[]>(res)),

	INVITATIONS_LIST: async (
		tenantId: string,
		params?: TenantInvitationListQuery,
	): Promise<PaginatedTenantInvitationListResult> =>
		await $http
			.get(TENANTS_V2_ENDPOINTS.invitations, {
				params,
				...withTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Paginated(res)),

	INVITATION_CREATE: async (
		tenantId: string,
		data: TenantInvitationCreatePayload,
	): Promise<TenantInvitation> =>
		await $http
			.post(TENANTS_V2_ENDPOINTS.invitations, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TenantInvitation>(res)),

	INVITATION_RESEND: async (
		tenantId: string,
		invitationId: string,
	): Promise<TenantInvitation> =>
		await $http
			.post(
				TENANTS_V2_ENDPOINTS.invitationResend(invitationId),
				{},
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Data<TenantInvitation>(res)),

	INVITATION_ACCEPT: async (
		data: TenantInvitationAcceptPayload,
	): Promise<TenantInvitationAcceptData> =>
		await $http
			.post(TENANTS_V2_ENDPOINTS.invitationAccept, data)
			.then((res) => unwrapV2Data<TenantInvitationAcceptData>(res)),

	INVITATION_CREATE_USER: async (
		data: TenantInvitationCreateUserPayload,
	): Promise<TenantInvitationAcceptData> =>
		await $http
			.post(TENANTS_V2_ENDPOINTS.invitationCreateUser, data)
			.then((res) => unwrapV2Data<TenantInvitationAcceptData>(res)),

	VERIFY_INVITATION: async (
		data: TenantInvitationVerifyPayload,
	): Promise<TenantInvitationVerifyData> =>
		await $http
			.post(TENANTS_V2_ENDPOINTS.verifyInvitation, data)
			.then((res) => unwrapV2Data<TenantInvitationVerifyData>(res)),

	USERS_LIST: async (
		tenantId: string,
		params?: TenantUserListQuery,
	): Promise<PaginatedTenantUserListResult> =>
		await $http
			.get(TENANTS_V2_ENDPOINTS.users, {
				params,
				...withTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Paginated(res)),

	REMOVE_USER: async (tenantId: string, userId: string): Promise<string> =>
		await $http
			.delete(
				TENANTS_V2_ENDPOINTS.userDetail(userId),
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Message(res)),

	UPDATE_USER_MEMBERSHIP: async (
		tenantId: string,
		userId: string,
		data: TenantUserMembershipUpdatePayload,
	): Promise<TenantUser> =>
		await $http
			.patch(
				TENANTS_V2_ENDPOINTS.userMembership(userId),
				data,
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Data<TenantUser>(res)),

	UPDATE_USER_ROLE: async (
		tenantId: string,
		userId: string,
		data: TenantUserRoleUpdatePayload,
	): Promise<TenantUser> =>
		await $http
			.patch(
				TENANTS_V2_ENDPOINTS.userRole(userId),
				data,
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Data<TenantUser>(res)),

	VERIFICATION_CONFIGS: async (
		tenantId: string,
	): Promise<TenantVerificationConfigListData> =>
		await $http
			.get(TENANTS_V2_ENDPOINTS.verificationConfigs, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TenantVerificationConfigListData>(res)),

	REPLACE_VERIFICATION_CONFIGS: async (
		tenantId: string,
		data: TenantVerificationConfigUpdatePayload,
	): Promise<TenantVerificationConfigListData> =>
		await $http
			.put(
				TENANTS_V2_ENDPOINTS.verificationConfigs,
				data,
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Data<TenantVerificationConfigListData>(res)),

	UPDATE_VERIFICATION_CONFIGS: async (
		tenantId: string,
		data: TenantVerificationConfigUpdatePayload,
	): Promise<TenantVerificationConfigListData> =>
		await $http
			.patch(
				TENANTS_V2_ENDPOINTS.verificationConfigs,
				data,
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Data<TenantVerificationConfigListData>(res)),

	WEBHOOK: async (tenantId: string): Promise<TenantWebhook> =>
		await $http
			.get(TENANTS_V2_ENDPOINTS.webhook, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TenantWebhook>(res)),

	WEBHOOK_CREATE: async (
		tenantId: string,
		data: TenantWebhookCreatePayload,
	): Promise<TenantWebhook> =>
		await $http
			.post(TENANTS_V2_ENDPOINTS.webhook, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TenantWebhook>(res)),

	WEBHOOK_UPDATE: async (
		tenantId: string,
		data: TenantWebhookUpdatePayload,
	): Promise<TenantWebhook> =>
		await $http
			.patch(TENANTS_V2_ENDPOINTS.webhook, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TenantWebhook>(res)),

	WEBHOOK_EVENTS_LIST: async (
		tenantId: string,
		params?: TenantWebhookEventListQuery,
	): Promise<PaginatedTenantWebhookEventListResult> =>
		await $http
			.get(TENANTS_V2_ENDPOINTS.webhookEvents, {
				...withTenantHeader(tenantId),
				params,
			})
			.then((res) => unwrapV2Paginated(res)),
};
