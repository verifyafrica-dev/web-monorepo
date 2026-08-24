import {
	ArrowsClockwiseIcon,
	BuildingsIcon,
	EyeIcon,
	PencilSimpleIcon,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	BILLING_V2_QUERY_KEYS,
	useTenantBillingInformationV2Query,
	useTenantInvoicesV2Query,
} from "#/api/http/v2/billing/billing.hooks";
import {
	useTenantTransactionsV2Query,
	useWalletBalanceV2Query,
	WALLET_V2_QUERY_KEYS,
} from "#/api/http/v2/wallet/wallet.hooks";
import {
	TablePagination,
	TablePaginationSkeleton,
} from "#/components/table-pagination";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@verifyafrica/ui/components/ui/tabs";
import { cn } from "#/lib/utils.ts";
import { useCurrentTenant } from "../team/-data";
import { AddCreditsDialog } from "./-components/add-credits-dialog";
import { ExportTransactionsDialog } from "./-components/export-transactions-dialog";
import { InvoiceDetailsDialog } from "./-components/invoice-details-dialog";
import { TransactionDetailsDialog } from "./-components/transaction-details-dialog";
import { UpdateBillingDialog } from "./-components/update-billing-dialog";
import {
	formatBillingDisplayAddress,
	formatInvoiceAmount,
	formatInvoiceDate,
	formatMoney,
	formatSignedAmount,
	getInvoiceFilename,
	getInvoicePaymentStatusBadgeClassName,
	INVOICES_PAGE_SIZE,
	isBillingNotFoundError,
	mapWalletTransaction,
	parseValidDate,
	TRANSACTIONS_PAGE_SIZE,
	type Transaction,
} from "./-data";

export const Route = createFileRoute("/(auth)/_auth_layout/app/billing/")({
	head: () => ({
		meta: [
			{ title: "Billing | VerifyAfrica" },
			{
				name: "description",
				content:
					"Review subscription plans, invoices, and account billing usage.",
			},
		],
	}),
	component: BillingPage,
});

function BillingPage() {
	const queryClient = useQueryClient();
	const { user, tenantId, isTenantAdmin } = useCurrentTenant();
	const accountCreatedAt = useMemo(
		() => parseValidDate(user?.created_at),
		[user?.created_at],
	);

	const [transactionPage, setTransactionPage] = useState(1);
	const [invoicePage, setInvoicePage] = useState(1);
	const [billingOpen, setBillingOpen] = useState(false);
	const [topUpOpen, setTopUpOpen] = useState(false);
	const [exportOpen, setExportOpen] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [selectedTransaction, setSelectedTransaction] =
		useState<Transaction | null>(null);
	const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false);
	const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
		null,
	);

	const walletBalanceQuery = useWalletBalanceV2Query(
		tenantId,
		Boolean(tenantId),
	);
	const billingInformationQuery = useTenantBillingInformationV2Query(
		tenantId,
		Boolean(tenantId),
	);
	const transactionsQuery = useTenantTransactionsV2Query(
		tenantId,
		{
			page: transactionPage,
			per_page: TRANSACTIONS_PAGE_SIZE,
		},
		Boolean(tenantId),
	);
	const invoicesQuery = useTenantInvoicesV2Query(
		tenantId,
		{
			page: invoicePage,
			per_page: INVOICES_PAGE_SIZE,
		},
		Boolean(tenantId),
	);

	const wallet = walletBalanceQuery.data;
	const billingInfo = billingInformationQuery.data;
	const isBillingNotFound = isBillingNotFoundError(
		billingInformationQuery.error,
	);
	const currency = wallet?.currency ?? "USD";
	const balanceAmount = Number.parseFloat(wallet?.balance ?? "0");

	const transactions = useMemo(
		() =>
			(transactionsQuery.data?.items ?? []).map((transaction) =>
				mapWalletTransaction(transaction, currency),
			),
		[transactionsQuery.data?.items, currency],
	);

	const transactionTotal =
		transactionsQuery.data?.meta.pagination.total ?? transactions.length;

	const invoices = invoicesQuery.data?.items ?? [];
	const invoiceTotal =
		invoicesQuery.data?.meta.pagination.total ?? invoices.length;

	const isSummaryLoading =
		walletBalanceQuery.isPending ||
		walletBalanceQuery.isFetching ||
		billingInformationQuery.isPending ||
		billingInformationQuery.isFetching;

	const isTransactionsLoading =
		transactionsQuery.isPending || transactionsQuery.isFetching;

	const isInvoicesLoading = invoicesQuery.isPending || invoicesQuery.isFetching;

	const isRefreshing =
		walletBalanceQuery.isFetching ||
		billingInformationQuery.isFetching ||
		transactionsQuery.isFetching;

	function openTransactionDetails(transaction: Transaction) {
		setSelectedTransaction(transaction);
		setDetailsOpen(true);
	}

	function openInvoiceDetails(invoiceId: string) {
		setSelectedInvoiceId(invoiceId);
		setInvoiceDetailsOpen(true);
	}

	async function handleRefresh() {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: BILLING_V2_QUERY_KEYS.all }),
			queryClient.invalidateQueries({ queryKey: WALLET_V2_QUERY_KEYS.all }),
		]);
	}

	if (
		walletBalanceQuery.isError ||
		(billingInformationQuery.isError && !isBillingNotFound)
	) {
		return (
			<div className="flex w-full flex-col gap-6">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Billing & Invoices
					</h1>
					<p className="text-sm text-muted-foreground">
						Manage your invoices, payment history, and account credits
					</p>
				</div>
				<Card>
					<CardContent className="py-10 text-center text-sm text-muted-foreground">
						Failed to load billing information. Please try again.
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex w-full flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					Billing & Invoices
				</h1>
				<p className="text-sm text-muted-foreground">
					Manage your invoices, payment history, and account credits
				</p>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				{isSummaryLoading ? (
					<>
						<BalanceCardSkeleton />
						<BillingInfoCardSkeleton />
					</>
				) : (
					<>
						<Card>
							<CardHeader className="flex flex-row items-start justify-between space-y-0">
								<div className="space-y-3">
									<p className="text-sm text-muted-foreground">Balance</p>
									<div>
										<p className="text-4xl font-semibold tracking-tight">
											${formatMoney(balanceAmount)}
										</p>
										<p className="text-sm font-medium text-muted-foreground">
											{currency}
										</p>
									</div>
								</div>
								<Button
									type="button"
									className="cursor-pointer"
									onClick={() => {
										if (!billingInfo) {
											if (isTenantAdmin) {
												toast.warning("Please add billing information first");
												setBillingOpen(true);
											} else {
												toast.warning(
													"Billing information is required before topping up. Ask a tenant admin to add it.",
												);
											}
											return;
										}

										setTopUpOpen(true);
									}}
								>
									Top Up Balance
								</Button>
							</CardHeader>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-start justify-between space-y-0">
								<div className="flex items-center gap-2">
									<BuildingsIcon className="size-5 text-muted-foreground" />
									<CardTitle className="text-base font-semibold">
										Billing Information
									</CardTitle>
								</div>
								{isTenantAdmin ? (
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										className="cursor-pointer text-primary"
										onClick={() => setBillingOpen(true)}
										aria-label="Edit billing information"
									>
										<PencilSimpleIcon className="size-4" />
									</Button>
								) : null}
							</CardHeader>
							<CardContent>
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">Address</p>
									<p className="text-sm font-medium">
										{formatBillingDisplayAddress(billingInfo)}
									</p>
								</div>
							</CardContent>
						</Card>
					</>
				)}
			</div>

			<Card>
				<CardContent className="pt-0">
					<Tabs
						defaultValue="transactions"
						className="flex w-full flex-col gap-4"
					>
						<TabsList className="w-full justify-start">
							<TabsTrigger value="transactions">Transactions</TabsTrigger>
							<TabsTrigger value="invoices">Invoices</TabsTrigger>
						</TabsList>

						<TabsContent
							value="transactions"
							className="flex flex-col gap-4"
						>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<h2 className="text-lg font-semibold flex-1">
									Transaction History
								</h2>
								<div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
									<Button
										type="button"
										variant="outline"
										className="cursor-pointer w-full sm:w-auto"
										disabled={isTransactionsLoading || isRefreshing}
										onClick={() => void handleRefresh()}
									>
										<ArrowsClockwiseIcon
											className={cn(isRefreshing && "animate-spin")}
											weight="bold"
										/>
										Refresh
									</Button>
									{/* <Button
										type="button"
										variant="outline"
										className="cursor-pointer"
										disabled={isTransactionsLoading}
										onClick={() => setExportOpen(true)}
									>
										<DownloadSimpleIcon className="size-4" />
										Export
									</Button> */}
								</div>
							</div>

							{isTransactionsLoading ? (
								<div className="min-h-[320px] flex flex-col justify-between">
									<TableSkeleton
										columns={[
											"Reference",
											"Date",
											"Description",
											"Amount",
											"Type",
											"Balance Before",
											"Balance After",
											"Actions",
										]}
									/>
									<TablePaginationSkeleton />
								</div>
							) : transactionsQuery.isError ? (
								<div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed">
									<p className="text-sm text-muted-foreground">
										Failed to load transactions. Please try again.
									</p>
								</div>
							) : (
								<div className="min-h-[320px] flex flex-col justify-between">
									<Table
										className={cn(transactions.length === 0 && "h-full flex-1")}
									>
										<TableHeader>
											<TableRow>
												<TableHead>Reference</TableHead>
												<TableHead>Date</TableHead>
												<TableHead>Description</TableHead>
												<TableHead>Amount</TableHead>
												<TableHead>Type</TableHead>
												{/* <TableHead>Balance Before</TableHead>
												<TableHead>Balance After</TableHead> */}
												<TableHead>Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{transactions.length === 0 ? (
												<TableRow>
													<TableCell
														colSpan={8}
														className="h-24 text-center text-sm text-muted-foreground"
													>
														No transactions found.
													</TableCell>
												</TableRow>
											) : (
												transactions.map((transaction) => {
													const isDebit = transaction.type === "debit";

													return (
														<TableRow
															key={transaction.id}
															className="cursor-pointer"
															onClick={() =>
																openTransactionDetails(transaction)
															}
														>
															<TableCell className="font-mono text-xs">
																{transaction.reference}
															</TableCell>
															<TableCell>{transaction.date}</TableCell>
															<TableCell>{transaction.description}</TableCell>
															<TableCell
																className={cn(
																	"font-medium",
																	isDebit ? "text-red-600" : "text-emerald-600",
																)}
															>
																{formatSignedAmount(
																	transaction.amount,
																	transaction.currency,
																)}
															</TableCell>
															<TableCell>
																<Badge
																	variant="outline"
																	className={cn(
																		"capitalize",
																		isDebit
																			? "border-red-200 bg-red-50 text-red-700"
																			: "border-emerald-200 bg-emerald-50 text-emerald-700",
																	)}
																>
																	{transaction.type}
																</Badge>
															</TableCell>
															{/* <TableCell>
																{formatSignedAmount(
																	transaction.balanceBefore,
																	transaction.currency,
																)}
															</TableCell>
															<TableCell>
																{formatSignedAmount(
																	transaction.balanceAfter,
																	transaction.currency,
																)}
															</TableCell> */}
															<TableCell
																onClick={(event) => event.stopPropagation()}
															>
																<Button
																	type="button"
																	variant="outline"
																	size="sm"
																	className="cursor-pointer"
																	onClick={() =>
																		openTransactionDetails(transaction)
																	}
																>
																	<EyeIcon className="size-4" />
																	View
																</Button>
															</TableCell>
														</TableRow>
													);
												})
											)}
										</TableBody>
									</Table>

									<TablePagination
										page={transactionPage}
										total={transactionTotal}
										pageSize={TRANSACTIONS_PAGE_SIZE}
										onPageChange={setTransactionPage}
									/>
								</div>
							)}
						</TabsContent>

						<TabsContent
							value="invoices"
							className="flex flex-col gap-4"
						>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<h2 className="text-lg font-semibold flex-1">Invoices</h2>
								<div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
									<Button
										type="button"
										variant="outline"
										className="cursor-pointer w-full sm:w-auto"
										disabled={isInvoicesLoading || isRefreshing}
										onClick={() => void handleRefresh()}
									>
										<ArrowsClockwiseIcon
											className={cn(isRefreshing && "animate-spin")}
											weight="bold"
										/>
										Refresh
									</Button>
								</div>
							</div>

							{isInvoicesLoading ? (
								<div className="min-h-80 flex flex-col justify-between">
									<TableSkeleton
										columns={[
											"Invoice",
											"Description",
											"Amount",
											"Status",
											"Created",
											"Due",
											"Actions",
										]}
									/>
									<TablePaginationSkeleton />
								</div>
							) : invoicesQuery.isError ? (
								<div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed">
									<p className="text-sm text-muted-foreground">
										Failed to load invoices. Please try again.
									</p>
								</div>
							) : (
								<div className="min-h-80 flex flex-col justify-between">
									<Table
										className={cn(invoices.length === 0 && "h-full flex-1")}
									>
										<TableHeader>
											<TableRow>
												<TableHead>Invoice</TableHead>
												<TableHead>Description</TableHead>
												<TableHead>Amount</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Created</TableHead>
												<TableHead>Due</TableHead>
												<TableHead>Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{invoices.length === 0 ? (
												<TableRow>
													<TableCell
														colSpan={7}
														className="h-24 text-center text-sm text-muted-foreground"
													>
														No invoices available yet.
													</TableCell>
												</TableRow>
											) : (
												invoices.map((invoice) => (
													<TableRow
														key={invoice.id}
														className="cursor-pointer"
														onClick={() => openInvoiceDetails(invoice.id)}
													>
														<TableCell className="font-mono text-xs">
															{getInvoiceFilename(invoice)}
														</TableCell>
														<TableCell>{invoice.description ?? "—"}</TableCell>
														<TableCell>
															{formatInvoiceAmount(
																invoice.total_amount,
																invoice.currency ?? currency,
															)}
														</TableCell>
														<TableCell>
															<Badge
																variant="outline"
																className={cn(
																	"uppercase",
																	getInvoicePaymentStatusBadgeClassName(
																		invoice.payment_status,
																	),
																)}
															>
																{invoice.payment_status ?? "unknown"}
															</Badge>
														</TableCell>
														<TableCell>
															{formatInvoiceDate(invoice.created_at)}
														</TableCell>
														<TableCell>
															{formatInvoiceDate(invoice.due_at)}
														</TableCell>
														<TableCell
															onClick={(event) => event.stopPropagation()}
														>
															<Button
																type="button"
																variant="outline"
																size="sm"
																className="cursor-pointer"
																onClick={() => openInvoiceDetails(invoice.id)}
															>
																<EyeIcon className="size-4" />
																View
															</Button>
														</TableCell>
													</TableRow>
												))
											)}
										</TableBody>
									</Table>

									<TablePagination
										page={invoicePage}
										total={invoiceTotal}
										pageSize={INVOICES_PAGE_SIZE}
										onPageChange={setInvoicePage}
									/>
								</div>
							)}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			<AddCreditsDialog
				open={topUpOpen}
				onOpenChange={setTopUpOpen}
				userEmail={user?.email}
				tenantId={tenantId}
				onSuccess={() => {
					void handleRefresh();
				}}
			/>
			{isTenantAdmin ? (
				<UpdateBillingDialog
					open={billingOpen}
					onOpenChange={setBillingOpen}
					billingInfo={billingInfo}
					tenantId={tenantId}
				/>
			) : null}
			<ExportTransactionsDialog
				open={exportOpen}
				onOpenChange={setExportOpen}
				accountCreatedAt={accountCreatedAt}
				tenantId={tenantId}
				currency={currency}
			/>
			<TransactionDetailsDialog
				open={detailsOpen}
				onOpenChange={(open) => {
					setDetailsOpen(open);
					if (!open) {
						setSelectedTransaction(null);
					}
				}}
				transaction={selectedTransaction}
			/>
			<InvoiceDetailsDialog
				open={invoiceDetailsOpen}
				onOpenChange={(open) => {
					setInvoiceDetailsOpen(open);
					if (!open) {
						setSelectedInvoiceId(null);
					}
				}}
				tenantId={tenantId}
				invoiceId={selectedInvoiceId}
				fallbackCurrency={currency}
			/>
		</div>
	);
}

function BalanceCardSkeleton() {
	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between space-y-0">
				<div className="space-y-3">
					<Skeleton className="h-4 w-16" />
					<div className="space-y-1.5">
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-4 w-10" />
					</div>
				</div>
			</CardHeader>
		</Card>
	);
}

function BillingInfoCardSkeleton() {
	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between space-y-0">
				<div className="flex items-center gap-2">
					<Skeleton className="size-5 rounded-md" />
					<Skeleton className="h-5 w-36" />
				</div>
				<Skeleton className="size-8 rounded-md" />
			</CardHeader>
			<CardContent>
				<div className="space-y-1.5">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-40" />
				</div>
			</CardContent>
		</Card>
	);
}

function TableSkeleton({
	columns,
	rows = 5,
}: {
	columns: string[];
	rows?: number;
}) {
	const skeletonRows = Array.from(
		{ length: rows },
		(_, index) => `row-${index}`,
	);

	return (
		<Table>
			<TableHeader>
				<TableRow>
					{columns.map((column) => (
						<TableHead key={column}>{column}</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{skeletonRows.map((rowId) => (
					<TableRow key={rowId}>
						{columns.map((column) => (
							<TableCell key={`${rowId}-${column}`}>
								<Skeleton className="h-4 w-full" />
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
