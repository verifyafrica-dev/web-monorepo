import {
	DownloadSimpleIcon,
	EyeIcon,
	FileTextIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
	Invoice,
	PaymentStatus,
} from "#/api/http/v2/billing/billing.types";
import { useTenantInvoicesV2Query } from "#/api/http/v2/billing/billing.hooks";
import {
	paginateItems,
	TablePagination,
	TablePaginationSkeleton,
} from "#/components/table-pagination";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { useDebouncedValue } from "#/hooks/use-debounced-value";
import { createSkeletonKeys } from "#/lib/skeleton-keys";
import { InvoiceDetailsDialog } from "../../../invoices/-components/invoice-details-dialog";
import {
	downloadCsv,
	formatTenantDate,
	formatTenantMoney,
	getInvoiceTotalAmount,
	getPaymentStatusBadgeClass,
	matchesInvoiceSearch,
} from "../-data";

const PAGE_SIZE = 10;
const INVOICES_FETCH_SIZE = 100;

const INVOICE_TABLE_COLUMNS = [
	"Invoice #",
	"Date",
	"Due Date",
	"Amount",
	"Status",
	"Description",
	"Actions",
] as const;

const STATUS_FILTER_OPTIONS: Array<{
	value: "all" | PaymentStatus;
	label: string;
}> = [
	{ value: "all", label: "All Statuses" },
	{ value: "SUCCESS", label: "Paid" },
	{ value: "DUE", label: "Due" },
	{ value: "PENDING", label: "Pending" },
	{ value: "FAILED", label: "Failed" },
];

function getInvoiceTableHeadClassName(index: number, total: number) {
	if (index === 0) {
		return "pl-4 text-xs font-semibold tracking-wide uppercase sm:pl-6";
	}

	if (index === total - 1) {
		return "pr-4 text-right text-xs font-semibold tracking-wide uppercase sm:pr-6";
	}

	return "text-xs font-semibold tracking-wide uppercase";
}

export function InvoicesTab({ tenantId }: { tenantId: string }) {
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>(
		"all",
	);
	const [_isExporting, setIsExporting] = useState(false);
	const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const debouncedSearch = useDebouncedValue(searchQuery, 300);

	const invoicesQuery = useTenantInvoicesV2Query(tenantId, {
		page: 1,
		per_page: INVOICES_FETCH_SIZE,
	});

	useEffect(() => {
		setPage(1);
	}, []);

	const filteredInvoices = useMemo(() => {
		return (invoicesQuery.data?.items ?? []).filter((invoice) => {
			const matchesStatus =
				statusFilter === "all" ||
				(invoice.payment_status ?? "").toUpperCase() === statusFilter;

			return matchesStatus && matchesInvoiceSearch(invoice, debouncedSearch);
		});
	}, [debouncedSearch, invoicesQuery.data?.items, statusFilter]);

	const {
		items: paginatedInvoices,
		total,
		safePage,
	} = useMemo(
		() => paginateItems(filteredInvoices, page, PAGE_SIZE),
		[filteredInvoices, page],
	);

	const isLoading =
		invoicesQuery.isPending ||
		(invoicesQuery.isFetching && !invoicesQuery.data);
	const hasActiveFilters =
		debouncedSearch.trim().length > 0 || statusFilter !== "all";

	const _handleExport = () => {
		if (filteredInvoices.length === 0) {
			return;
		}

		setIsExporting(true);

		try {
			downloadCsv(
				`tenant_invoices_${tenantId}_${new Date().toISOString().split("T")[0]}.csv`,
				[
					[
						"Invoice #",
						"Date Created",
						"Due Date",
						"Amount",
						"Currency",
						"Status",
						"Description",
					],
					...filteredInvoices.map((invoice) => [
						invoice.invoice_id ?? invoice.id,
						formatTenantDate(invoice.created_at),
						invoice.due_at ? formatTenantDate(invoice.due_at) : "-",
						getInvoiceTotalAmount(invoice),
						invoice.currency ?? "USD",
						invoice.payment_status ?? "Unknown",
						invoice.description ?? "",
					]),
				],
			);
		} catch {
			toast.error("Failed to export invoices");
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Card>
			<CardHeader className="gap-4 border-b">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<CardTitle className="font-semibold">Invoices</CardTitle>
					{/* <Button
						variant="outline"
						disabled={isExporting || filteredInvoices.length === 0}
						onClick={handleExport}
					>
						<DownloadSimpleIcon />
						{isExporting ? "Exporting..." : "Export"}
					</Button> */}
				</div>
				<div className="flex flex-col gap-3 sm:flex-row">
					<div className="relative flex-1">
						<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Search invoices..."
							className="pl-9"
							disabled={isLoading}
						/>
					</div>
					<Select
						value={statusFilter}
						onValueChange={(value) =>
							setStatusFilter(value as "all" | PaymentStatus)
						}
						disabled={isLoading}
					>
						<SelectTrigger className="w-full sm:w-[180px]">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							{STATUS_FILTER_OPTIONS.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent className="gap-0 p-0">
				{isLoading ? (
					<div className="p-4">
						<InvoicesTableSkeleton />
						<TablePaginationSkeleton />
					</div>
				) : invoicesQuery.isError ? (
					<div className="flex min-h-48 items-center justify-center px-6 text-sm text-muted-foreground">
						Failed to load invoices. Please try again.
					</div>
				) : filteredInvoices.length === 0 ? (
					<div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
						<FileTextIcon className="size-10 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							{hasActiveFilters
								? "No invoices match your search or filters"
								: "No invoices found for this tenant"}
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										{INVOICE_TABLE_COLUMNS.map((column, index) => (
											<TableHead
												key={column}
												className={getInvoiceTableHeadClassName(
													index,
													INVOICE_TABLE_COLUMNS.length,
												)}
											>
												{column}
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedInvoices.map((invoice) => (
										<InvoiceRow
											key={invoice.id}
											invoice={invoice}
											onViewDetails={() => {
												setSelectedInvoice(invoice);
												setDetailsOpen(true);
											}}
										/>
									))}
								</TableBody>
							</Table>
						</div>
						<TablePagination
							page={safePage}
							pageSize={PAGE_SIZE}
							total={total}
							onPageChange={setPage}
						/>
					</>
				)}
			</CardContent>
			<InvoiceDetailsDialog
				open={detailsOpen}
				invoice={selectedInvoice}
				onOpenChange={(open) => {
					setDetailsOpen(open);
					if (!open) {
						setSelectedInvoice(null);
					}
				}}
			/>
		</Card>
	);
}

function InvoiceRow({
	invoice,
	onViewDetails,
}: {
	invoice: Invoice;
	onViewDetails: () => void;
}) {
	const invoiceLabel = invoice.invoice_id ?? invoice.id;

	return (
		<TableRow>
			<TableCell className="pl-4 sm:pl-6">
				<div className="flex items-center gap-2 font-medium">
					<FileTextIcon className="size-4 text-muted-foreground" />
					{invoiceLabel}
				</div>
			</TableCell>
			<TableCell>{formatTenantDate(invoice.created_at)}</TableCell>
			<TableCell>
				{invoice.due_at ? formatTenantDate(invoice.due_at) : "-"}
			</TableCell>
			<TableCell className="font-medium">
				{formatTenantMoney(
					getInvoiceTotalAmount(invoice),
					invoice.currency ?? "USD",
				)}
			</TableCell>
			<TableCell>
				<Badge
					variant="outline"
					className={getPaymentStatusBadgeClass(invoice.payment_status)}
				>
					{invoice.payment_status ?? "Unknown"}
				</Badge>
			</TableCell>
			<TableCell
				className="max-w-xs truncate"
				title={invoice.description}
			>
				{invoice.description}
			</TableCell>
			<TableCell className="pr-4 text-right sm:pr-6">
				<div className="flex justify-end gap-1">
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={onViewDetails}
					>
						<EyeIcon className="size-4" />
						<span className="sr-only">View invoice</span>
					</Button>
					{invoice.file_attachment ? (
						<Button
							variant="ghost"
							size="icon-sm"
							asChild
						>
							<a
								href={invoice.file_attachment}
								download={`invoice_${invoiceLabel}.pdf`}
							>
								<DownloadSimpleIcon className="size-4" />
								<span className="sr-only">Download invoice</span>
							</a>
						</Button>
					) : null}
				</div>
			</TableCell>
		</TableRow>
	);
}

function InvoicesTableSkeleton() {
	return (
		<div className="space-y-3">
			{createSkeletonKeys(5, "tenant-invoice-row").map((key) => (
				<div
					key={key}
					className="flex items-center gap-4 px-2"
				>
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-4 flex-1" />
					<Skeleton className="size-8" />
				</div>
			))}
		</div>
	);
}
