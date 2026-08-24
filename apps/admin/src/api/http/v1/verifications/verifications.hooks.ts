import { useQuery } from "@tanstack/react-query";

import { VERIFICATIONS_API } from "./verifications.api";
import type {
	VerificationBatchesListQuery,
	VerificationRequestsListQuery,
} from "./verifications.types";

const VERIFICATIONS_STALE_TIME = 60_000;

export const VERIFICATIONS_QUERY_KEYS = {
	all: ["verifications"] as const,
	requests: (tenantId: string, params?: Partial<VerificationRequestsListQuery>) =>
		["verifications", "requests", tenantId, params ?? {}] as const,
	batches: (tenantId: string, params?: Partial<VerificationBatchesListQuery>) =>
		["verifications", "batches", tenantId, params ?? {}] as const,
	batchDetail: (id: string) => ["verifications", "batch", id] as const,
} as const;

export const useVerificationRequestsQuery = (
	tenantId: string | undefined,
	params?: Partial<VerificationRequestsListQuery>,
	enabled = true,
) =>
	useQuery({
		queryKey: VERIFICATIONS_QUERY_KEYS.requests(tenantId ?? "", params),
		queryFn: () =>
			VERIFICATIONS_API.REQUESTS_LIST({
				tenant_id: tenantId ?? "",
				...params,
			}),
		enabled: enabled && Boolean(tenantId),
		staleTime: VERIFICATIONS_STALE_TIME,
	});

export const useVerificationBatchesQuery = (
	tenantId: string | undefined,
	params?: Partial<VerificationBatchesListQuery>,
	enabled = true,
) =>
	useQuery({
		queryKey: VERIFICATIONS_QUERY_KEYS.batches(tenantId ?? "", params),
		queryFn: () =>
			VERIFICATIONS_API.VERIFICATION_BATCHES_LIST({
				tenant_id: tenantId ?? "",
				...params,
			}),
		enabled: enabled && Boolean(tenantId),
		staleTime: VERIFICATIONS_STALE_TIME,
	});

export const useVerificationBatchDetailQuery = (
	batchId: string | undefined,
	enabled = true,
) =>
	useQuery({
		queryKey: VERIFICATIONS_QUERY_KEYS.batchDetail(batchId ?? ""),
		queryFn: () => VERIFICATIONS_API.VERIFICATION_BATCH_DETAIL(batchId ?? ""),
		enabled: enabled && Boolean(batchId),
		staleTime: VERIFICATIONS_STALE_TIME,
	});
