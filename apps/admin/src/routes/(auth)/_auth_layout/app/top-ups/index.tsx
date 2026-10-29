import {
	ArrowClockwiseIcon,
	CreditCardIcon,
	DotsThreeVerticalIcon,
	DownloadSimpleIcon,
	FunnelIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { WALLET_V2_API } from "#/api/http/v2/wallet/wallet.api";
import { useAllTransactionsV2Query } from "#/api/http/v2/wallet/wallet.hooks";
import type { WalletTransaction } from "@verifyafrica/api-client/http/v2/wallet/wallet.types";
import {
	TablePagination,
	TablePaginationSkeleton,
} from "@verifyafrica/ui/components/ui-extended/table-pagination";
import { DateFilterPicker } from "@verifyafrica/ui/components/ui-extended/date-filter-picker";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@verifyafrica/ui/components/ui/dropdown-menu";
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
import { useDebouncedValue } from "@verifyafrica/ui/hooks/use-debounced-value";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { formatTenantDate } from "../tenants/-data";
import { formatTenantMoney } from "../tenants/$tenantId/-data";
import { TopUpDetailsDialog } from "./-components/top-up-details-dialog";
import {
	AMOUNT_PAID_FILTER_OPTIONS,
	buildTopUpListQuery,
	DEFAULT_AMOUNT_PAID_FILTER,
	DEFAULT_PAYMENT_METHOD_FILTER,
	DEFAULT_TOP_UP_STATUS_FILTER,
	exportTopUpsCsv,
	formatTopUpId,
	getTopUpPaymentMethod,
	getTopUpStatusBadgeClass,
	getTopUpStatusLabel,
	getTopUpTenantName,
	hasActiveTopUpFilters,
	mergeTopUpsSearchParams,
	PAYMENT_METHOD_FILTER_OPTIONS,
	type AmountPaidFilter,
	type PaymentMethodFilter,
	TOP_UP_STATUS_FILTER_OPTIONS,
	type TopUpStatusFilter,
	type TopUpsSearchParams,
	topUpsSearchSchema,
} from "./-data";

const PAGE_SIZE = 10;

const TOP_UP_TABLE_COLUMNS = [
	"Top-up ID",
	"Tenant",
	"Amount Paid",
	"Payment Method",
	"Reference",
	"Status",
	"Date",
	"Actions",
] as const;

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/top-ups/",
)({
	head: () => ({
		meta: [
			{ title: "Credit Top-ups | VerifyAfrica" },
			{ name: "description", content: "Monitor and manage tenant wallet credit top-up transactions." },
		],
	}),
	validateSearch: topUpsSearchSchema,
	component: TopUpsPage,
});

function getTopUpTableHeadClassName(index: number, total: number) {
	if (index === 0) {
		return "pl-4 text-xs font-semibold tracking-wide uppercase sm:pl-6";
	}

	if (index === total - 1) {
		return "pr-4 text-right text-xs font-semibold tracking-wide uppercase sm:pr-6";
	}

	return "text-xs font-semibold tracking-wide uppercase";
}

function TopUpsPage() {
	const navigate = useNavigate({ from: Route.fullPath });
	const urlSearch = Route.useSearch();
	const page = urlSearch.page ?? 1;
	const paymentMethodFilter = (urlSearch.payment_method ??
		DEFAULT_PAYMENT_METHOD_FILTER) as PaymentMethodFilter;
	const statusFilter = (urlSearch.status ??
		DEFAULT_TOP_UP_STATUS_FILTER) as TopUpStatusFilter;
	const amountPaidFilter = (urlSearch.amount_paid ??
		DEFAULT_AMOUNT_PAID_FILTER) as AmountPaidFilter;
	const dateFrom = urlSearch.date_from ?? "";
	const dateTo = urlSearch.date_to ?? "";

	const [searchDraft, setSearchDraft] = useState(urlSearch.search ?? "");
	const [selectedTopUp, setSelectedTopUp] = useState<WalletTransaction | null>(
		null,
	);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const debouncedSearch = useDebouncedValue(searchDraft, 300);

	const updateSearchParams = useCallback(
		(patch: Partial<TopUpsSearchParams>) => {
			void navigate({
				search: (current) => mergeTopUpsSearchParams(current, patch),
				replace: true,
			});
		},
		[navigate],
	);

	useEffect(() => {
		setSearchDraft(urlSearch.search ?? "");
	}, [urlSearch.search]);

	useEffect(() => {
		const nextSearch = debouncedSearch.trim();
		const currentSearch = (urlSearch.search ?? "").trim();
		if (nextSearch === currentSearch) {
			return;
		}
		updateSearchParams({
			search: nextSearch || undefined,
			page: undefined,
		});
	}, [debouncedSearch, urlSearch.search, updateSearchParams]);

	const topUpsListQuery = useMemo(
		() =>
			buildTopUpListQuery({
				page,
				perPage: PAGE_SIZE,
				search: debouncedSearch,
				paymentMethod: paymentMethodFilter,
				status: statusFilter,
				amountPaid: amountPaidFilter,
				dateFrom,
				dateTo,
			}),
		[
			page,
			debouncedSearch,
			paymentMethodFilter,
			statusFilter,
			amountPaidFilter,
			dateFrom,
			dateTo,
		],
	);

	const topUpsQuery = useAllTransactionsV2Query(topUpsListQuery);

	const topUps = topUpsQuery.data?.items ?? [];
	const totalTopUps = topUpsQuery.data?.meta.pagination.total ?? 0;

	const isLoading =
		topUpsQuery.isPending || (topUpsQuery.isFetching && !topUpsQuery.data);
	const isRefreshing = topUpsQuery.isFetching;
	const hasActiveFilters = hasActiveTopUpFilters({
		search: debouncedSearch,
		paymentMethod: paymentMethodFilter,
		status: statusFilter,
		amountPaid: amountPaidFilter,
		dateFrom,
		dateTo,
	});

	const handleRefresh = () => {
		void topUpsQuery.refetch();
	};

	const handleExport = async () => {
		if (totalTopUps === 0) {
			return;
		}

		try {
			const result = await WALLET_V2_API.ALL_TRANSACTIONS({
				...buildTopUpListQuery({
					page: 1,
					perPage: Math.min(totalTopUps, 500),
					search: debouncedSearch,
					paymentMethod: paymentMethodFilter,
					status: statusFilter,
					amountPaid: amountPaidFilter,
					dateFrom,
					dateTo,
				}),
			});
			exportTopUpsCsv(result.items);
		} catch {
			toast.error("Failed to export credit top-ups");
		}
	};

	const openTopUpDetails = (transaction: WalletTransaction) => {
		setSelectedTopUp(transaction);
		setDetailsOpen(true);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Credit Top-ups
					</h1>
					<p className="text-sm text-muted-foreground">
						Manage and monitor credit purchases across all tenants.
					</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Button
						variant="outline"
						onClick={handleExport}
						disabled={isLoading || totalTopUps === 0}
					>
						<DownloadSimpleIcon />
						Export
					</Button>
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
							value={searchDraft}
							onChange={(event) => setSearchDraft(event.target.value)}
							placeholder="Search by ID, tenant, amount, or reference..."
							className="pl-9"
							disabled={isLoading}
						/>
					</div>
				</div>

				<div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-start sm:px-6">
					<div className="flex items-center gap-2 pt-2">
						<FunnelIcon className="size-4 text-muted-foreground" />
						<span className="text-sm font-medium">Filters:</span>
					</div>

					<div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
						<DateFilterPicker
							id="top-ups-date-from"
							label="Date from"
							value={dateFrom}
							onChange={(value) =>
								updateSearchParams({
									date_from: value || undefined,
									page: undefined,
								})
							}
							disabled={isLoading}
							max={dateTo || undefined}
							placeholder="Start date"
						/>
						<DateFilterPicker
							id="top-ups-date-to"
							label="Date to"
							value={dateTo}
							onChange={(value) =>
								updateSearchParams({
									date_to: value || undefined,
									page: undefined,
								})
							}
							disabled={isLoading}
							min={dateFrom || undefined}
							placeholder="End date"
						/>

						<Select
							value={paymentMethodFilter}
							onValueChange={(value) =>
								updateSearchParams({
									payment_method: value as PaymentMethodFilter,
									page: undefined,
								})
							}
							disabled={isLoading}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Payment Method" />
							</SelectTrigger>
							<SelectContent>
								{PAYMENT_METHOD_FILTER_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={amountPaidFilter}
							onValueChange={(value) =>
								updateSearchParams({
									amount_paid: value as AmountPaidFilter,
									page: undefined,
								})
							}
							disabled={isLoading}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Amount Paid" />
							</SelectTrigger>
							<SelectContent>
								{AMOUNT_PAID_FILTER_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={statusFilter}
							onValueChange={(value) =>
								updateSearchParams({
									status: value as TopUpStatusFilter,
									page: undefined,
								})
							}
							disabled={isLoading}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								{TOP_UP_STATUS_FILTER_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{hasActiveFilters ? (
						<Button
							variant="outline"
							className="shrink-0"
							onClick={() => {
								setSearchDraft("");
								updateSearchParams({
									search: undefined,
									payment_method: DEFAULT_PAYMENT_METHOD_FILTER,
									status: DEFAULT_TOP_UP_STATUS_FILTER,
									amount_paid: DEFAULT_AMOUNT_PAID_FILTER,
									date_from: undefined,
									date_to: undefined,
									page: undefined,
								});
							}}
						>
							Clear Filters
						</Button>
					) : null}
				</div>

				<CardContent className="gap-0 p-0">
					{isLoading ? (
						<div className="p-4">
							<TopUpsTableSkeleton />
							<TablePaginationSkeleton />
						</div>
					) : topUpsQuery.isError ? (
						<div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
							<p className="text-sm text-muted-foreground">
								Failed to load credit top-ups. Please try again.
							</p>
							<Button onClick={handleRefresh}>Try Again</Button>
						</div>
					) : topUps.length === 0 ? (
						<div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
							<CreditCardIcon className="size-10 text-muted-foreground" />
							<p className="text-sm text-muted-foreground">
								{hasActiveFilters
									? "No credit top-ups match your search or filters"
									: "No credit top-up records found"}
							</p>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											{TOP_UP_TABLE_COLUMNS.map((column, index) => (
												<TableHead
													key={column}
													className={getTopUpTableHeadClassName(
														index,
														TOP_UP_TABLE_COLUMNS.length,
													)}
												>
													{column}
												</TableHead>
											))}
										</TableRow>
									</TableHeader>
									<TableBody>
										{topUps.map((topUp) => (
											<TopUpRow
												key={topUp.id}
												topUp={topUp}
												onViewDetails={() => openTopUpDetails(topUp)}
											/>
										))}
									</TableBody>
								</Table>
							</div>

							<TablePagination
								page={page}
								pageSize={PAGE_SIZE}
								total={totalTopUps}
								onPageChange={(nextPage) =>
									updateSearchParams({
										page: nextPage > 1 ? nextPage : undefined,
									})
								}
							/>
						</>
					)}
				</CardContent>
			</Card>

			<TopUpDetailsDialog
				open={detailsOpen}
				transaction={selectedTopUp}
				onOpenChange={(open) => {
					setDetailsOpen(open);
					if (!open) {
						setSelectedTopUp(null);
					}
				}}
			/>
		</div>
	);
}

function TopUpRow({
	topUp,
	onViewDetails,
}: {
	topUp: WalletTransaction;
	onViewDetails: () => void;
}) {
	return (
		<TableRow>
			<TableCell className="pl-4 font-medium sm:pl-6">
				{formatTopUpId(topUp)}
			</TableCell>
			<TableCell className="capitalize">{getTopUpTenantName(topUp)}</TableCell>
			<TableCell className="font-medium">
				{formatTenantMoney(topUp.amount)}
			</TableCell>
			<TableCell>{getTopUpPaymentMethod(topUp)}</TableCell>
			<TableCell className="font-mono text-xs">{topUp.reference}</TableCell>
			<TableCell>
				<Badge variant="outline" className={getTopUpStatusBadgeClass()}>
					{getTopUpStatusLabel()}
				</Badge>
			</TableCell>
			<TableCell>{formatTenantDate(topUp.created_at)}</TableCell>
			<TableCell className="pr-4 text-right sm:pr-6">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon-sm">
							<DotsThreeVerticalIcon className="size-4" />
							<span className="sr-only">Open actions</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							className="whitespace-nowrap"
							onClick={onViewDetails}
						>
							View Details
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
		</TableRow>
	);
}

function TopUpsTableSkeleton() {
	return (
		<div className="space-y-3">
			{createSkeletonKeys(5, "top-up-row").map((key) => (
				<div key={key} className="flex items-center gap-4 px-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-6 w-20" />
					<Skeleton className="h-4 w-32" />
					<Skeleton className="size-8" />
				</div>
			))}
		</div>
	);
}
