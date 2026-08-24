import { subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { AxiosError } from "axios";

import type {
	BillingInformation,
	BillingInformationCreatePayload,
	BillingInformationUpdatePayload,
	InvoiceListItem,
} from "#/api/http/v2/billing/billing.types";
import type { WalletTransaction } from "#/api/http/v2/wallet/wallet.types";
import { normalizeCountryCode } from "#/lib/country-state-city";
import { pickChangedFields } from "#/lib/pick-changed-fields";

export type BillingFormState = {
	billing_name: string;
	billing_email: string;
	billing_address: string;
	billing_city: string;
	billing_state: string;
	billing_postal_code: string;
	billing_country: string;
};

export const EMPTY_BILLING_FORM: BillingFormState = {
	billing_name: "",
	billing_email: "",
	billing_address: "",
	billing_city: "",
	billing_state: "",
	billing_postal_code: "",
	billing_country: "",
};

export function getBillingFormState(
	billingInfo?: BillingInformation,
): BillingFormState {
	if (!billingInfo) {
		return EMPTY_BILLING_FORM;
	}

	return {
		billing_name: billingInfo.billing_name ?? "",
		billing_email: billingInfo.billing_email ?? "",
		billing_address: billingInfo.billing_address ?? "",
		billing_city: billingInfo.billing_city ?? "",
		billing_state: billingInfo.billing_state ?? "",
		billing_postal_code: billingInfo.billing_postal_code ?? "",
		billing_country: normalizeCountryCode(billingInfo.billing_country),
	};
}

export function getBillingFormUpdateValues(form: BillingFormState) {
	const { billing_email: _billingEmail, ...updateValues } = form;
	return updateValues;
}

export function getBillingInformationUpdatePayload(
	original: BillingFormState,
	form: BillingFormState,
): BillingInformationUpdatePayload {
	return pickChangedFields(
		getBillingFormUpdateValues(original),
		getBillingFormUpdateValues(form),
	);
}

export function getBillingInformationCreatePayload(
	form: BillingFormState,
	tenantId: string,
): BillingInformationCreatePayload {
	return {
		tenant: tenantId,
		billing_plan: "payg",
		...form,
	};
}

export function isBillingNotFoundError(error: unknown) {
	return (error as AxiosError | null)?.response?.status === 404;
}

export type TransactionType = "debit" | "credit";

export type Transaction = {
	id: string;
	reference: string;
	date: string;
	dateTime: string;
	description: string;
	amount: number;
	type: TransactionType;
	balanceBefore: number;
	balanceAfter: number;
	transactionId: string;
	currency: string;
	meta: Record<string, unknown>;
};

export type ExportDurationPreset =
	| "custom"
	| "7d"
	| "14d"
	| "30d"
	| "90d"
	| "alltime";

export const EXPORT_DURATION_OPTIONS: {
	value: ExportDurationPreset;
	label: string;
}[] = [
	{ value: "custom", label: "Custom" },
	{ value: "7d", label: "Last 7 days" },
	{ value: "14d", label: "Last 14 days" },
	{ value: "30d", label: "Last 30 days" },
	{ value: "90d", label: "Last 90 days" },
	{ value: "alltime", label: "All time" },
];

export const TRANSACTIONS_PAGE_SIZE = 10;
export const INVOICES_PAGE_SIZE = 10;

const moneyFormatter = new Intl.NumberFormat("en-US", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "numeric",
	day: "numeric",
	year: "numeric",
});

const longDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	month: "long",
	day: "numeric",
	year: "numeric",
	hour: "numeric",
	minute: "2-digit",
});

const invoiceDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
});

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

const EXPORT_DURATION_DAYS: Record<
	Exclude<ExportDurationPreset, "custom" | "alltime">,
	number
> = {
	"7d": 7,
	"14d": 14,
	"30d": 30,
	"90d": 90,
};

export function parseValidDate(
	value: string | number | Date | null | undefined,
	fallback = new Date(),
): Date {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? fallback : value;
	}

	if (value == null || value === "") {
		return fallback;
	}

	const date = new Date(value);

	return Number.isNaN(date.getTime()) ? fallback : date;
}

function formatDateValue(
	formatter: Intl.DateTimeFormat,
	value: string | number | Date | null | undefined,
	fallback = "—",
) {
	if (value == null || value === "") {
		return fallback;
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return fallback;
	}

	return formatter.format(date);
}

function getCurrencyFormatter(currency: string) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function startOfDay(date: Date) {
	const normalized = parseValidDate(date);
	normalized.setHours(0, 0, 0, 0);
	return normalized;
}

export function formatMoney(amount: number) {
	return moneyFormatter.format(amount);
}

export function formatSignedAmount(amount: number, currency = "USD") {
	const formatted = getCurrencyFormatter(currency).format(Math.abs(amount));
	return formatted;
}

export function formatIsoDate(date: Date) {
	return isoDateFormatter.format(parseValidDate(date));
}

export function formatBillingDisplayAddress(
	billingInfo: BillingInformation | undefined,
) {
	if (!billingInfo) {
		return "No billing address on file";
	}

	const parts = [
		billingInfo.billing_address,
		billingInfo.billing_city,
		billingInfo.billing_state,
		billingInfo.billing_postal_code,
		billingInfo.billing_country,
	].filter(Boolean);

	return parts.length > 0 ? parts.join(", ") : "No billing address on file";
}

export function mapWalletTransaction(
	transaction: WalletTransaction,
	currency = "USD",
): Transaction {
	const isDebit = transaction.type.toUpperCase() === "DEBIT";
	const amount = Number.parseFloat(transaction.amount);
	const signedAmount = isDebit ? -Math.abs(amount) : Math.abs(amount);
	const createdAt = parseValidDate(transaction.created_at);

	const {
		id,
		reference,
		reason,
		balance_before,
		balance_after,
		type: _type,
		metadata: _metadata,
		..._rest
	} = transaction;

	return {
		id,
		reference,
		date: shortDateFormatter.format(createdAt),
		dateTime: longDateTimeFormatter.format(createdAt),
		description: reason,
		amount: signedAmount,
		type: isDebit ? "debit" : "credit",
		balanceBefore: Number.parseFloat(balance_before),
		balanceAfter: Number.parseFloat(balance_after),
		transactionId: id,
		currency,
		meta: transaction.metadata ?? {},
	};
}

export function formatInvoiceDate(value: string | null | undefined) {
	return formatDateValue(invoiceDateFormatter, value);
}

export function formatInvoiceAmount(
	amount: string | undefined,
	currency = "USD",
) {
	if (!amount) {
		return "—";
	}

	return getCurrencyFormatter(currency).format(Number.parseFloat(amount));
}

export function getDefaultExportDateRange(
	_accountCreatedAt: Date,
	today = new Date(),
): DateRange {
	return {
		from: startOfDay(subDays(today, 7)),
		to: startOfDay(today),
	};
}

export function getExportDateRangeForPreset(
	preset: ExportDurationPreset,
	accountCreatedAt: Date,
	today = new Date(),
): DateRange {
	const endDate = startOfDay(today);

	if (preset === "alltime") {
		return {
			from: startOfDay(accountCreatedAt),
			to: endDate,
		};
	}

	if (preset === "custom") {
		return getDefaultExportDateRange(accountCreatedAt, today);
	}

	return {
		from: startOfDay(subDays(today, EXPORT_DURATION_DAYS[preset])),
		to: endDate,
	};
}

export function getExportQueryDates(range: DateRange | undefined) {
	if (!range?.from || !range?.to) {
		return undefined;
	}

	return {
		from_date: formatIsoDate(range.from),
		to_date: formatIsoDate(range.to),
	};
}

export function filterTransactionsByDateRange(
	transactions: WalletTransaction[],
	fromDate: string,
	toDate: string,
) {
	const from = startOfDay(parseValidDate(fromDate));
	const to = startOfDay(parseValidDate(toDate));
	to.setHours(23, 59, 59, 999);

	return transactions.filter((transaction) => {
		const createdAt = parseValidDate(transaction.created_at);
		return createdAt >= from && createdAt <= to;
	});
}

function escapeCsvValue(value: string) {
	if (/[",\n]/.test(value)) {
		return `"${value.replaceAll('"', '""')}"`;
	}

	return value;
}

export function downloadTransactionsCsv(
	transactions: WalletTransaction[],
	filename: string,
	currency = "USD",
) {
	const headers = [
		"Reference",
		"Date",
		"Description",
		"Amount",
		"Type",
		"Balance Before",
		"Balance After",
	];

	const rows = transactions.map((transaction) => {
		const mapped = mapWalletTransaction(transaction, currency);

		return [
			mapped.reference,
			mapped.dateTime,
			mapped.description,
			mapped.amount.toFixed(2),
			mapped.type,
			mapped.balanceBefore.toFixed(2),
			mapped.balanceAfter.toFixed(2),
		];
	});

	const csv = [headers, ...rows]
		.map((row) => row.map((value) => escapeCsvValue(String(value))).join(","))
		.join("\n");

	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

export function getInvoiceFilename(invoice: InvoiceListItem) {
	return invoice.invoice_id ?? invoice.id;
}

export function getInvoicePaymentStatusBadgeClassName(status?: string | null) {
	const normalized = (status ?? "unknown").toLowerCase();

	if (normalized === "success" || normalized === "completed") {
		return "border-transparent bg-emerald-600 text-white";
	}

	if (normalized === "failed" || normalized === "error") {
		return "border-transparent bg-red-600 text-white";
	}

	if (normalized === "pending") {
		return "border-transparent bg-amber-100 text-amber-800";
	}

	if (normalized === "due") {
		return "border-transparent bg-sky-100 text-sky-800";
	}

	return "border-transparent bg-muted text-muted-foreground";
}

export const TOP_UP_DEFAULT_MIN_AMOUNT = 1;
export const TOP_UP_EXCLUDED_USER_MIN_AMOUNT = 30;
export const TOP_UP_MAX_AMOUNT = 50_000;

export const TOP_UP_EXCLUDED_USER_EMAILS = [
	"info@cjsolutionsltd.com",
	"kenovienadu@gmail.com",
] as const;

export const TOP_UP_SUGGESTED_AMOUNTS = {
	default: [500, 1000, 2500, 5000, 10_000],
	excluded: [50, 100, 250, 500, 1000],
} as const;

export function isTopUpExcludedUser(email?: string | null) {
	return TOP_UP_EXCLUDED_USER_EMAILS.includes(
		email as (typeof TOP_UP_EXCLUDED_USER_EMAILS)[number],
	);
}

export function getTopUpMinAmount(email?: string | null) {
	return isTopUpExcludedUser(email)
		? TOP_UP_EXCLUDED_USER_MIN_AMOUNT
		: TOP_UP_DEFAULT_MIN_AMOUNT;
}

export function getTopUpSuggestedAmounts(email?: string | null) {
	return isTopUpExcludedUser(email)
		? TOP_UP_SUGGESTED_AMOUNTS.excluded
		: TOP_UP_SUGGESTED_AMOUNTS.default;
}

export function formatTopUpAmountLabel(amount: number) {
	return `$${amount.toLocaleString()}`;
}
