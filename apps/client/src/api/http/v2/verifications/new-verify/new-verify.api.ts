import { unwrapV2Data } from "#/api/http/shared";
import $http from "../../../xhr";
import type {
	VerificationRequest,
	VerificationRequestCreatePayload,
} from "../verifications.types";
import type {
	NewVerifyDocumentSubmitData,
	NewVerifyDocumentSubmitPayload,
	NewVerifyPresignData,
	NewVerifyPresignPayload,
	NewVerifySession,
} from "./new-verify.types";

const TENANT_ID_HEADER = "X-TENANT-ID";

const NEW_VERIFY_V2_ENDPOINTS = {
	root: "/v2/verifications/new-verify/",
	token: (token: string) => `/v2/verifications/new-verify/${token}/`,
	presign: (token: string) => `/v2/verifications/new-verify/${token}/presign/`,
	documentVerification: (token: string) =>
		`/v2/verifications/new-verify/${token}/document_verification/`,
} as const;

const withTenantHeader = (tenantId: string) => ({
	headers: {
		[TENANT_ID_HEADER]: tenantId,
	},
});

export const NEW_VERIFY_V2_API = {
	CREATE: async (
		tenantId: string,
		data: VerificationRequestCreatePayload,
	): Promise<VerificationRequest> =>
		await $http
			.post(NEW_VERIFY_V2_ENDPOINTS.root, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<VerificationRequest>(res)),

	TOKEN: async (token: string): Promise<NewVerifySession> =>
		await $http
			.get(NEW_VERIFY_V2_ENDPOINTS.token(token))
			.then((res) => unwrapV2Data<NewVerifySession>(res)),

	PRESIGN: async (
		token: string,
		data: NewVerifyPresignPayload,
	): Promise<NewVerifyPresignData> =>
		await $http
			.post(NEW_VERIFY_V2_ENDPOINTS.presign(token), data)
			.then((res) => unwrapV2Data<NewVerifyPresignData>(res)),

	DOCUMENT_VERIFICATION: async (
		token: string,
		data: NewVerifyDocumentSubmitPayload,
	): Promise<NewVerifyDocumentSubmitData> =>
		await $http
			.post(NEW_VERIFY_V2_ENDPOINTS.documentVerification(token), data)
			.then((res) => unwrapV2Data<NewVerifyDocumentSubmitData>(res)),
};
