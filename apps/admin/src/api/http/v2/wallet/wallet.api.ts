import { unwrapV2Data, unwrapV2Paginated } from "@verifyafrica/api-client/http/shared";
import $http from "../../xhr";
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
	WalletFundingRequest,
	WalletListQuery,
	WalletTransaction,
	WalletTransactionsQuery,
} from "@verifyafrica/api-client/http/v2/wallet/wallet.types";

const TENANT_ID_HEADER = "X-TENANT-ID";

const WALLET_V2_ENDPOINTS = {
	balance: "/v2/wallet/balance/",
	balanceAll: "/v2/wallet/balance/all/",
	credits: "/v2/wallet/credits/",
	fundingRequests: "/v2/wallet/funding-requests/",
	fundingRequestsAll: "/v2/wallet/funding-requests/all/",
	topUpCreateSession: "/v2/wallet/top-up/create-session/",
	topUpVerify: "/v2/wallet/top-up/verify/",
	transactions: "/v2/wallet/transactions/",
	transactionsExport: "/v2/wallet/transactions/export/",
	transactionsAll: "/v2/wallet/transactions/all/",
	transactionsAllExport: "/v2/wallet/transactions/all/export/",
} as const;

function triggerBlobDownload(blob: Blob, filename: string) {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.setAttribute("download", filename);
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(url);
}

const withTenantHeader = (tenantId: string) => ({
	headers: {
		[TENANT_ID_HEADER]: tenantId,
	},
});

export const WALLET_V2_API = {
	BALANCE: async (tenantId: string): Promise<Wallet> =>
		await $http
			.get(WALLET_V2_ENDPOINTS.balance, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<Wallet>(res)),

	ALL_BALANCES: async (
		params?: WalletListQuery,
	): Promise<PaginatedWalletBalanceListResult> =>
		await $http
			.get(WALLET_V2_ENDPOINTS.balanceAll, { params })
			.then((res) => unwrapV2Paginated<Wallet>(res)),

	CREATE_CREDIT: async (
		tenantId: string,
		data: AdminManualCreditRequestPayload,
	): Promise<AdminManualCreditData> =>
		await $http
			.post(WALLET_V2_ENDPOINTS.credits, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<AdminManualCreditData>(res)),

	TENANT_FUNDING_REQUESTS: async (
		tenantId: string,
		params?: WalletListQuery,
	): Promise<PaginatedWalletFundingRequestListResult> =>
		await $http
			.get(WALLET_V2_ENDPOINTS.fundingRequests, {
				params,
				...withTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Paginated<WalletFundingRequest>(res)),

	ALL_FUNDING_REQUESTS: async (
		params?: WalletListQuery,
	): Promise<PaginatedWalletFundingRequestListResult> =>
		await $http
			.get(WALLET_V2_ENDPOINTS.fundingRequestsAll, { params })
			.then((res) => unwrapV2Paginated<WalletFundingRequest>(res)),

	TOP_UP_CREATE_SESSION: async (
		tenantId: string,
		data: TopUpRequestPayload,
	): Promise<TopUpSessionData> =>
		await $http
			.post(
				WALLET_V2_ENDPOINTS.topUpCreateSession,
				data,
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Data<TopUpSessionData>(res)),

	TOP_UP_VERIFY: async (
		tenantId: string,
		sessionId: string,
	): Promise<TopUpVerifyData> =>
		await $http
			.get(WALLET_V2_ENDPOINTS.topUpVerify, {
				params: { session_id: sessionId },
				...withTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Data<TopUpVerifyData>(res)),

	TENANT_TRANSACTIONS: async (
		tenantId: string,
		params?: WalletTransactionsQuery,
	): Promise<PaginatedWalletTransactionListResult> =>
		await $http
			.get(WALLET_V2_ENDPOINTS.transactions, {
				params,
				...withTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Paginated<WalletTransaction>(res)),

	ALL_TRANSACTIONS: async (
		params?: WalletTransactionsQuery,
	): Promise<PaginatedWalletTransactionListResult> =>
		await $http
			.get(WALLET_V2_ENDPOINTS.transactionsAll, { params })
			.then((res) => unwrapV2Paginated<WalletTransaction>(res)),

	TENANT_TRANSACTIONS_EXPORT: async (
		tenantId: string,
		params?: WalletTransactionsQuery,
	): Promise<void> => {
		const createdFrom = params?.created_from ?? "all";
		const createdTo = params?.created_to ?? "all";
		const blob = await $http
			.get(WALLET_V2_ENDPOINTS.transactionsExport, {
				params,
				...withTenantHeader(tenantId),
				responseType: "blob",
			})
			.then((res) => res.data as Blob);

		triggerBlobDownload(
			blob,
			`transactions-${createdFrom}-to-${createdTo}.csv`,
		);
	},
};
