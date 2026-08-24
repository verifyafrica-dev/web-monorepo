import {
	ArrowClockwiseIcon,
	DownloadSimpleIcon,
	EyeIcon,
	FileTextIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAllInvoicesV2Query } from "#/api/http/v2/billing/billing.hooks";
import type { Invoice } from "#/api/http/v2/billing/billing.types";
import {
	paginateItems,
	TablePagination,
	TablePaginationSkeleton,
} from "#/components/table-pagination";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@verifyafrica/ui/components/ui/tooltip";
import { useDebouncedValue } from "#/hooks/use-debounced-value";
import { cn } from "#/lib/utils";
import { createSkeletonKeys } from "#/lib/skeleton-keys";
import {
	formatTenantMoney,
	getInvoiceTotalAmount,
} from "../tenants/$tenantId/-data";
import { DateFilterPicker } from "#/components/date-filter-picker";
import { InvoiceDetailsDialog } from "./-components/invoice-details-dialog";
import {
	downloadInvoice,
	exportInvoicesCsv,
	formatInvoiceDate,
	getInvoiceLabel,
	getInvoicePaidDate,
	getInvoicePeriod,
	getPaymentStatusBadgeClass,
	getPaymentStatusLabel,
	hasActiveInvoiceFilters,
	matchesAdminInvoiceSearch,
	matchesInvoiceDateRange,
} from "./-data";

const PAGE_SIZE = 10;
const INVOICES_FETCH_SIZE = 500;

const INVOICE_TABLE_COLUMNS = [
	"Invoice ID",
	"Tenant",
	"Description",
	"Amount",
	"Period",
	"Due Date",
	"Paid Date",
	"Status",
	"Actions",
] as const;

export const Route = createFileRoute("/(auth)/_auth_layout/app/invoices/")({
	head: () => ({
		meta: [
			{ title: "Invoices | VerifyAfrica" },
			{
				name: "description",
				content: "Review invoices, billing records, and payment history.",
			},
		],
	}),
	component: InvoicesPage,
});

function getInvoiceTableHeadClassName(index: number, total: number) {
	if (index === 0) {
		return "pl-4 text-xs font-semibold tracking-wide uppercase sm:pl-6";
	}

	if (index === total - 1) {
		return "pr-4 text-right text-xs font-semibold tracking-wide uppercase sm:pr-6";
	}

	return "text-xs font-semibold tracking-wide uppercase";
}

function InvoicesPage() {
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const debouncedSearch = useDebouncedValue(searchQuery, 300);

	const invoicesQuery = useAllInvoicesV2Query({
		page: 1,
		per_page: INVOICES_FETCH_SIZE,
	});

	useEffect(() => {
		setPage(1);
	}, []);

	const filteredInvoices = useMemo(() => {
		return (invoicesQuery.data?.items ?? []).filter((invoice) => {
			return (
				matchesAdminInvoiceSearch(invoice, debouncedSearch) &&
				matchesInvoiceDateRange(invoice, dateFrom, dateTo)
			);
		});
	}, [debouncedSearch, dateFrom, dateTo, invoicesQuery.data?.items]);

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
	const isRefreshing = invoicesQuery.isFetching;
	const hasActiveFilters = hasActiveInvoiceFilters({
		search: debouncedSearch,
		dateFrom,
		dateTo,
	});

	const handleRefresh = () => {
		void invoicesQuery.refetch();
	};

	const _handleExport = () => {
		if (filteredInvoices.length === 0) {
			return;
		}

		try {
			exportInvoicesCsv(filteredInvoices);
		} catch {
			toast.error("Failed to export invoices");
		}
	};

	const openInvoiceDetails = (invoice: Invoice) => {
		setSelectedInvoice(invoice);
		setDetailsOpen(true);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
					<p className="text-sm text-muted-foreground">
						Manage subscription invoices and billing records across all tenants.
					</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					{/* <Button
						variant="outline"
						onClick={handleExport}
						disabled={isLoading || filteredInvoices.length === 0}
					>
						<DownloadSimpleIcon />
						Export
					</Button> */}
					<Button
						variant="outline"
						onClick={handleRefresh}
						disabled={isRefreshing}
					>
						<ArrowClockwiseIcon
							className={isRefreshing ? "animate-spin" : undefined}
							weight="bold"
						/>
						Refresh
					</Button>
				</div>
			</div>

			<Card className="gap-0 py-0">
				<div className="border-b p-4 sm:p-6">
					<div className="relative">
						<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Search by invoice ID, tenant, description, or amount..."
							className="pl-9"
							disabled={isLoading}
						/>
					</div>
				</div>

				<div className="grid gap-3 border-b p-4 sm:grid-cols-2 sm:px-6">
					<DateFilterPicker
						id="invoices-date-from"
						label="Start Date"
						value={dateFrom}
						onChange={setDateFrom}
						disabled={isLoading}
						max={dateTo || undefined}
						placeholder="Start date"
					/>
					<DateFilterPicker
						id="invoices-date-to"
						label="End Date"
						value={dateTo}
						onChange={setDateTo}
						disabled={isLoading}
						min={dateFrom || undefined}
						placeholder="End date"
					/>
				</div>

				{hasActiveFilters ? (
					<div className="border-b px-4 py-3 sm:px-6">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setSearchQuery("");
								setDateFrom("");
								setDateTo("");
							}}
						>
							Clear Filters
						</Button>
					</div>
				) : null}

				<CardContent className="gap-0 p-0">
					{isLoading ? (
						<div className="p-4">
							<InvoicesTableSkeleton />
							<TablePaginationSkeleton />
						</div>
					) : invoicesQuery.isError ? (
						<div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
							<p className="text-sm text-muted-foreground">
								Failed to load invoices. Please try again.
							</p>
							<Button onClick={handleRefresh}>Try Again</Button>
						</div>
					) : filteredInvoices.length === 0 ? (
						<div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
							<FileTextIcon className="size-10 text-muted-foreground" />
							<p className="text-sm text-muted-foreground">
								{hasActiveFilters
									? "No invoices match your search or filters"
									: "No invoices available"}
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
												onViewDetails={() => openInvoiceDetails(invoice)}
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
			</Card>

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
		</div>
	);
}

function InvoiceRow({
	invoice,
	onViewDetails,
}: {
	invoice: Invoice;
	onViewDetails: () => void;
}) {
	const paidDate = getInvoicePaidDate(invoice);
	const currency = invoice.currency ?? "USD";

	return (
		<TableRow>
			<TableCell className="pl-4 font-medium sm:pl-6">
				{getInvoiceLabel(invoice)}
			</TableCell>
			<TableCell>
				<div className="capitalize">{invoice.tenant_name ?? "N/A"}</div>
				{invoice.tenant_slug ? (
					<div className="text-xs text-muted-foreground">
						{invoice.tenant_slug}
					</div>
				) : null}
			</TableCell>
			<TableCell
				className="max-w-xs truncate"
				title={invoice.description}
			>
				{invoice.description || "-"}
			</TableCell>
			<TableCell className="font-semibold">
				{formatTenantMoney(getInvoiceTotalAmount(invoice), currency)}
			</TableCell>
			<TableCell>{getInvoicePeriod(invoice)}</TableCell>
			<TableCell>{formatInvoiceDate(invoice.due_at)}</TableCell>
			<TableCell
				className={cn(paidDate ? "text-emerald-600" : "text-muted-foreground")}
			>
				{formatInvoiceDate(paidDate)}
			</TableCell>
			<TableCell>
				<Badge
					variant="outline"
					className={getPaymentStatusBadgeClass(invoice.payment_status)}
				>
					{getPaymentStatusLabel(invoice.payment_status)}
				</Badge>
			</TableCell>
			<TableCell className="pr-4 text-right sm:pr-6">
				<div className="flex items-center justify-end gap-1">
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="inline-flex">
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={onViewDetails}
								>
									<EyeIcon className="size-4" />
									<span className="sr-only">View invoice</span>
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent side="top">View invoice</TooltipContent>
					</Tooltip>
					{invoice.file_attachment ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="inline-flex">
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => {
											if (!downloadInvoice(invoice)) {
												toast.error("Unable to download invoice");
											}
										}}
									>
										<DownloadSimpleIcon className="size-4" />
										<span className="sr-only">Download invoice</span>
									</Button>
								</span>
							</TooltipTrigger>
							<TooltipContent side="top">Download invoice</TooltipContent>
						</Tooltip>
					) : null}
				</div>
			</TableCell>
		</TableRow>
	);
}

function InvoicesTableSkeleton() {
	return (
		<div className="space-y-3">
			{createSkeletonKeys(5, "invoice-row").map((key) => (
				<div
					key={key}
					className="flex items-center gap-4 px-2"
				>
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-6 w-20" />
					<Skeleton className="size-8" />
				</div>
			))}
		</div>
	);
}
