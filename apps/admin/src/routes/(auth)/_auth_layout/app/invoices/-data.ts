import type { Invoice } from "#/api/http/v2/billing/billing.types";
import { downloadCsv } from "../tenants/$tenantId/-data";
import {
	formatTenantMoney,
	getInvoiceTotalAmount,
	getPaymentStatusBadgeClass,
} from "../tenants/$tenantId/-data";

export { getPaymentStatusBadgeClass };

const invoiceShortDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
});

const invoiceLongDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "long",
	day: "numeric",
	year: "numeric",
});

const invoicePeriodFormatter = new Intl.DateTimeFormat("en-US", {
	month: "long",
	year: "numeric",
});

export function formatInvoiceDate(value?: string | null) {
	if (!value) {
		return "-";
	}

	return invoiceShortDateFormatter.format(new Date(value));
}

export function formatInvoiceLongDate(value?: string | null) {
	if (!value) {
		return "-";
	}

	return invoiceLongDateFormatter.format(new Date(value));
}

export function getInvoiceLabel(invoice: Invoice) {
	return invoice.invoice_id ?? invoice.id;
}

export function getInvoiceFilename(invoice: Invoice) {
	return getInvoiceLabel(invoice);
}

export function downloadInvoice(invoice: Invoice) {
	if (!invoice.file_attachment) {
		return false;
	}

	const link = document.createElement("a");
	link.href = invoice.file_attachment;
	link.download = `invoice_${getInvoiceFilename(invoice)}.pdf`;
	link.target = "_blank";
	link.rel = "noopener noreferrer";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	return true;
}

export function getInvoicePeriod(invoice: Invoice) {
	return invoicePeriodFormatter.format(new Date(invoice.created_at));
}

export function getInvoicePaidDate(invoice: Invoice) {
	const paidAmount = Number.parseFloat(invoice.paid_amount ?? "0");
	if (paidAmount > 0) {
		return invoice.updated_at;
	}

	return null;
}

export function getInvoiceBalanceDue(invoice: Invoice) {
	const total = Number.parseFloat(getInvoiceTotalAmount(invoice));
	const paid = Number.parseFloat(invoice.paid_amount ?? "0");

	return Math.max(total - (Number.isFinite(paid) ? paid : 0), 0);
}

export function getPaymentStatusLabel(status?: string | null) {
	switch ((status ?? "").toUpperCase()) {
		case "SUCCESS":
			return "Paid";
		case "PENDING":
			return "Pending";
		case "DUE":
			return "Due";
		case "FAILED":
			return "Failed";
		default:
			return status ?? "Unknown";
	}
}

export function matchesAdminInvoiceSearch(invoice: Invoice, query: string) {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return true;
	}

	return [
		invoice.id,
		invoice.invoice_id,
		invoice.tenant,
		invoice.tenant_name,
		invoice.tenant_slug,
		invoice.description,
		getInvoiceTotalAmount(invoice),
	]
		.filter(Boolean)
		.some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

export function matchesInvoiceDateRange(
	invoice: Invoice,
	dateFrom: string,
	dateTo: string,
) {
	const createdAt = new Date(invoice.created_at);

	if (dateFrom) {
		const from = new Date(`${dateFrom}T00:00:00`);
		if (createdAt < from) {
			return false;
		}
	}

	if (dateTo) {
		const to = new Date(`${dateTo}T23:59:59.999`);
		if (createdAt > to) {
			return false;
		}
	}

	return true;
}

export function hasActiveInvoiceFilters(filters: {
	search: string;
	dateFrom: string;
	dateTo: string;
}) {
	return (
		filters.search.trim().length > 0 ||
		Boolean(filters.dateFrom) ||
		Boolean(filters.dateTo)
	);
}

export function exportInvoicesCsv(invoices: Invoice[]) {
	downloadCsv(`invoices_export_${new Date().toISOString().split("T")[0]}.csv`, [
		[
			"Invoice ID",
			"Tenant",
			"Tenant ID",
			"Description",
			"Amount",
			"Currency",
			"Period",
			"Due Date",
			"Paid Date",
			"Status",
		],
		...invoices.map((invoice) => [
			getInvoiceLabel(invoice),
			invoice.tenant_name ?? "Unknown",
			invoice.tenant_slug ?? invoice.tenant,
			invoice.description ?? "",
			formatTenantMoney(
				getInvoiceTotalAmount(invoice),
				invoice.currency ?? "USD",
			),
			invoice.currency ?? "USD",
			getInvoicePeriod(invoice),
			formatInvoiceDate(invoice.due_at),
			formatInvoiceDate(getInvoicePaidDate(invoice)),
			getPaymentStatusLabel(invoice.payment_status),
		]),
	]);
}
