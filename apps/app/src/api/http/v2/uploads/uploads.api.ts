import { unwrapV2Data } from "#/api/http/shared";
import $http from "../../xhr";
import type {
	R2DeleteUploadPayload,
	R2DeleteUploadResult,
	R2PresignUploadPayload,
	R2PresignUploadResult,
} from "./uploads.types";

const TENANT_ID_HEADER = "X-TENANT-ID";

const UPLOADS_V2_ENDPOINTS = {
	presign: "/v2/uploads/presign/",
	root: "/v2/uploads/",
} as const;

const withTenantHeader = (tenantId: string) => ({
	headers: {
		[TENANT_ID_HEADER]: tenantId,
	},
});

export const UPLOADS_V2_API = {
	PRESIGN: async (
		tenantId: string,
		data: R2PresignUploadPayload,
	): Promise<R2PresignUploadResult> =>
		await $http
			.post(UPLOADS_V2_ENDPOINTS.presign, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<R2PresignUploadResult>(res)),

	DELETE: async (
		tenantId: string,
		data: R2DeleteUploadPayload,
	): Promise<R2DeleteUploadResult> =>
		await $http
			.delete(UPLOADS_V2_ENDPOINTS.root, {
				...withTenantHeader(tenantId),
				data,
			})
			.then((res) => unwrapV2Data<R2DeleteUploadResult>(res)),
};
