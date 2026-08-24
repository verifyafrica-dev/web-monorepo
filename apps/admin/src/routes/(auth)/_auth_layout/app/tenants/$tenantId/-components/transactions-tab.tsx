import {
	CreditCardIcon,
	EyeIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { WalletTransaction } from "#/api/http/v2/wallet/wallet.types";
import { useTenantTransactionsV2Query } from "#/api/http/v2/wallet/wallet.hooks";
import {
	TablePagination,
	TablePaginationSkeleton,
} from "#/components/table-pagination";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
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
import { useDebouncedValue } from "#/hooks/use-debounced-value";
import { createSkeletonKeys } from "#/lib/skeleton-keys";
import {
	downloadCsv,
	formatTenantDate,
	formatTenantMoney,
	getTransactionTypeBadgeClass,
	matchesTransactionSearch,
} from "../-data";

const PAGE_SIZE = 10;

const TRANSACTION_TABLE_COLUMNS = [
	"Reference",
	"Date",
	"Amount",
	"Type",
	"Description",
	"Actions",
] as const;

function getTransactionTableHeadClassName(index: number, total: number) {
	if (index === 0) {
		return "pl-4 text-xs font-semibold tracking-wide uppercase sm:pl-6";
	}

	if (index === total - 1) {
		return "pr-4 text-right text-xs font-semibold tracking-wide uppercase sm:pr-6";
	}

	return "text-xs font-semibold tracking-wide uppercase";
}

export function TransactionsTab({ tenantId }: { tenantId: string }) {
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTransaction, setSelectedTransaction] =
		useState<WalletTransaction | null>(null);
	const [_isExporting, setIsExporting] = useState(false);
	const debouncedSearch = useDebouncedValue(searchQuery, 300);

	const transactionsQuery = useTenantTransactionsV2Query(tenantId, {
		page,
		per_page: PAGE_SIZE,
	});

	useEffect(() => {
		setPage(1);
	}, []);

	const filteredTransactions = useMemo(() => {
		return (transactionsQuery.data?.items ?? []).filter((transaction) =>
			matchesTransactionSearch(transaction, debouncedSearch),
		);
	}, [debouncedSearch, transactionsQuery.data?.items]);

	const total = transactionsQuery.data?.meta.pagination.total ?? 0;
	const isLoading =
		transactionsQuery.isPending ||
		(transactionsQuery.isFetching && !transactionsQuery.data);
	const hasActiveSearch = debouncedSearch.trim().length > 0;

	const _handleExport = () => {
		if (filteredTransactions.length === 0) {
			return;
		}

		setIsExporting(true);

		try {
			downloadCsv(
				`tenant_transactions_${tenantId}_${new Date().toISOString().split("T")[0]}.csv`,
				[
					[
						"Reference",
						"Date",
						"Amount",
						"Type",
						"Description",
						"Balance Before",
						"Balance After",
					],
					...filteredTransactions.map((transaction) => [
						transaction.reference,
						formatTenantDate(transaction.created_at),
						transaction.amount,
						transaction.type,
						transaction.reason,
						transaction.balance_before,
						transaction.balance_after,
					]),
				],
			);
		} catch {
			toast.error("Failed to export transactions");
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<>
			<Card>
				<CardHeader className="gap-4 border-b">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<CardTitle className="font-semibold">Transactions</CardTitle>
						{/* <Button
							variant="outline"
							disabled={isExporting || filteredTransactions.length === 0}
							onClick={handleExport}
						>
							<DownloadSimpleIcon />
							{isExporting ? "Exporting..." : "Export"}
						</Button> */}
					</div>
					<div className="relative">
						<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Search transactions..."
							className="pl-9"
							disabled={isLoading}
						/>
					</div>
				</CardHeader>
				<CardContent className="gap-0 p-0">
					{isLoading ? (
						<div className="p-4">
							<TransactionsTableSkeleton />
							<TablePaginationSkeleton />
						</div>
					) : transactionsQuery.isError ? (
						<div className="flex min-h-48 items-center justify-center px-6 text-sm text-muted-foreground">
							Failed to load transactions. Please try again.
						</div>
					) : filteredTransactions.length === 0 ? (
						<div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
							<CreditCardIcon className="size-10 text-muted-foreground" />
							<p className="text-sm text-muted-foreground">
								{hasActiveSearch
									? "No transactions match your search"
									: "No transactions found for this tenant"}
							</p>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											{TRANSACTION_TABLE_COLUMNS.map((column, index) => (
												<TableHead
													key={column}
													className={getTransactionTableHeadClassName(
														index,
														TRANSACTION_TABLE_COLUMNS.length,
													)}
												>
													{column}
												</TableHead>
											))}
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredTransactions.map((transaction) => (
											<TableRow key={transaction.id}>
												<TableCell className="pl-4 font-medium sm:pl-6">
													{transaction.reference}
												</TableCell>
												<TableCell>
													{formatTenantDate(transaction.created_at)}
												</TableCell>
												<TableCell className="font-medium">
													{formatTenantMoney(transaction.amount)}
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={getTransactionTypeBadgeClass(
															transaction.type,
														)}
													>
														{transaction.type}
													</Badge>
												</TableCell>
												<TableCell
													className="max-w-xs truncate"
													title={transaction.reason}
												>
													{transaction.reason}
												</TableCell>
												<TableCell className="pr-4 text-right sm:pr-6">
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => setSelectedTransaction(transaction)}
													>
														<EyeIcon className="size-4" />
														<span className="sr-only">View transaction</span>
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							<TablePagination
								page={page}
								pageSize={PAGE_SIZE}
								total={total}
								onPageChange={setPage}
							/>
						</>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={Boolean(selectedTransaction)}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedTransaction(null);
					}
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Transaction Details</DialogTitle>
					</DialogHeader>
					{selectedTransaction ? (
						<div className="grid gap-4 sm:grid-cols-2">
							<DetailField
								label="Reference"
								value={selectedTransaction.reference}
							/>
							<DetailField
								label="Date"
								value={formatTenantDate(selectedTransaction.created_at)}
							/>
							<DetailField
								label="Amount"
								value={formatTenantMoney(selectedTransaction.amount)}
							/>
							<DetailField
								label="Type"
								value={selectedTransaction.type}
							/>
							<DetailField
								label="Balance Before"
								value={formatTenantMoney(selectedTransaction.balance_before)}
							/>
							<DetailField
								label="Balance After"
								value={formatTenantMoney(selectedTransaction.balance_after)}
							/>
							<div className="space-y-1 sm:col-span-2">
								<p className="text-sm font-medium text-muted-foreground">
									Description
								</p>
								<p className="text-sm">{selectedTransaction.reason}</p>
							</div>
							{selectedTransaction.metadata ? (
								<div className="space-y-1 sm:col-span-2">
									<p className="text-sm font-medium text-muted-foreground">
										Metadata
									</p>
									<pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs">
										{JSON.stringify(selectedTransaction.metadata, null, 2)}
									</pre>
								</div>
							) : null}
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</>
	);
}

function DetailField({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-1">
			<p className="text-sm font-medium text-muted-foreground">{label}</p>
			<p className="text-sm">{value}</p>
		</div>
	);
}

function TransactionsTableSkeleton() {
	return (
		<div className="space-y-3">
			{createSkeletonKeys(5, "tenant-transaction-row").map((key) => (
				<div
					key={key}
					className="flex items-center gap-4 px-2"
				>
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-4 flex-1" />
					<Skeleton className="size-8" />
				</div>
			))}
		</div>
	);
}
