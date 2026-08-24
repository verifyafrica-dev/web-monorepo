import { ArrowLeftIcon, EyeIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type ReactNode, useMemo, useState } from "react";

import {
	useTenantVerificationRequestsV2Query,
	useVerificationBatchDetailV2Query,
} from "#/api/http/v2/verifications/verifications.hooks";
import { TablePagination } from "@verifyafrica/ui/components/ui-extended/table-pagination";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { TypeBadge } from "@verifyafrica/ui/components/ui-extended/type-badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { cn } from "@verifyafrica/ui/lib/utils";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { useCurrentTenant } from "../../../team/-data";
import { ReportsTableShell } from "../../-components/reports-table-shell";
import {
	BatchCountBadge,
	VerificationStatusBadge,
} from "../../-components/verification-badges";
import {
	formatReportDate,
	formatVerificationType,
	mapVerificationRequestsToReports,
	REPORTS_PAGE_SIZE,
} from "../../-data";

const VERIFICATION_COLUMNS = [
	"ID",
	"Type",
	"Status",
	"Name",
	"Date",
	"Actions",
];

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/reports/batch/$batchId/",
)({
	head: () => ({
		meta: [
			{ title: "Batch Report Details | VerifyAfrica" },
			{
				name: "description",
				content: "Inspect verification results for a submitted report batch.",
			},
		],
	}),
	component: BatchVerificationReportDetailPage,
});

function BatchVerificationReportDetailPage() {
	const { batchId } = Route.useParams();
	const { tenantId } = useCurrentTenant();
	const [page, setPage] = useState(1);

	const batchQuery = useVerificationBatchDetailV2Query(
		batchId,
		Boolean(batchId),
	);
	const batch = batchQuery.data;

	const requestsQuery = useTenantVerificationRequestsV2Query(
		tenantId,
		{
			page,
			per_page: REPORTS_PAGE_SIZE,
			batch_id: batchId,
		},
		Boolean(tenantId) && Boolean(batchId),
	);

	const verifications = useMemo(
		() => mapVerificationRequestsToReports(requestsQuery.data?.items ?? []),
		[requestsQuery.data?.items],
	);

	const total = requestsQuery.data?.meta.pagination.total ?? 0;
	const successRate =
		batch && batch.total_count > 0
			? ((batch.success_count / batch.total_count) * 100).toFixed(1)
			: "0";

	return (
		<div className="flex min-w-0 flex-col gap-6">
			<div className="flex flex-col gap-3">
				<Button
					variant="ghost"
					className="w-fit px-4"
					asChild
				>
					<Link
						to="/app/reports"
						search={{ tab: "batch" }}
					>
						<ArrowLeftIcon />
						Back to Reports
					</Link>
				</Button>
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Batch Verification Report
					</h1>
					<p className="text-sm text-muted-foreground">
						Review batch progress and open individual verification reports.
					</p>
				</div>
			</div>

			{batchQuery.isPending ? (
				<div className="grid gap-4 md:grid-cols-4">
					{createSkeletonKeys(4, "batch-stat").map((key) => (
						<Skeleton
							key={key}
							className="h-28 w-full rounded-xl"
						/>
					))}
				</div>
			) : batchQuery.isError || !batch ? (
				<Card>
					<CardContent className="flex min-h-[320px] items-center justify-center pt-6 text-sm text-muted-foreground">
						Failed to load batch verification report.
					</CardContent>
				</Card>
			) : (
				<>
					<div className="grid gap-4 md:grid-cols-4">
						<StatCard label="Status">
							<VerificationStatusBadge status={batch.status} />
						</StatCard>
						<StatCard label="Total Count">{batch.total_count}</StatCard>
						<StatCard label="Successful">
							<BatchCountBadge
								count={batch.success_count}
								variant="success"
							/>
						</StatCard>
						<StatCard label="Success Rate">
							<div className="flex items-center gap-2">
								<span className="text-lg font-semibold tabular-nums">
									{successRate}%
								</span>
								<div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
									<div
										className={cn(
											"h-full rounded-full",
											Number(successRate) >= 80
												? "bg-emerald-500"
												: Number(successRate) >= 50
													? "bg-amber-500"
													: "bg-red-500",
										)}
										style={{ width: `${successRate}%` }}
									/>
								</div>
							</div>
						</StatCard>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="text-base font-semibold">
								Batch Verifications
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{requestsQuery.isPending ? (
								<Skeleton className="h-64 w-full" />
							) : requestsQuery.isError ? (
								<p className="text-sm text-muted-foreground">
									Failed to load verifications in this batch.
								</p>
							) : (
								<>
									<ReportsTableShell>
										<Table className="w-max! min-w-full">
											<TableHeader>
												<TableRow className="bg-muted/40 hover:bg-muted/40">
													{VERIFICATION_COLUMNS.map((column, index) => (
														<TableHead
															key={column}
															className={cn(
																"text-xs font-semibold tracking-wide uppercase",
																index === 0 && "pl-4 sm:pl-6",
																index === VERIFICATION_COLUMNS.length - 1 &&
																	"pr-4 text-center sm:pr-6",
															)}
														>
															{column}
														</TableHead>
													))}
												</TableRow>
											</TableHeader>
											<TableBody>
												{verifications.length === 0 ? (
													<TableRow>
														<TableCell
															colSpan={VERIFICATION_COLUMNS.length}
															className="h-24 text-center text-sm text-muted-foreground"
														>
															No verifications found in this batch.
														</TableCell>
													</TableRow>
												) : (
													verifications.map((verification) => (
														<TableRow key={verification.id}>
															<TableCell className="pl-4 font-mono text-xs sm:pl-6">
																<p className="max-w-[15ch] truncate">
																	{verification.id}
																</p>
															</TableCell>
															<TableCell>
																<TypeBadge
																	label={formatVerificationType(verification)}
																/>
															</TableCell>
															<TableCell>
																<VerificationStatusBadge
																	status={verification.status}
																/>
															</TableCell>
															<TableCell className="text-sm">
																{verification.name}
															</TableCell>
															<TableCell className="text-sm text-muted-foreground">
																{formatReportDate(verification.created_at)}
															</TableCell>
															<TableCell className="pr-4 text-center sm:pr-6">
																<Button
																	type="button"
																	variant="outline"
																	size="sm"
																	className="cursor-pointer tracking-wide"
																	asChild
																>
																	<Link
																		to="/app/reports/$id"
																		params={{ id: verification.id }}
																	>
																		<EyeIcon className="size-4" />
																		View
																	</Link>
																</Button>
															</TableCell>
														</TableRow>
													))
												)}
											</TableBody>
										</Table>
									</ReportsTableShell>
									<TablePagination
										page={page}
										pageSize={REPORTS_PAGE_SIZE}
										total={total}
										onPageChange={setPage}
									/>
								</>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}

function StatCard({ label, children }: { label: string; children: ReactNode }) {
	return (
		<Card>
			<CardContent className="flex flex-col gap-2 pt-0">
				<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
					{label}
				</p>
				<div className="text-sm">{children}</div>
			</CardContent>
		</Card>
	);
}
