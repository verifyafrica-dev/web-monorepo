import $http from "../../xhr";

import type {
	Wallet,
	WalletAdminCreditsPayload,
	WalletAdminCreditsResponse,
	WalletFundingRequestsListResponse,
	WalletTenantQuery,
	WalletTopUpCreateSessionPayload,
	WalletTopUpCreateSessionResponse,
	WalletTopUpVerifyResponse,
	WalletTransactionsListResponse,
	WalletTransactionsQuery,
} from "./wallet.types";

const WALLET_ENDPOINTS = {
	balance: "/wallet/balance/",
	fundingRequests: "/wallet/funding-requests/",
	transactions: "/wallet/transactions/",
	topUpCreateSession: (tenantId: string) =>
		`/wallet/${tenantId}/top-up/create-session/`,
	topUpVerify: (tenantId: string) => `/wallet/${tenantId}/top-up/verify/`,
	adminCredits: (tenantId: string) => `/wallet/admin/${tenantId}/credits/`,
} as const;

export const WALLET_API = {
	BALANCE: async (params: WalletTenantQuery) =>
		await $http
			.get<Wallet>(WALLET_ENDPOINTS.balance, { params })
			.then((res) => res.data),

	TRANSACTIONS: async (params?: WalletTransactionsQuery) =>
		await $http
			.get<WalletTransactionsListResponse>(WALLET_ENDPOINTS.transactions, {
				params,
			})
			.then((res) => res.data),

	TRANSACTIONS_EXPORT: async (params?: WalletTransactionsQuery) => {
		const pageSize = 100;
		let offset = 0;
		const results: WalletTransactionsListResponse["results"] = [];

		while (true) {
			const response = await WALLET_API.TRANSACTIONS({
				...params,
				offset,
				page_size: pageSize,
			});

			results.push(...response.results);

			if (!response.next) {
				break;
			}

			offset += pageSize;
		}

		return results;
	},

	FUNDING_REQUESTS: async (params?: {
		offset?: number;
		page_size?: number;
	}) =>
		await $http
			.get<WalletFundingRequestsListResponse>(
				WALLET_ENDPOINTS.fundingRequests,
				{ params },
			)
			.then((res) => res.data),

	TOP_UP_CREATE_SESSION: async (
		tenantId: string,
		data: WalletTopUpCreateSessionPayload,
	) =>
		await $http
			.post<WalletTopUpCreateSessionResponse>(
				WALLET_ENDPOINTS.topUpCreateSession(tenantId),
				data,
			)
			.then((res) => res.data),

	TOP_UP_VERIFY: async (tenantId: string) =>
		await $http
			.get<WalletTopUpVerifyResponse>(WALLET_ENDPOINTS.topUpVerify(tenantId))
			.then((res) => res.data),

	ADMIN_CREDITS: async (
		tenantId: string,
		data: WalletAdminCreditsPayload,
	) =>
		await $http
			.post<WalletAdminCreditsResponse>(
				WALLET_ENDPOINTS.adminCredits(tenantId),
				data,
			)
			.then((res) => res.data),
};
