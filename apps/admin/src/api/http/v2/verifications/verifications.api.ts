import {
	unwrapV2Data,
	unwrapV2Message,
	unwrapV2Paginated,
} from "@verifyafrica/api-client/http/shared";
import $http from "../../xhr";
import type {
	BulkVerificationCreatePayload,
	MixedVerification,
	MixedVerificationListQuery,
	MixedVerificationStartPayload,
	MixedVerificationUpsertPayload,
	PaginatedMixedVerificationListResult,
	PaginatedVerificationBatchListResult,
	PaginatedVerificationPriceListResult,
	PaginatedVerificationRequestListResult,
	PaginatedVerificationTypePriceListResult,
	VerificationBatch,
	VerificationBatchListQuery,
	VerificationLink,
	VerificationListQuery,
	VerificationPrice,
	VerificationProofKey,
	VerificationRequest,
	VerificationRequestCreatePayload,
	VerificationRequestDetail,
	VerificationSendEmailData,
	VerificationTypeDefinition,
} from "./verifications.types";

const TENANT_ID_HEADER = "X-TENANT-ID";

const VERIFICATIONS_V2_ENDPOINTS = {
	types: "/v2/verifications/types/",
	requests: "/v2/verifications/requests/",
	requestsAll: "/v2/verifications/requests/all/",
	requestDetail: (verificationId: string) =>
		`/v2/verifications/requests/${verificationId}/detail/`,
	requestProof: (verificationId: string, proofKey: VerificationProofKey) =>
		`/v2/verifications/requests/${verificationId}/proofs/${proofKey}/`,
	requestSendEmail: (verificationId: string) =>
		`/v2/verifications/requests/${verificationId}/send-email/`,
	requestRefreshStatus: (verificationId: string) =>
		`/v2/verifications/requests/${verificationId}/refresh-status/`,
	mixedVerifications: "/v2/verifications/mixed-verifications/",
	mixedVerificationsAll: "/v2/verifications/mixed-verifications/all/",
	mixedVerificationDetail: (id: string) =>
		`/v2/verifications/mixed-verifications/${id}/`,
	mixedVerificationStart: "/v2/verifications/mixed-verifications/start/",
	verificationBatches: "/v2/verifications/verification-batches/",
	verificationBatchesAll: "/v2/verifications/verification-batches/all/",
	verificationBatchDetail: (id: string) =>
		`/v2/verifications/verification-batches/${id}/`,
	prices: "/v2/verifications/prices/",
	pricesAll: "/v2/verifications/prices/all/",
	priceDetail: (id: number) => `/v2/verifications/prices/${id}/`,
	bulk: "/v2/verifications/bulk/",
	batchRetryFailed: (batchId: string) =>
		`/v2/verifications/batch/${batchId}/retry-failed/`,
	linkDetail: (link: string) => `/v2/verifications/links/${link}/`,
} as const;

const withTenantHeader = (tenantId: string) => ({
	headers: {
		[TENANT_ID_HEADER]: tenantId,
	},
});

const withOptionalTenantHeader = (tenantId?: string) =>
	tenantId ? withTenantHeader(tenantId) : undefined;

export const VERIFICATIONS_V2_API = {
	TYPES: async (
		tenantId?: string,
	): Promise<VerificationTypeDefinition[]> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.types, {
				...withOptionalTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Data<VerificationTypeDefinition[]>(res)),

	ALL_REQUESTS: async (
		params?: VerificationListQuery,
	): Promise<PaginatedVerificationRequestListResult> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.requestsAll, { params })
			.then((res) => unwrapV2Paginated(res)),

	TENANT_REQUESTS: async (
		tenantId: string,
		params?: VerificationListQuery,
	): Promise<PaginatedVerificationRequestListResult> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.requests, {
				params,
				...withTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Paginated(res)),

	CREATE_REQUEST: async (
		tenantId: string,
		data: VerificationRequestCreatePayload,
	): Promise<VerificationRequest> =>
		await $http
			.post(VERIFICATIONS_V2_ENDPOINTS.requests, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<VerificationRequest>(res)),

	REQUEST_DETAIL: async (
		verificationId: string,
	): Promise<VerificationRequestDetail> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.requestDetail(verificationId))
			.then((res) => unwrapV2Data<VerificationRequestDetail>(res)),

	REQUEST_PROOF: async (
		verificationId: string,
		proofKey: VerificationProofKey,
	): Promise<Blob> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.requestProof(verificationId, proofKey), {
				responseType: "blob",
			})
			.then((res) => res.data as Blob),

	REQUEST_SEND_EMAIL: async (
		verificationId: string,
	): Promise<VerificationSendEmailData> =>
		await $http
			.post(VERIFICATIONS_V2_ENDPOINTS.requestSendEmail(verificationId))
			.then((res) => unwrapV2Data<VerificationSendEmailData>(res)),

	REQUEST_REFRESH_STATUS: async (
		verificationId: string,
	): Promise<VerificationRequest> =>
		await $http
			.post(VERIFICATIONS_V2_ENDPOINTS.requestRefreshStatus(verificationId))
			.then((res) => unwrapV2Data<VerificationRequest>(res)),

	ALL_MIXED_VERIFICATIONS: async (
		params?: MixedVerificationListQuery,
	): Promise<PaginatedMixedVerificationListResult> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.mixedVerificationsAll, { params })
			.then((res) => unwrapV2Paginated(res)),

	TENANT_MIXED_VERIFICATIONS: async (
		tenantId: string | undefined,
		params?: MixedVerificationListQuery,
	): Promise<PaginatedMixedVerificationListResult> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.mixedVerifications, {
				params,
				...withOptionalTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Paginated(res)),

	CREATE_MIXED_VERIFICATION: async (
		data: MixedVerificationUpsertPayload,
		tenantId?: string,
	): Promise<MixedVerification> =>
		await $http
			.post(VERIFICATIONS_V2_ENDPOINTS.mixedVerifications, data, {
				...withOptionalTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Data<MixedVerification>(res)),

	MIXED_VERIFICATION_DETAIL: async (id: string): Promise<MixedVerification> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.mixedVerificationDetail(id))
			.then((res) => unwrapV2Data<MixedVerification>(res)),

	UPDATE_MIXED_VERIFICATION: async (
		id: string,
		data: Partial<MixedVerificationUpsertPayload>,
		tenantId?: string,
	): Promise<MixedVerification> =>
		await $http
			.patch(VERIFICATIONS_V2_ENDPOINTS.mixedVerificationDetail(id), data, {
				...withOptionalTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Data<MixedVerification>(res)),

	DELETE_MIXED_VERIFICATION: async (
		id: string,
	): Promise<string> =>
		await $http
			.delete(VERIFICATIONS_V2_ENDPOINTS.mixedVerificationDetail(id))
			.then((res) => unwrapV2Message(res)),

	START_MIXED_VERIFICATION: async (
		tenantId: string,
		data: MixedVerificationStartPayload,
	): Promise<VerificationRequest> =>
		await $http
			.post(
				VERIFICATIONS_V2_ENDPOINTS.mixedVerificationStart,
				data,
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Data<VerificationRequest>(res)),

	ALL_BATCHES: async (
		params?: VerificationBatchListQuery,
	): Promise<PaginatedVerificationBatchListResult> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.verificationBatchesAll, { params })
			.then((res) => unwrapV2Paginated(res)),

	TENANT_BATCHES: async (
		tenantId: string,
		params?: VerificationBatchListQuery,
	): Promise<PaginatedVerificationBatchListResult> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.verificationBatches, {
				params,
				...withTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Paginated(res)),

	BATCH_DETAIL: async (id: string): Promise<VerificationBatch> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.verificationBatchDetail(id))
			.then((res) => unwrapV2Data<VerificationBatch>(res)),

	ALL_PRICES: async (
		params?: VerificationBatchListQuery,
	): Promise<PaginatedVerificationPriceListResult> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.pricesAll, { params })
			.then((res) => unwrapV2Paginated(res)),

	CREATE_PRICE: async (
		data: Partial<VerificationPrice>,
	): Promise<VerificationPrice> =>
		await $http
			.post(VERIFICATIONS_V2_ENDPOINTS.pricesAll, data)
			.then((res) => unwrapV2Data<VerificationPrice>(res)),

	TENANT_PRICES: async (
		tenantId: string,
		params?: VerificationBatchListQuery,
	): Promise<PaginatedVerificationTypePriceListResult> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.prices, {
				params,
				...withTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Paginated(res)),

	PRICE_DETAIL: async (id: number): Promise<VerificationPrice> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.priceDetail(id))
			.then((res) => unwrapV2Data<VerificationPrice>(res)),

	UPDATE_PRICE: async (
		id: number,
		data: Partial<VerificationPrice>,
	): Promise<VerificationPrice> =>
		await $http
			.patch(VERIFICATIONS_V2_ENDPOINTS.priceDetail(id), data)
			.then((res) => unwrapV2Data<VerificationPrice>(res)),

	BULK_CREATE: async (
		tenantId: string,
		data: BulkVerificationCreatePayload,
	): Promise<VerificationBatch> =>
		await $http
			.post(VERIFICATIONS_V2_ENDPOINTS.bulk, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<VerificationBatch>(res)),

	RETRY_FAILED_BATCH: async (
		tenantId: string,
		batchId: string,
	): Promise<string> =>
		await $http
			.post(
				VERIFICATIONS_V2_ENDPOINTS.batchRetryFailed(batchId),
				undefined,
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Message(res)),

	LINK_DETAIL: async (link: string): Promise<VerificationLink> =>
		await $http
			.get(VERIFICATIONS_V2_ENDPOINTS.linkDetail(link))
			.then((res) => unwrapV2Data<VerificationLink>(res)),
};
