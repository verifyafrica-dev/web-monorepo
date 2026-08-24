import {
	useMutation,
	useQuery,
	useQueryClient,
	type UseQueryResult,
} from "@tanstack/react-query";

import { WALLET_V2_API } from "./wallet.api";
import type {
	AdminManualCreditData,
	AdminManualCreditRequestPayload,
	PaginatedWalletBalanceListResult,
	PaginatedWalletFundingRequestListResult,
	PaginatedWalletTransactionListResult,
	TopUpRequestPayload,
	TopUpSessionData,
	TopUpVerifyData,
	Wallet,
	WalletListQuery,
	WalletTransaction,
	WalletTransactionsQuery,
} from "./wallet.types";

const WALLET_V2_STALE_TIME = 60_000;

export const WALLET_V2_QUERY_KEYS = {
	all: ["wallet-v2"] as const,
	balance: (tenantId: string) => ["wallet-v2", "balance", tenantId] as const,
	allBalances: (params?: WalletListQuery) =>
		["wallet-v2", "balance", "all", params ?? {}] as const,
	tenantFundingRequests: (tenantId: string, params?: WalletListQuery) =>
		["wallet-v2", "funding-requests", tenantId, params ?? {}] as const,
	allFundingRequests: (params?: WalletListQuery) =>
		["wallet-v2", "funding-requests", "all", params ?? {}] as const,
	topUpVerify: (tenantId: string, sessionId: string) =>
		["wallet-v2", "top-up", "verify", tenantId, sessionId] as const,
	tenantTransactions: (tenantId: string, params?: WalletTransactionsQuery) =>
		["wallet-v2", "transactions", tenantId, params ?? {}] as const,
	allTransactions: (params?: WalletTransactionsQuery) =>
		["wallet-v2", "transactions", "all", params ?? {}] as const,
} as const;

export const useWalletBalanceV2Query = (
	tenantId: string | undefined,
	enabled = true,
): UseQueryResult<Wallet> =>
	useQuery<Wallet>({
		queryKey: WALLET_V2_QUERY_KEYS.balance(tenantId ?? ""),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return WALLET_V2_API.BALANCE(tenantId);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: WALLET_V2_STALE_TIME,
	});

export const useAllWalletBalancesV2Query = (
	params?: WalletListQuery,
	enabled = true,
): UseQueryResult<PaginatedWalletBalanceListResult> =>
	useQuery<PaginatedWalletBalanceListResult>({
		queryKey: WALLET_V2_QUERY_KEYS.allBalances(params),
		queryFn: () => WALLET_V2_API.ALL_BALANCES(params),
		enabled,
		staleTime: WALLET_V2_STALE_TIME,
	});

export const useTenantFundingRequestsV2Query = (
	tenantId: string | undefined,
	params?: WalletListQuery,
	enabled = true,
): UseQueryResult<PaginatedWalletFundingRequestListResult> =>
	useQuery<PaginatedWalletFundingRequestListResult>({
		queryKey: WALLET_V2_QUERY_KEYS.tenantFundingRequests(
			tenantId ?? "",
			params,
		),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return WALLET_V2_API.TENANT_FUNDING_REQUESTS(tenantId, params);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: WALLET_V2_STALE_TIME,
	});

export const useAllFundingRequestsV2Query = (
	params?: WalletListQuery,
	enabled = true,
): UseQueryResult<PaginatedWalletFundingRequestListResult> =>
	useQuery<PaginatedWalletFundingRequestListResult>({
		queryKey: WALLET_V2_QUERY_KEYS.allFundingRequests(params),
		queryFn: () => WALLET_V2_API.ALL_FUNDING_REQUESTS(params),
		enabled,
		staleTime: WALLET_V2_STALE_TIME,
	});

export const useTenantTransactionsV2Query = (
	tenantId: string | undefined,
	params?: WalletTransactionsQuery,
	enabled = true,
): UseQueryResult<PaginatedWalletTransactionListResult> =>
	useQuery<PaginatedWalletTransactionListResult>({
		queryKey: WALLET_V2_QUERY_KEYS.tenantTransactions(tenantId ?? "", params),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return WALLET_V2_API.TENANT_TRANSACTIONS(tenantId, params);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: WALLET_V2_STALE_TIME,
	});

export const useAllTransactionsV2Query = (
	params?: WalletTransactionsQuery,
	enabled = true,
): UseQueryResult<PaginatedWalletTransactionListResult> =>
	useQuery<PaginatedWalletTransactionListResult>({
		queryKey: WALLET_V2_QUERY_KEYS.allTransactions(params),
		queryFn: () => WALLET_V2_API.ALL_TRANSACTIONS(params),
		enabled,
		staleTime: WALLET_V2_STALE_TIME,
	});

export const useTopUpVerifyV2Query = (
	tenantId: string | undefined,
	sessionId: string | undefined,
	enabled = true,
): UseQueryResult<TopUpVerifyData> =>
	useQuery<TopUpVerifyData>({
		queryKey: WALLET_V2_QUERY_KEYS.topUpVerify(tenantId ?? "", sessionId ?? ""),
		queryFn: () => {
			if (!tenantId || !sessionId) {
				throw new Error("Tenant ID and session ID are required");
			}

			return WALLET_V2_API.TOP_UP_VERIFY(tenantId, sessionId);
		},
		enabled: enabled && Boolean(tenantId) && Boolean(sessionId),
		staleTime: WALLET_V2_STALE_TIME,
	});

export const useCreateWalletCreditV2Mutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			tenantId,
			payload,
		}: {
			tenantId: string;
			payload: AdminManualCreditRequestPayload;
		}) => WALLET_V2_API.CREATE_CREDIT(tenantId, payload),
		onSuccess: (_data: AdminManualCreditData, { tenantId }) => {
			queryClient.invalidateQueries({
				queryKey: WALLET_V2_QUERY_KEYS.balance(tenantId),
			});
			queryClient.invalidateQueries({ queryKey: WALLET_V2_QUERY_KEYS.all });
		},
	});
};

export const useTopUpCreateSessionV2Mutation = () =>
	useMutation({
		mutationFn: ({
			tenantId,
			payload,
		}: {
			tenantId: string;
			payload: TopUpRequestPayload;
		}) => WALLET_V2_API.TOP_UP_CREATE_SESSION(tenantId, payload),
	});

export const useExportWalletTransactionsV2Mutation = () =>
	useMutation({
		mutationFn: ({
			tenantId,
			params,
		}: {
			tenantId: string;
			params?: WalletTransactionsQuery;
		}) => WALLET_V2_API.TENANT_TRANSACTIONS_EXPORT(tenantId, params),
	});

export type {
	AdminManualCreditData,
	PaginatedWalletBalanceListResult,
	PaginatedWalletFundingRequestListResult,
	PaginatedWalletTransactionListResult,
	TopUpSessionData,
	TopUpVerifyData,
	Wallet,
	WalletTransaction,
};
