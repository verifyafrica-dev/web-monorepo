import { ArrowLeftIcon, EyeIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";

import {
	useMixedVerificationDetailV2Query,
	useMixedVerificationsAvailabilityV2Query,
	useTenantVerificationBatchesV2Query,
	VERIFICATIONS_V2_QUERY_KEYS,
} from "#/api/http/v2/verifications/verifications.hooks";
import { TablePagination } from "@verifyafrica/ui/components/ui-extended/table-pagination";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { useDebouncedValue } from "@verifyafrica/ui/hooks/use-debounced-value";
import { cn } from "@verifyafrica/ui/lib/utils";
import { CustomVerificationDialog } from "../../../products/mixed-verifications/-components/custom-verification-dialog";
import { useCurrentTenant } from "../../../team/-data";
import {
	type BatchVerificationReport,
	formatReportDate,
	mapVerificationBatchesToReports,
	REPORTS_PAGE_SIZE,
} from "../../-data";
import {
	buildReportsListQuery,
	getBatchFiltersFromSearch,
	mergeReportsSearchParams,
	REPORTS_VERIFICATION_STATUSES,
	type ReportsFiltersFormValues,
	type ReportsSearchParams,
	reportsSearchSchema,
} from "../../-filter-utils";
import { ClickableTableRow } from "../../-components/clickable-table-row";
import { ReportsFiltersForm } from "../../-components/reports-filters-form";
import { ReportsTableShell } from "../../-components/reports-table-shell";
import {
	ReportsPaginationSkeleton,
	ReportsTableSkeleton,
} from "../../-components/reports-table-skeleton";
import {
	BatchCountBadge,
	VerificationStatusBadge,
} from "../../-components/verification-badges";

const customReportSearchSchema = reportsSearchSchema.pick({
	batch_search: true,
	status: true,
	batch_page: true,
});

type CustomReportSearchParams = z.infer<typeof customReportSearchSchema>;

const COLUMNS = [
	"ID",
	"Status",
	"Total Count",
	"Success",
	"Failed",
	"Created At",
	"Actions",
];

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/reports/custom/$templateId/",
)({
	head: () => ({
		meta: [
			{ title: "Custom Verification Reports | VerifyAfrica" },
			{
				name: "description",
				content: "View batch verifications for a custom verification template.",
			},
		],
	}),
	validateSearch: customReportSearchSchema,
	component: CustomVerificationReportsPage,
});

function CustomVerificationReportsPage() {
	const queryClient = useQueryClient();
	const { templateId } = Route.useParams();
	const searchParams = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const { tenantId, isTenantAdmin } = useCurrentTenant();
	const page = searchParams.batch_page ?? 1;
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	const [searchDraft, setSearchDraft] = useState(
		searchParams.batch_search ?? "",
	);
	const debouncedSearch = useDebouncedValue(searchDraft);

	const templateQuery = useMixedVerificationDetailV2Query(
		templateId,
		Boolean(templateId),
	);
	const availabilityQuery = useMixedVerificationsAvailabilityV2Query(
		tenantId,
		Boolean(tenantId),
	);
	const canEditTemplate = Boolean(
		isTenantAdmin && tenantId && templateQuery.data?.is_custom,
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

	const updateSearchParams = useCallback(
		(patch: Partial<CustomReportSearchParams>) => {
			void navigate({
				search: (current) =>
					mergeReportsSearchParams(
						current as ReportsSearchParams,
						patch,
					) as CustomReportSearchParams,
				replace: true,
			});
		},
		[navigate],
	);

	useEffect(() => {
		setSearchDraft(searchParams.batch_search ?? "");
	}, [searchParams.batch_search]);

	useEffect(() => {
		const nextSearch = debouncedSearch.trim();
		const currentSearch = (searchParams.batch_search ?? "").trim();

		if (nextSearch === currentSearch) {
			return;
		}

		updateSearchParams({
			batch_search: nextSearch || undefined,
			batch_page: undefined,
		});
	}, [debouncedSearch, searchParams.batch_search, updateSearchParams]);

	const filters = useMemo(
		() =>
			getBatchFiltersFromSearch(
				searchParams as ReportsSearchParams,
				searchDraft,
			),
		[searchParams, searchDraft],
	);

	const queryParams = useMemo(() => {
		const base = buildReportsListQuery(
			{
				...filters,
				search: debouncedSearch,
			},
			{
				page,
				perPage: REPORTS_PAGE_SIZE,
				scope: "batches",
			},
		);
		return {
			...base,
			template_id: templateId,
		};
	}, [filters, debouncedSearch, page, templateId]);

	const batchesQuery = useTenantVerificationBatchesV2Query(
		tenantId,
		queryParams,
		Boolean(tenantId) && Boolean(templateId),
	);

	const batches = useMemo(
		() => mapVerificationBatchesToReports(batchesQuery.data?.items ?? []),
		[batchesQuery.data?.items],
	);

	const total = batchesQuery.data?.meta.pagination.total ?? 0;
	const templateName =
		templateQuery.data?.name?.trim() || "Custom verification";

	const templateSuccessRate = useMemo(() => {
		const rate = batchesQuery.data?.meta.success_rate;
		if (rate === null || rate === undefined) {
			return null;
		}
		return Number(rate).toFixed(1);
	}, [batchesQuery.data?.meta.success_rate]);

	const handleFiltersChange = useCallback(
		(values: ReportsFiltersFormValues) => {
			setSearchDraft(values.search);
			updateSearchParams({
				status: values.status === "all" ? undefined : values.status,
				batch_page: undefined,
			});
		},
		[updateSearchParams],
	);

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
						Back to Custom Verifications
					</Link>
				</Button>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-1">
						<h1 className="text-2xl font-semibold tracking-tight">
							{templateName}
						</h1>
						<p className="text-sm text-muted-foreground">
							Batch verifications started from this custom verification.
						</p>
						{templateId ? (
							<p className="font-mono text-xs text-muted-foreground">
								{templateId}
							</p>
						) : null}
						{templateSuccessRate !== null ? (
							<div className="flex items-center gap-2 pt-1">
								<span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Success rate
								</span>
								<span className="text-sm font-semibold tabular-nums">
									{templateSuccessRate}%
								</span>
								<div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
									<div
										className={cn(
											"h-full rounded-full",
											Number(templateSuccessRate) >= 80
												? "bg-emerald-500"
												: Number(templateSuccessRate) >= 50
													? "bg-amber-500"
													: "bg-red-500",
										)}
										style={{ width: `${templateSuccessRate}%` }}
									/>
								</div>
							</div>
						) : null}
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

			{!tenantId ? (
				<div className="flex min-h-[320px] items-center justify-center px-6 text-sm text-muted-foreground">
					Tenant information is unavailable.
				</div>
			) : (
				<div className="flex min-w-0 flex-col gap-6">
					<ReportsFiltersForm
						scope="batches"
						values={filters}
						statuses={REPORTS_VERIFICATION_STATUSES}
						totalCount={total}
						filteredCount={total}
						disabled={batchesQuery.isPending}
						onChange={handleFiltersChange}
					/>

					{batchesQuery.isPending ? (
						<>
							<ReportsTableSkeleton columns={COLUMNS} />
							<ReportsPaginationSkeleton />
						</>
					) : batchesQuery.isError ? (
						<div className="flex min-h-[320px] items-center justify-center px-6 text-sm text-muted-foreground">
							Failed to load batch verifications. Please try again.
						</div>
					) : (
						<>
							<ReportsTableShell>
								<Table className="w-max! min-w-full">
									<TableHeader>
										<TableRow className="bg-muted/40 hover:bg-muted/40">
											{COLUMNS.map((column, index) => (
												<TableHead
													key={column}
													className={cn(
														"text-xs font-semibold tracking-wide uppercase",
														index === 0 && "pl-4 sm:pl-6",
														index === COLUMNS.length - 1 &&
															"pr-4 text-center sm:pr-6",
													)}
												>
													{column}
												</TableHead>
											))}
										</TableRow>
									</TableHeader>
									<TableBody>
										{batches.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={COLUMNS.length}
													className="h-24 text-center text-sm text-muted-foreground"
												>
													{total === 0
														? "No batch verifications found for this custom verification."
														: "No batch verifications match your search or filters."}
												</TableCell>
											</TableRow>
										) : (
											batches.map((batch) => (
												<TemplateBatchRow key={batch.id} batch={batch} />
											))
										)}
									</TableBody>
								</Table>
							</ReportsTableShell>
							<TablePagination
								page={page}
								pageSize={REPORTS_PAGE_SIZE}
								total={total}
								onPageChange={(nextPage) =>
									updateSearchParams({ batch_page: nextPage })
								}
							/>
						</>
					)}
				</div>
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

function TemplateBatchRow({ batch }: { batch: BatchVerificationReport }) {
	const displayName = batch.name?.trim() || "Mixed verification";

	return (
		<ClickableTableRow href={`/app/reports/batch/${batch.id}`}>
			<TableCell className="pl-4 sm:pl-6">
				<div className="min-w-0 space-y-0.5">
					<Link
						to="/app/reports/batch/$batchId"
						params={{ batchId: batch.id }}
						className="block max-w-[15ch] truncate font-mono text-xs hover:underline"
					>
						{batch.id}
					</Link>
					<p className="hidden truncate text-sm font-medium">{displayName}</p>
				</div>
			</TableCell>
			<TableCell>
				<VerificationStatusBadge status={batch.status} />
			</TableCell>
			<TableCell className="text-sm font-medium tabular-nums">
				{batch.total_count}
			</TableCell>
			<TableCell>
				<BatchCountBadge
					count={batch.success_count}
					variant="success"
				/>
			</TableCell>
			<TableCell>
				<BatchCountBadge
					count={batch.failed_count}
					variant="error"
				/>
			</TableCell>
			<TableCell className="text-sm text-muted-foreground">
				{formatReportDate(batch.created_at)}
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
						to="/app/reports/batch/$batchId"
						params={{ batchId: batch.id }}
					>
						<EyeIcon className="size-4" />
						View
					</Link>
				</Button>
			</TableCell>
		</ClickableTableRow>
	);
}
