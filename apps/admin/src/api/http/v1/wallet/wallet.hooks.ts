import {
	type UseQueryResult,
	useMutation,
	useQuery,
} from "@tanstack/react-query";

import { WALLET_API } from "./wallet.api";
import type {
	Wallet,
	WalletAdminCreditsPayload,
	WalletAdminCreditsResponse,
	WalletFundingRequestsListResponse,
	WalletTopUpCreateSessionPayload,
	WalletTopUpCreateSessionResponse,
	WalletTopUpVerifyResponse,
	WalletTransactionsListResponse,
	WalletTransactionsQuery,
} from "./wallet.types";

const WALLET_STALE_TIME = 60_000;

export const WALLET_QUERY_KEYS = {
	all: ["wallet"] as const,
	balance: (tenantId: string) => ["wallet", "balance", tenantId] as const,
	transactionsList: (params?: WalletTransactionsQuery) =>
		["wallet", "transactions", params ?? {}] as const,
	fundingRequestsList: (params?: { offset?: number; page_size?: number }) =>
		["wallet", "funding-requests", params ?? {}] as const,
	topUpVerify: (tenantId: string) =>
		["wallet", "top-up", "verify", tenantId] as const,
} as const;

export const useWalletBalanceQuery = (
	tenantId: string | undefined,
	enabled = true,
): UseQueryResult<Wallet, Error> =>
	useQuery<Wallet, Error>({
		queryKey: WALLET_QUERY_KEYS.balance(tenantId ?? ""),
		queryFn: () => WALLET_API.BALANCE({ tenant_id: tenantId ?? "" }),
		enabled: enabled && Boolean(tenantId),
		staleTime: WALLET_STALE_TIME,
	});

export const useWalletTransactionsQuery = (
	params?: WalletTransactionsQuery,
	enabled = true,
) =>
	useQuery<WalletTransactionsListResponse>({
		queryKey: WALLET_QUERY_KEYS.transactionsList(params),
		queryFn: () => WALLET_API.TRANSACTIONS(params),
		enabled,
		staleTime: WALLET_STALE_TIME,
	});

export const useExportWalletTransactionsMutation = () =>
	useMutation({
		mutationFn: (params?: WalletTransactionsQuery) =>
			WALLET_API.TRANSACTIONS_EXPORT(params),
	});

export const useWalletFundingRequestsQuery = (
	params?: { offset?: number; page_size?: number },
	enabled = true,
) =>
	useQuery<WalletFundingRequestsListResponse>({
		queryKey: WALLET_QUERY_KEYS.fundingRequestsList(params),
		queryFn: () => WALLET_API.FUNDING_REQUESTS(params),
		enabled,
		staleTime: WALLET_STALE_TIME,
	});

export const useWalletTopUpCreateSessionMutation = () =>
	useMutation<
		WalletTopUpCreateSessionResponse,
		Error,
		{
			tenantId: string;
			payload: WalletTopUpCreateSessionPayload;
		}
	>({
		mutationFn: ({ tenantId, payload }) =>
			WALLET_API.TOP_UP_CREATE_SESSION(tenantId, payload),
	});

export const useWalletTopUpVerifyQuery = (
	tenantId: string | undefined,
	enabled = true,
) =>
	useQuery<WalletTopUpVerifyResponse, Error>({
		queryKey: WALLET_QUERY_KEYS.topUpVerify(tenantId ?? ""),
		queryFn: () => WALLET_API.TOP_UP_VERIFY(tenantId ?? ""),
		enabled: enabled && Boolean(tenantId),
		staleTime: WALLET_STALE_TIME,
	});

export const useWalletAdminCreditsMutation = () =>
	useMutation<
		WalletAdminCreditsResponse,
		Error,
		{
			tenantId: string;
			payload: WalletAdminCreditsPayload;
		}
	>({
		mutationFn: ({ tenantId, payload }) =>
			WALLET_API.ADMIN_CREDITS(tenantId, payload),
	});
