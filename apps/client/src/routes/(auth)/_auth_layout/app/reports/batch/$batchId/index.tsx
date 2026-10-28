import { ArrowLeftIcon, EyeIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useMemo, useState } from "react";

import {
	useMixedVerificationDetailV2Query,
	useMixedVerificationsAvailabilityV2Query,
	useTenantVerificationRequestsV2Query,
	useVerificationBatchDetailV2Query,
	VERIFICATIONS_V2_QUERY_KEYS,
} from "#/api/http/v2/verifications/verifications.hooks";
import type { VerificationBatch } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { TablePagination } from "@verifyafrica/ui/components/ui-extended/table-pagination";
import { TypeBadge } from "@verifyafrica/ui/components/ui-extended/type-badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { cn } from "@verifyafrica/ui/lib/utils";
import { CustomVerificationDialog } from "../../../products/mixed-verifications/-components/custom-verification-dialog";
import { useCurrentTenant } from "../../../team/-data";
import { ReportDetailField } from "../../-components/report-detail-field";
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
	type VerificationReport,
} from "../../-data";

const VERIFICATION_COLUMNS = [
	"Step",
	"ID",
	"Type",
	"Status",
	"Name",
	"Date",
	"Actions",
];

type OrderedVerificationRow = VerificationReport & {
	step: number | null;
	canView: boolean;
};

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
	const queryClient = useQueryClient();
	const { batchId } = Route.useParams();
	const { tenantId, isTenantAdmin } = useCurrentTenant();
	const [page, setPage] = useState(1);
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	const batchQuery = useVerificationBatchDetailV2Query(
		batchId,
		Boolean(batchId),
	);
	const batch = batchQuery.data;
	const isMixedBatch = batch?.kind === "mixed";
	const templateId = batch?.template_id ?? undefined;
	const canEditTemplate =
		Boolean(isTenantAdmin && tenantId && isMixedBatch && batch?.template_is_custom && templateId);

	const templateQuery = useMixedVerificationDetailV2Query(
		templateId,
		canEditTemplate || Boolean(isMixedBatch && templateId),
	);
	const availabilityQuery = useMixedVerificationsAvailabilityV2Query(
		tenantId,
		Boolean(tenantId),
	);

	async function openEditDialog() {
		setEditDialogOpen(true);
		if (!tenantId || !templateId) {
			return;
		}
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey:
					VERIFICATIONS_V2_QUERY_KEYS.mixedVerificationsAvailability(tenantId),
			}),
			queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.mixedVerificationDetail(templateId),
			}),
		]);
	}

	const stepCount = batch?.steps?.length ?? 0;
	const requestsPerPage =
		isMixedBatch && stepCount > 0
			? Math.max(stepCount, batch?.total_count ?? REPORTS_PAGE_SIZE, REPORTS_PAGE_SIZE)
			: REPORTS_PAGE_SIZE;

	const requestsQuery = useTenantVerificationRequestsV2Query(
		tenantId,
		{
			page: isMixedBatch && stepCount > 0 ? 1 : page,
			per_page: requestsPerPage,
			batch_id: batchId,
		},
		Boolean(tenantId) && Boolean(batchId),
	);

	const orderedVerifications = useMemo((): OrderedVerificationRow[] => {
		const reports = mapVerificationRequestsToReports(
			requestsQuery.data?.items ?? [],
		);
		const steps = batch?.steps ?? [];

		if (steps.length === 0) {
			return reports.map((report, index) => ({
				...report,
				step: (page - 1) * REPORTS_PAGE_SIZE + index + 1,
				canView: true,
			}));
		}

		const reportById = new Map(reports.map((report) => [report.id, report]));
		const orderedSteps = steps.slice().sort((a, b) => a.order - b.order);
		const rows: OrderedVerificationRow[] = [];

		for (const step of orderedSteps) {
			const report = step.verification_id
				? reportById.get(step.verification_id)
				: undefined;
			if (report) {
				rows.push({ ...report, step: step.order, canView: true });
				reportById.delete(report.id);
				continue;
			}
			rows.push({
				id: step.verification_id ?? step.step_id,
				batch_id: batchId,
				verification_type: step.type,
				status: step.status,
				name: "—",
				created_at: "",
				currency: "",
				cost_charged: "",
				step: step.order,
				canView: Boolean(step.verification_id),
			});
		}

		for (const leftover of reportById.values()) {
			rows.push({ ...leftover, step: null, canView: true });
		}

		return rows;
	}, [batch?.steps, batchId, page, requestsQuery.data?.items]);

	const total = requestsQuery.data?.meta.pagination.total ?? 0;
	const pagedVerifications = useMemo(() => {
		if (!(isMixedBatch && stepCount > 0)) {
			return orderedVerifications;
		}
		const start = (page - 1) * REPORTS_PAGE_SIZE;
		return orderedVerifications.slice(start, start + REPORTS_PAGE_SIZE);
	}, [isMixedBatch, orderedVerifications, page, stepCount]);
	const tableTotal =
		isMixedBatch && stepCount > 0 ? orderedVerifications.length : total;
	const successRate =
		batch && batch.total_count > 0
			? ((batch.success_count / batch.total_count) * 100).toFixed(1)
			: "0";

	const title = batch?.name?.trim()
		? batch.name
		: isMixedBatch
			? "Mixed Verification Batch"
			: "Batch Verification Report";

	return (
		<div className="flex min-w-0 flex-col gap-6">
			<div className="flex flex-col gap-3">
				<Button
					variant="ghost"
					className="w-fit px-4"
					asChild
				>
					{templateId ? (
						<Link
							to="/app/reports/custom/$templateId"
							params={{ templateId }}
						>
							<ArrowLeftIcon />
							Back to Custom Verification
						</Link>
					) : (
						<Link
							to="/app/reports"
							search={{ tab: "batch" }}
						>
							<ArrowLeftIcon />
							Back to Reports
						</Link>
					)}
				</Button>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-1">
						<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
						<p className="text-sm text-muted-foreground">
							Review batch progress and open individual verification reports.
						</p>
					</div>
					{canEditTemplate ? (
						<Button
							type="button"
							variant="outline"
							className="cursor-pointer tracking-wide"
							onClick={() => void openEditDialog()}
							disabled={!templateQuery.data}
						>
							<PencilSimpleIcon className="size-4" />
							Edit Template
						</Button>
					) : null}
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

					<BatchOverviewCard batch={batch} />

					<Card>
						<CardHeader>
							<CardTitle className="text-base font-semibold">
								Verifications
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
												{pagedVerifications.length === 0 ? (
													<TableRow>
														<TableCell
															colSpan={VERIFICATION_COLUMNS.length}
															className="h-24 text-center text-sm text-muted-foreground"
														>
															No verifications found in this batch.
														</TableCell>
													</TableRow>
												) : (
													pagedVerifications.map((verification) => (
														<TableRow key={`${verification.step}-${verification.id}`}>
															<TableCell className="pl-4 text-sm font-medium tabular-nums text-muted-foreground sm:pl-6">
																{verification.step ?? "—"}
															</TableCell>
															<TableCell className="font-mono text-xs">
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
																{verification.created_at
																	? formatReportDate(verification.created_at)
																	: "—"}
															</TableCell>
															<TableCell className="pr-4 text-center sm:pr-6">
																{verification.canView ? (
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
																) : (
																	<span className="text-xs text-muted-foreground">
																		—
																	</span>
																)}
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
										total={tableTotal}
										onPageChange={setPage}
									/>
								</>
							)}
						</CardContent>
					</Card>
				</>
			)}

			{tenantId && canEditTemplate ? (
				<CustomVerificationDialog
					open={editDialogOpen}
					onOpenChange={setEditDialogOpen}
					tenantId={tenantId}
					template={templateQuery.data ?? null}
					availabilityCatalog={availabilityQuery.data}
				/>
			) : null}
		</div>
	);
}

function BatchOverviewCard({ batch }: { batch: VerificationBatch }) {
	const isMixed = batch.kind === "mixed";

	return (
		<Card className="bg-muted/20">
			<CardHeader>
				<CardTitle className="text-base font-semibold">Batch Overview</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 pt-0 sm:grid-cols-2 lg:grid-cols-3">
				{isMixed && batch.template_id ? (
					<ReportDetailField
						label="ID"
						value={batch.template_id}
						mono
					/>
				) : (
					<ReportDetailField
						label="Batch ID"
						value={batch.id}
						mono
					/>
				)}
				{batch.name ? (
					<ReportDetailField
						label="Name"
						value={batch.name}
					/>
				) : null}
				<ReportDetailField
					label="Kind"
					value={isMixed ? "Mixed verification" : "Bulk verification"}
				/>
				<ReportDetailField
					label="Status"
					value={<VerificationStatusBadge status={batch.status} />}
				/>
				{batch.email ? (
					<ReportDetailField
						label="Email"
						value={batch.email}
					/>
				) : null}
				{batch.reference ? (
					<ReportDetailField
						label="Reference"
						value={batch.reference}
						mono
					/>
				) : null}
				<ReportDetailField
					label="Created At"
					value={formatReportDate(batch.created_at)}
				/>
				{batch.completed_at ? (
					<ReportDetailField
						label="Completed At"
						value={formatReportDate(batch.completed_at)}
					/>
				) : null}
				<ReportDetailField
					label="Failed"
					value={
						<BatchCountBadge
							count={batch.failed_count}
							variant="error"
						/>
					}
				/>
				{batch.verification_url ? (
					<ReportDetailField
						label="Verification Link"
						value={
							<a
								href={batch.verification_url}
								target="_blank"
								rel="noreferrer"
								className="break-all text-primary hover:underline"
							>
								{batch.verification_url}
							</a>
						}
						className="sm:col-span-2 lg:col-span-3"
					/>
				) : null}
			</CardContent>
		</Card>
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
