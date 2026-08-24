import type { WalletTransaction } from "#/api/http/v2/wallet/wallet.types";
import type { WalletTransactionsQuery } from "#/api/http/v2/wallet/wallet.types";
import { formatTenantDate } from "../tenants/-data";
import { formatTenantMoney } from "../tenants/$tenantId/-data";
import { downloadCsv } from "../tenants/$tenantId/-data";

export const CREDIT_TOPUP_QUERY = {
	type: "CREDIT",
	exclude_source: "admin_manual_credit",
} as const;

export const PAYMENT_METHOD_FILTER = {
	ALL: "all",
	STRIPE: "stripe",
	WALLET: "wallet",
} as const;

export type PaymentMethodFilter =
	(typeof PAYMENT_METHOD_FILTER)[keyof typeof PAYMENT_METHOD_FILTER];

export const DEFAULT_PAYMENT_METHOD_FILTER: PaymentMethodFilter =
	PAYMENT_METHOD_FILTER.ALL;

export const PAYMENT_METHOD_FILTER_OPTIONS = [
	{ value: PAYMENT_METHOD_FILTER.ALL, label: "All Payment Methods" },
	{ value: PAYMENT_METHOD_FILTER.STRIPE, label: "Stripe" },
	{ value: PAYMENT_METHOD_FILTER.WALLET, label: "Wallet" },
] as const;

export const TOP_UP_STATUS_FILTER = {
	ALL: "all",
	COMPLETED: "completed",
	PENDING: "pending",
	FAILED: "failed",
} as const;

export type TopUpStatusFilter =
	(typeof TOP_UP_STATUS_FILTER)[keyof typeof TOP_UP_STATUS_FILTER];

export const DEFAULT_TOP_UP_STATUS_FILTER: TopUpStatusFilter =
	TOP_UP_STATUS_FILTER.ALL;

export const TOP_UP_STATUS_FILTER_OPTIONS = [
	{ value: TOP_UP_STATUS_FILTER.ALL, label: "All Statuses" },
	{ value: TOP_UP_STATUS_FILTER.COMPLETED, label: "Completed" },
	{ value: TOP_UP_STATUS_FILTER.PENDING, label: "Pending" },
	{ value: TOP_UP_STATUS_FILTER.FAILED, label: "Failed" },
] as const;

export const AMOUNT_PAID_FILTER = {
	ALL: "all",
	UNDER_100: "under_100",
	FROM_100_TO_500: "100_500",
	OVER_500: "over_500",
} as const;

export type AmountPaidFilter =
	(typeof AMOUNT_PAID_FILTER)[keyof typeof AMOUNT_PAID_FILTER];

export const DEFAULT_AMOUNT_PAID_FILTER: AmountPaidFilter =
	AMOUNT_PAID_FILTER.ALL;

export const AMOUNT_PAID_FILTER_OPTIONS = [
	{ value: AMOUNT_PAID_FILTER.ALL, label: "All Amounts" },
	{ value: AMOUNT_PAID_FILTER.UNDER_100, label: "Under $100" },
	{ value: AMOUNT_PAID_FILTER.FROM_100_TO_500, label: "$100 – $500" },
	{ value: AMOUNT_PAID_FILTER.OVER_500, label: "Over $500" },
] as const;

const AMOUNT_PAID_FILTER_QUERY: Record<
	Exclude<AmountPaidFilter, typeof AMOUNT_PAID_FILTER.ALL>,
	Pick<WalletTransactionsQuery, "amount_min" | "amount_max">
> = {
	[AMOUNT_PAID_FILTER.UNDER_100]: { amount_max: "100" },
	[AMOUNT_PAID_FILTER.FROM_100_TO_500]: {
		amount_min: "100",
		amount_max: "500",
	},
	[AMOUNT_PAID_FILTER.OVER_500]: { amount_min: "500" },
};

export type TopUpListFilters = {
	page: number;
	perPage: number;
	search: string;
	paymentMethod: PaymentMethodFilter;
	status: TopUpStatusFilter;
	amountPaid: AmountPaidFilter;
	dateFrom: string;
	dateTo: string;
};

export function buildTopUpListQuery({
	page,
	perPage,
	search,
	paymentMethod,
	status,
	amountPaid,
	dateFrom,
	dateTo,
}: TopUpListFilters): WalletTransactionsQuery {
	return {
		page,
		per_page: perPage,
		...CREDIT_TOPUP_QUERY,
		...(search.trim() ? { search: search.trim() } : {}),
		...(paymentMethod !== DEFAULT_PAYMENT_METHOD_FILTER
			? { payment_method: paymentMethod }
			: {}),
		...(status !== DEFAULT_TOP_UP_STATUS_FILTER ? { status } : {}),
		...(amountPaid !== DEFAULT_AMOUNT_PAID_FILTER
			? AMOUNT_PAID_FILTER_QUERY[amountPaid]
			: {}),
		...(dateFrom ? { created_from: dateFrom } : {}),
		...(dateTo ? { created_to: dateTo } : {}),
	};
}

export function hasActiveTopUpFilters(filters: {
	search: string;
	paymentMethod: PaymentMethodFilter;
	status: TopUpStatusFilter;
	amountPaid: AmountPaidFilter;
	dateFrom: string;
	dateTo: string;
}) {
	return (
		filters.search.trim().length > 0 ||
		filters.paymentMethod !== DEFAULT_PAYMENT_METHOD_FILTER ||
		filters.status !== DEFAULT_TOP_UP_STATUS_FILTER ||
		filters.amountPaid !== DEFAULT_AMOUNT_PAID_FILTER ||
		Boolean(filters.dateFrom) ||
		Boolean(filters.dateTo)
	);
}

export function getTopUpStatusLabel() {
	return "Completed";
}

export function getTopUpStatusBadgeClass() {
	return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function parseTransactionMetadata(
	metadata: WalletTransaction["metadata"],
): Record<string, unknown> | null {
	if (!metadata || typeof metadata !== "object") {
		return null;
	}

	return metadata;
}

export function getTopUpTenantName(transaction: WalletTransaction) {
	if (transaction.tenant_name) {
		return transaction.tenant_name;
	}

	const metadata = parseTransactionMetadata(transaction.metadata);
	const tenantName = metadata?.tenant_name;

	if (typeof tenantName === "string" && tenantName.trim()) {
		return tenantName;
	}

	return "Unknown Tenant";
}

export function getTopUpPaymentMethod(transaction: WalletTransaction) {
	const metadata = parseTransactionMetadata(transaction.metadata);

	if (metadata?.source === "admin_manual_credit") {
		return "Manual Admin Credit";
	}

	if (
		metadata?.payment_method === "stripe" ||
		metadata?.source === "stripe_top_up" ||
		transaction.reason === "Top Up"
	) {
		return "Stripe";
	}

	return "Wallet";
}

export function formatTopUpId(transaction: WalletTransaction) {
	return `#${transaction.id.slice(0, 8)}`;
}

export function exportTopUpsCsv(transactions: WalletTransaction[]) {
	downloadCsv(`credit_topups_export_${new Date().toISOString().split("T")[0]}.csv`, [
		[
			"Top-up ID",
			"Tenant",
			"Amount Paid",
			"Payment Method",
			"Reference",
			"Status",
			"Date",
		],
		...transactions.map((transaction) => [
			formatTopUpId(transaction),
			getTopUpTenantName(transaction),
			formatTenantMoney(transaction.amount),
			getTopUpPaymentMethod(transaction),
			transaction.reference,
			getTopUpStatusLabel(),
			formatTenantDate(transaction.created_at),
		]),
	]);
}
