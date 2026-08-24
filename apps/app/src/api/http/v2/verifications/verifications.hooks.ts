import {
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import { useOrganizationQueryKey } from "../organization-query";
import { VERIFICATIONS_V2_API } from "./verifications.api";
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
	VerificationRequest,
	VerificationRequestCreatePayload,
	VerificationRequestDetail,
	VerificationSendEmailData,
	VerificationSupportedCountriesData,
	VerificationTypeDefinition,
} from "./verifications.types";

const VERIFICATIONS_V2_STALE_TIME = 60_000;

export const VERIFICATIONS_V2_QUERY_KEYS = {
	all: ["verifications-v2"] as const,
	types: (tenantId?: string) =>
		["verifications-v2", "types", tenantId ?? "global"] as const,
	allRequests: (params?: VerificationListQuery) =>
		["verifications-v2", "requests", "all", params ?? {}] as const,
	tenantRequests: (tenantId: string, params?: VerificationListQuery) =>
		["verifications-v2", "requests", tenantId, params ?? {}] as const,
	requestDetail: (verificationId: string) =>
		["verifications-v2", "requests", "detail", verificationId] as const,
	allMixedVerifications: (params?: MixedVerificationListQuery) =>
		["verifications-v2", "mixed", "all", params ?? {}] as const,
	tenantMixedVerifications: (
		tenantId: string | undefined,
		params?: MixedVerificationListQuery,
	) =>
		["verifications-v2", "mixed", tenantId ?? "global", params ?? {}] as const,
	mixedVerificationDetail: (id: string) =>
		["verifications-v2", "mixed", "detail", id] as const,
	allBatches: (params?: VerificationBatchListQuery) =>
		["verifications-v2", "batches", "all", params ?? {}] as const,
	tenantBatches: (tenantId: string, params?: VerificationBatchListQuery) =>
		["verifications-v2", "batches", tenantId, params ?? {}] as const,
	batchDetail: (id: string) =>
		["verifications-v2", "batches", "detail", id] as const,
	allPrices: (params?: VerificationBatchListQuery) =>
		["verifications-v2", "prices", "all", params ?? {}] as const,
	tenantPrices: (tenantId: string, params?: VerificationBatchListQuery) =>
		["verifications-v2", "prices", tenantId, params ?? {}] as const,
	priceDetail: (id: number) =>
		["verifications-v2", "prices", "detail", id] as const,
	linkDetail: (link: string) => ["verifications-v2", "links", link] as const,
	supportedCountries: (verificationType: string) =>
		["verifications-v2", "supported-countries", verificationType] as const,
} as const;

export const useVerificationTypesV2Query = (
	tenantId?: string,
	enabled = true,
): UseQueryResult<VerificationTypeDefinition[]> => {
	return useQuery<VerificationTypeDefinition[]>({
		queryKey: useOrganizationQueryKey(
			VERIFICATIONS_V2_QUERY_KEYS.types(tenantId),
		),
		queryFn: () => VERIFICATIONS_V2_API.TYPES(tenantId),
		enabled,
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});
};

export const useAllVerificationRequestsV2Query = (
	params?: VerificationListQuery,
	enabled = true,
): UseQueryResult<PaginatedVerificationRequestListResult> => {
	return useQuery<PaginatedVerificationRequestListResult>({
		queryKey: useOrganizationQueryKey(
			VERIFICATIONS_V2_QUERY_KEYS.allRequests(params),
		),
		queryFn: () => VERIFICATIONS_V2_API.ALL_REQUESTS(params),
		enabled,
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});
};

export const useTenantVerificationRequestsV2Query = (
	tenantId: string | undefined,
	params?: VerificationListQuery,
	enabled = true,
): UseQueryResult<PaginatedVerificationRequestListResult> => {
	return useQuery<PaginatedVerificationRequestListResult>({
		queryKey: useOrganizationQueryKey(
			VERIFICATIONS_V2_QUERY_KEYS.tenantRequests(tenantId ?? "", params),
		),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return VERIFICATIONS_V2_API.TENANT_REQUESTS(tenantId, params);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});
};

export const useVerificationRequestDetailV2Query = (
	verificationId: string | undefined,
	enabled = true,
): UseQueryResult<VerificationRequestDetail> => {
	return useQuery<VerificationRequestDetail>({
		queryKey: useOrganizationQueryKey(
			VERIFICATIONS_V2_QUERY_KEYS.requestDetail(verificationId ?? ""),
		),
		queryFn: () => VERIFICATIONS_V2_API.REQUEST_DETAIL(verificationId ?? ""),
		enabled: enabled && Boolean(verificationId),
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});
};

export const useAllMixedVerificationsV2Query = (
	params?: MixedVerificationListQuery,
	enabled = true,
): UseQueryResult<PaginatedMixedVerificationListResult> => {
	return useQuery<PaginatedMixedVerificationListResult>({
		queryKey: useOrganizationQueryKey(
			VERIFICATIONS_V2_QUERY_KEYS.allMixedVerifications(params),
		),
		queryFn: () => VERIFICATIONS_V2_API.ALL_MIXED_VERIFICATIONS(params),
		enabled,
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});
};

export const useTenantMixedVerificationsV2Query = (
	tenantId: string | undefined,
	params?: MixedVerificationListQuery,
	enabled = true,
): UseQueryResult<PaginatedMixedVerificationListResult> => {
	return useQuery<PaginatedMixedVerificationListResult>({
		queryKey: useOrganizationQueryKey(
			VERIFICATIONS_V2_QUERY_KEYS.tenantMixedVerifications(tenantId, params),
		),
		queryFn: () =>
			VERIFICATIONS_V2_API.TENANT_MIXED_VERIFICATIONS(tenantId, params),
		enabled,
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});
};

export const useMixedVerificationDetailV2Query = (
	id: string | undefined,
	enabled = true,
): UseQueryResult<MixedVerification> => {
	return useQuery<MixedVerification>({
		queryKey: useOrganizationQueryKey(
			VERIFICATIONS_V2_QUERY_KEYS.mixedVerificationDetail(id ?? ""),
		),
		queryFn: () => VERIFICATIONS_V2_API.MIXED_VERIFICATION_DETAIL(id ?? ""),
		enabled: enabled && Boolean(id),
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});
};

export const useAllVerificationBatchesV2Query = (
	params?: VerificationBatchListQuery,
	enabled = true,
): UseQueryResult<PaginatedVerificationBatchListResult> => {
	return useQuery<PaginatedVerificationBatchListResult>({
		queryKey: useOrganizationQueryKey(
			VERIFICATIONS_V2_QUERY_KEYS.allBatches(params),
		),
		queryFn: () => VERIFICATIONS_V2_API.ALL_BATCHES(params),
		enabled,
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});
};

export const useTenantVerificationBatchesV2Query = (
	tenantId: string | undefined,
	params?: VerificationBatchListQuery,
	enabled = true,
): UseQueryResult<PaginatedVerificationBatchListResult> => {
	return useQuery<PaginatedVerificationBatchListResult>({
		queryKey: useOrganizationQueryKey(
			VERIFICATIONS_V2_QUERY_KEYS.tenantBatches(tenantId ?? "", params),
		),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return VERIFICATIONS_V2_API.TENANT_BATCHES(tenantId, params);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});
};

export const useVerificationBatchDetailV2Query = (
	batchId: string | undefined,
	enabled = true,
): UseQueryResult<VerificationBatch> => {
	return useQuery<VerificationBatch>({
		queryKey: useOrganizationQueryKey(
			VERIFICATIONS_V2_QUERY_KEYS.batchDetail(batchId ?? ""),
		),
		queryFn: () => VERIFICATIONS_V2_API.BATCH_DETAIL(batchId ?? ""),
		enabled: enabled && Boolean(batchId),
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});
};

export const useAllVerificationPricesV2Query = (
	params?: VerificationBatchListQuery,
	enabled = true,
): UseQueryResult<PaginatedVerificationPriceListResult> => {
	return useQuery<PaginatedVerificationPriceListResult>({
		queryKey: useOrganizationQueryKey(
			VERIFICATIONS_V2_QUERY_KEYS.allPrices(params),
		),
		queryFn: () => VERIFICATIONS_V2_API.ALL_PRICES(params),
		enabled,
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});
};

export const useTenantVerificationPricesV2Query = (
	tenantId: string | undefined,
	params?: VerificationBatchListQuery,
	enabled = true,
): UseQueryResult<PaginatedVerificationTypePriceListResult> => {
	return useQuery<PaginatedVerificationTypePriceListResult>({
		queryKey: useOrganizationQueryKey(
			VERIFICATIONS_V2_QUERY_KEYS.tenantPrices(tenantId ?? "", params),
		),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return VERIFICATIONS_V2_API.TENANT_PRICES(tenantId, params);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});
};

export const useVerificationPriceDetailV2Query = (
	id: number | undefined,
	enabled = true,
): UseQueryResult<VerificationPrice> => {
	return useQuery<VerificationPrice>({
		queryKey: useOrganizationQueryKey(
			VERIFICATIONS_V2_QUERY_KEYS.priceDetail(id ?? 0),
		),
		queryFn: () => VERIFICATIONS_V2_API.PRICE_DETAIL(id ?? 0),
		enabled: enabled && id !== undefined,
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});
};

export const useVerificationLinkDetailV2Query = (
	link: string | undefined,
	enabled = true,
): UseQueryResult<VerificationLink> =>
	useQuery<VerificationLink>({
		queryKey: VERIFICATIONS_V2_QUERY_KEYS.linkDetail(link ?? ""),
		queryFn: () => VERIFICATIONS_V2_API.LINK_DETAIL(link ?? ""),
		enabled: enabled && Boolean(link),
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});

export const useVerificationSupportedCountriesV2Query = (
	verificationType: string,
	enabled = true,
): UseQueryResult<VerificationSupportedCountriesData> =>
	useQuery<VerificationSupportedCountriesData>({
		queryKey:
			VERIFICATIONS_V2_QUERY_KEYS.supportedCountries(verificationType),
		queryFn: () => VERIFICATIONS_V2_API.SUPPORTED_COUNTRIES(verificationType),
		enabled: enabled && Boolean(verificationType),
		staleTime: VERIFICATIONS_V2_STALE_TIME,
	});

export const useCreateVerificationRequestV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			tenantId,
			payload,
		}: {
			tenantId: string;
			payload: VerificationRequestCreatePayload;
		}) => VERIFICATIONS_V2_API.CREATE_REQUEST(tenantId, payload),
		onSuccess: (_data: VerificationRequest, { tenantId }) => {
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.tenantRequests(tenantId),
			});
		},
	});
};

export const useSendVerificationEmailV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (verificationId: string) =>
			VERIFICATIONS_V2_API.REQUEST_SEND_EMAIL(verificationId),
		onSuccess: (_data: VerificationSendEmailData, verificationId: string) => {
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.requestDetail(verificationId),
			});
		},
	});
};

export const useRefreshVerificationStatusV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (verificationId: string) =>
			VERIFICATIONS_V2_API.REQUEST_REFRESH_STATUS(verificationId),
		onSuccess: (data: VerificationRequest) => {
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.requestDetail(data.id),
			});
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.all,
			});
		},
	});
};

export const useFetchVerificationProofV2Mutation = () =>
	useMutation({
		mutationFn: ({
			proofUrl,
			accessToken,
		}: {
			proofUrl: string;
			accessToken: string;
		}) => VERIFICATIONS_V2_API.FETCH_SHUFTI_PROOF_ASSET(proofUrl, accessToken),
	});

export const useCreateMixedVerificationV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			payload,
			tenantId,
		}: {
			payload: MixedVerificationUpsertPayload;
			tenantId?: string;
		}) => VERIFICATIONS_V2_API.CREATE_MIXED_VERIFICATION(payload, tenantId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.all,
			});
		},
	});
};

export const useUpdateMixedVerificationV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			payload,
			tenantId,
		}: {
			id: string;
			payload: Partial<MixedVerificationUpsertPayload>;
			tenantId?: string;
		}) => VERIFICATIONS_V2_API.UPDATE_MIXED_VERIFICATION(id, payload, tenantId),
		onSuccess: (data: MixedVerification) => {
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.mixedVerificationDetail(data.id),
			});
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.all,
			});
		},
	});
};

export const useDeleteMixedVerificationV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) =>
			VERIFICATIONS_V2_API.DELETE_MIXED_VERIFICATION(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.all,
			});
		},
	});
};

export const useStartMixedVerificationV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			tenantId,
			payload,
		}: {
			tenantId: string;
			payload: MixedVerificationStartPayload;
		}) => VERIFICATIONS_V2_API.START_MIXED_VERIFICATION(tenantId, payload),
		onSuccess: (_data: VerificationRequest, { tenantId }) => {
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.tenantRequests(tenantId),
			});
		},
	});
};

export const useCreateVerificationPriceV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: Partial<VerificationPrice>) =>
			VERIFICATIONS_V2_API.CREATE_PRICE(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.allPrices(),
			});
		},
	});
};

export const useUpdateVerificationPriceV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			payload,
		}: {
			id: number;
			payload: Partial<VerificationPrice>;
		}) => VERIFICATIONS_V2_API.UPDATE_PRICE(id, payload),
		onSuccess: (data: VerificationPrice) => {
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.priceDetail(data.id),
			});
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.allPrices(),
			});
		},
	});
};

export const useBulkCreateVerificationsV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			tenantId,
			payload,
		}: {
			tenantId: string;
			payload: BulkVerificationCreatePayload;
		}) => VERIFICATIONS_V2_API.BULK_CREATE(tenantId, payload),
		onSuccess: (_data: VerificationBatch, { tenantId }) => {
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.tenantBatches(tenantId),
			});
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.tenantRequests(tenantId),
			});
		},
	});
};

export const useRetryFailedVerificationBatchV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			tenantId,
			batchId,
		}: {
			tenantId: string;
			batchId: string;
		}) => VERIFICATIONS_V2_API.RETRY_FAILED_BATCH(tenantId, batchId),
		onSuccess: (_message: string, { tenantId, batchId }) => {
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.batchDetail(batchId),
			});
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.tenantBatches(tenantId),
			});
		},
	});
};

export type {
	PaginatedMixedVerificationListResult,
	PaginatedVerificationBatchListResult,
	PaginatedVerificationPriceListResult,
	PaginatedVerificationRequestListResult,
	PaginatedVerificationTypePriceListResult,
	VerificationBatch,
	VerificationLink,
	VerificationPrice,
	VerificationRequest,
	VerificationRequestDetail,
	VerificationTypeDefinition,
};
