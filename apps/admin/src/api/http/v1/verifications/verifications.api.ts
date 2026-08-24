import $http from "../../xhr";

import type {
	VerificationBatchesListQuery,
	VerificationBatchesListResponse,
	VerificationBatch,
	VerificationRequestsListQuery,
	VerificationRequestsListResponse,
} from "./verifications.types";

const VERIFICATIONS_ENDPOINTS = {
	requests: "/verifications/requests/",
	verificationBatches: "/verifications/verification-batches/",
	verificationBatchDetail: (id: string) =>
		`/verifications/verification-batches/${id}/`,
} as const;

const toDjangoBooleanParam = (value: boolean) => (value ? "True" : "False");

function serializeVerificationQueryParams(
	params: Record<string, unknown>,
): Record<string, unknown> {
	const serialized: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null) {
			continue;
		}

		if (typeof value === "boolean") {
			serialized[key] = toDjangoBooleanParam(value);
			continue;
		}

		serialized[key] = value;
	}

	return serialized;
}

export const VERIFICATIONS_API = {
	REQUESTS_LIST: async (params: VerificationRequestsListQuery) =>
		await $http
			.get<VerificationRequestsListResponse>(VERIFICATIONS_ENDPOINTS.requests, {
				params: serializeVerificationQueryParams({
					format: "json",
					...params,
				}),
			})
			.then((res) => res.data),

	VERIFICATION_BATCHES_LIST: async (params: VerificationBatchesListQuery) =>
		await $http
			.get<VerificationBatchesListResponse>(
				VERIFICATIONS_ENDPOINTS.verificationBatches,
				{
					params: serializeVerificationQueryParams({
						format: "json",
						...params,
					}),
				},
			)
			.then((res) => res.data),

	VERIFICATION_BATCH_DETAIL: async (id: string) =>
		await $http
			.get<VerificationBatch>(
				VERIFICATIONS_ENDPOINTS.verificationBatchDetail(id),
				{
					params: { format: "json" },
				},
			)
			.then((res) => res.data),
};
