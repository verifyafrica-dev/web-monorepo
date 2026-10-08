import { getHttpClient } from "../../../client";
import { unwrapV2Data } from "../../../shared";
import type {
	VerificationRequest,
	VerificationRequestCreatePayload,
} from "../verifications.types";
import type {
	NewVerifyAddressSubmitData,
	NewVerifyAddressSubmitPayload,
	NewVerifyDocumentSubmitData,
	NewVerifyDocumentSubmitPayload,
	NewVerifyFaceSubmitData,
	NewVerifyFaceSubmitPayload,
	NewVerifyFeedbackSubmitData,
	NewVerifyFeedbackSubmitPayload,
	NewVerifyAmlSubmitData,
	NewVerifyAmlSubmitPayload,
	NewVerifyBusinessAmlSubmitData,
	NewVerifyBusinessAmlSubmitPayload,
	NewVerifyGovernmentRegistrySubmitPayload,
	NewVerifyKybSubmitData,
	NewVerifyKybSubmitPayload,
	NewVerifyPresignData,
	NewVerifyPresignPayload,
	NewVerifySession,
} from "./new-verify.types";

const TENANT_ID_HEADER = "X-TENANT-ID";

const NEW_VERIFY_V2_ENDPOINTS = {
	root: "/v2/verifications/new-verify/",
	token: (token: string) => `/v2/verifications/new-verify/${token}/`,
	presign: (token: string) => `/v2/verifications/new-verify/${token}/presign/`,
	feedback: (token: string) => `/v2/verifications/new-verify/${token}/feedback/`,
	documentVerification: (token: string) =>
		`/v2/verifications/new-verify/${token}/document_verification/`,
	addressVerification: (token: string) =>
		`/v2/verifications/new-verify/${token}/address_verification/`,
	faceVerification: (token: string) =>
		`/v2/verifications/new-verify/${token}/face_verification/`,
	amlScreening: (token: string) =>
		`/v2/verifications/new-verify/${token}/aml_screening/`,
	businessAmlScreening: (token: string) =>
		`/v2/verifications/new-verify/${token}/business_aml_screening/`,
	kybScreening: (token: string) =>
		`/v2/verifications/new-verify/${token}/kyb_screening/`,
	governmentRegistry: (token: string) =>
		`/v2/verifications/new-verify/${token}/government_registry/`,
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
		await getHttpClient()
			.post(NEW_VERIFY_V2_ENDPOINTS.root, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<VerificationRequest>(res)),

	TOKEN: async (token: string): Promise<NewVerifySession> =>
		await getHttpClient()
			.get(NEW_VERIFY_V2_ENDPOINTS.token(token))
			.then((res) => unwrapV2Data<NewVerifySession>(res)),

	PRESIGN: async (
		token: string,
		data: NewVerifyPresignPayload,
	): Promise<NewVerifyPresignData> =>
		await getHttpClient()
			.post(NEW_VERIFY_V2_ENDPOINTS.presign(token), data)
			.then((res) => unwrapV2Data<NewVerifyPresignData>(res)),

	DOCUMENT_VERIFICATION: async (
		token: string,
		data: NewVerifyDocumentSubmitPayload,
	): Promise<NewVerifyDocumentSubmitData> =>
		await getHttpClient()
			.post(NEW_VERIFY_V2_ENDPOINTS.documentVerification(token), data)
			.then((res) => unwrapV2Data<NewVerifyDocumentSubmitData>(res)),

	ADDRESS_VERIFICATION: async (
		token: string,
		data: NewVerifyAddressSubmitPayload,
	): Promise<NewVerifyAddressSubmitData> =>
		await getHttpClient()
			.post(NEW_VERIFY_V2_ENDPOINTS.addressVerification(token), data)
			.then((res) => unwrapV2Data<NewVerifyAddressSubmitData>(res)),

	FACE_VERIFICATION: async (
		token: string,
		data: NewVerifyFaceSubmitPayload,
	): Promise<NewVerifyFaceSubmitData> =>
		await getHttpClient()
			.post(NEW_VERIFY_V2_ENDPOINTS.faceVerification(token), data)
			.then((res) => unwrapV2Data<NewVerifyFaceSubmitData>(res)),

	AML_SCREENING: async (
		token: string,
		data: NewVerifyAmlSubmitPayload,
	): Promise<NewVerifyAmlSubmitData> =>
		await getHttpClient()
			.post(NEW_VERIFY_V2_ENDPOINTS.amlScreening(token), data)
			.then((res) => unwrapV2Data<NewVerifyAmlSubmitData>(res)),

	BUSINESS_AML_SCREENING: async (
		token: string,
		data: NewVerifyBusinessAmlSubmitPayload,
	): Promise<NewVerifyBusinessAmlSubmitData> =>
		await getHttpClient()
			.post(NEW_VERIFY_V2_ENDPOINTS.businessAmlScreening(token), data)
			.then((res) => unwrapV2Data<NewVerifyBusinessAmlSubmitData>(res)),

	KYB_SCREENING: async (
		token: string,
		data: NewVerifyKybSubmitPayload,
	): Promise<NewVerifyKybSubmitData> =>
		await getHttpClient()
			.post(NEW_VERIFY_V2_ENDPOINTS.kybScreening(token), data)
			.then((res) => unwrapV2Data<NewVerifyKybSubmitData>(res)),

	GOVERNMENT_REGISTRY: async (
		token: string,
		data: NewVerifyGovernmentRegistrySubmitPayload,
	): Promise<NewVerifyAddressSubmitData> =>
		await getHttpClient()
			.post(NEW_VERIFY_V2_ENDPOINTS.governmentRegistry(token), data)
			.then((res) => unwrapV2Data<NewVerifyAddressSubmitData>(res)),

	FEEDBACK: async (
		token: string,
		data: NewVerifyFeedbackSubmitPayload,
	): Promise<NewVerifyFeedbackSubmitData> =>
		await getHttpClient()
			.post(NEW_VERIFY_V2_ENDPOINTS.feedback(token), data)
			.then((res) => unwrapV2Data<NewVerifyFeedbackSubmitData>(res)),
};
