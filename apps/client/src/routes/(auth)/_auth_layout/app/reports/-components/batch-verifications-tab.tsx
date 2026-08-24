import { EyeIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useTenantVerificationBatchesV2Query } from "#/api/http/v2/verifications/verifications.hooks";
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
import {
	type BatchVerificationReport,
	formatReportDate,
	mapVerificationBatchesToReports,
	REPORTS_PAGE_SIZE,
} from "../-data";
import {
	buildReportsListQuery,
	getBatchFiltersFromSearch,
	REPORTS_VERIFICATION_STATUSES,
	REPORTS_VERIFICATION_TYPES,
	type ReportsFiltersFormValues,
	type ReportsSearchParams,
} from "../-filter-utils";
import { ReportsFiltersForm } from "./reports-filters-form";
import { ReportsTableShell } from "./reports-table-shell";
import {
	ReportsPaginationSkeleton,
	ReportsTableSkeleton,
} from "./reports-table-skeleton";
import {
	BatchCountBadge,
	VerificationStatusBadge,
} from "./verification-badges";

const COLUMNS = [
	"Batch ID",
	"Status",
	"Total Count",
	"Success",
	"Failed",
	"Success Rate",
	"Created At",
	"Actions",
];

type BatchVerificationsTabProps = {
	tenantId: string;
	searchParams: ReportsSearchParams;
	countries: string[];
	updateSearchParams: (patch: Partial<ReportsSearchParams>) => void;
};

export function BatchVerificationsTab({
	tenantId,
	searchParams,
	countries,
	updateSearchParams,
}: BatchVerificationsTabProps) {
	const page = searchParams.batch_page ?? 1;
	const [searchDraft, setSearchDraft] = useState(
		searchParams.batch_search ?? "",
	);
	const debouncedSearch = useDebouncedValue(searchDraft);

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
		() => getBatchFiltersFromSearch(searchParams, searchDraft),
		[searchParams, searchDraft],
	);

	const queryFilters = useMemo(
		() => ({
			...filters,
			search: debouncedSearch,
		}),
		[filters, debouncedSearch],
	);

	const queryParams = useMemo(
		() =>
			buildReportsListQuery(queryFilters, {
				page,
				perPage: REPORTS_PAGE_SIZE,
				scope: "batches",
			}),
		[queryFilters, page],
	);

	const verificationBatchesQuery = useTenantVerificationBatchesV2Query(
		tenantId,
		queryParams,
		Boolean(tenantId),
	);

	const batchVerifications = useMemo(
		() =>
			mapVerificationBatchesToReports(
				verificationBatchesQuery.data?.items ?? [],
			),
		[verificationBatchesQuery.data?.items],
	);

	const total = verificationBatchesQuery.data?.meta.pagination.total ?? 0;

	const handleFiltersChange = useCallback(
		(values: ReportsFiltersFormValues) => {
			setSearchDraft(values.search);
			updateSearchParams({
				tab: "batch",
				status: values.status === "all" ? undefined : values.status,
				batch_page: undefined,
			});
		},
		[updateSearchParams],
	);

	return (
		<div className="flex min-w-0 flex-col gap-6">
			<ReportsFiltersForm
				scope="batches"
				values={filters}
				verificationTypes={REPORTS_VERIFICATION_TYPES}
				statuses={REPORTS_VERIFICATION_STATUSES}
				countries={countries}
				totalCount={total}
				filteredCount={total}
				disabled={verificationBatchesQuery.isPending}
				onChange={handleFiltersChange}
			/>

			{verificationBatchesQuery.isPending ? (
				<>
					<ReportsTableSkeleton columns={COLUMNS} />
					<ReportsPaginationSkeleton />
				</>
			) : verificationBatchesQuery.isError ? (
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
								{batchVerifications.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={COLUMNS.length}
											className="h-24 text-center text-sm text-muted-foreground"
										>
											{total === 0
												? "No batch verifications found."
												: "No batch verifications match your search or filters."}
										</TableCell>
									</TableRow>
								) : (
									batchVerifications.map((batch) => (
										<BatchVerificationRow
											key={batch.id}
											batch={batch}
										/>
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
	);
}

function BatchVerificationRow({ batch }: { batch: BatchVerificationReport }) {
	const successRate =
		batch.total_count > 0
			? ((batch.success_count / batch.total_count) * 100).toFixed(1)
			: "0";

	return (
		<TableRow className="cursor-pointer">
			<TableCell className="pl-4 font-mono text-xs sm:pl-6">
				<Link
					to="/app/reports/batch/$batchId"
					params={{ batchId: batch.id }}
					className="block truncate max-w-[15ch] hover:underline"
				>
					{batch.id}
				</Link>
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
			<TableCell>
				<div className="flex items-center gap-2 whitespace-nowrap">
					<span className="text-sm font-medium tabular-nums">
						{successRate}%
					</span>
					<div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
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
		</TableRow>
	);
}
