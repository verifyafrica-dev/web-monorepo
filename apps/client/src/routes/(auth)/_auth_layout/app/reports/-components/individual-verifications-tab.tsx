import { EyeIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useTenantVerificationRequestsV2Query } from "#/api/http/v2/verifications/verifications.hooks";
import { TablePagination } from "@verifyafrica/ui/components/ui-extended/table-pagination";
import { TypeBadge } from "@verifyafrica/ui/components/ui-extended/type-badge";
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
	formatReportDate,
	formatVerificationType,
	mapVerificationRequestsToReports,
	REPORTS_PAGE_SIZE,
	type VerificationReport,
} from "../-data";
import {
	buildReportsListQuery,
	getIndividualFiltersFromSearch,
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
import { VerificationStatusBadge } from "./verification-badges";

const COLUMNS = [
	"ID",
	"Batch ID",
	"Type",
	"Status",
	"Name",
	"Date",
	"Cost",
	"Actions",
];

type IndividualVerificationsTabProps = {
	tenantId: string;
	searchParams: ReportsSearchParams;
	countries: string[];
	updateSearchParams: (patch: Partial<ReportsSearchParams>) => void;
};

export function IndividualVerificationsTab({
	tenantId,
	searchParams,
	countries,
	updateSearchParams,
}: IndividualVerificationsTabProps) {
	const page = searchParams.page ?? 1;
	const [searchDraft, setSearchDraft] = useState(searchParams.search ?? "");
	const debouncedSearch = useDebouncedValue(searchDraft);

	useEffect(() => {
		setSearchDraft(searchParams.search ?? "");
	}, [searchParams.search]);

	useEffect(() => {
		const nextSearch = debouncedSearch.trim();
		const currentSearch = (searchParams.search ?? "").trim();

		if (nextSearch === currentSearch) {
			return;
		}

		updateSearchParams({
			search: nextSearch || undefined,
			page: undefined,
		});
	}, [debouncedSearch, searchParams.search, updateSearchParams]);

	const filters = useMemo(
		() => getIndividualFiltersFromSearch(searchParams, searchDraft),
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
				scope: "requests",
			}),
		[queryFilters, page],
	);

	const verificationRequestsQuery = useTenantVerificationRequestsV2Query(
		tenantId,
		queryParams,
		Boolean(tenantId),
	);

	const verifications = useMemo(
		() =>
			mapVerificationRequestsToReports(
				verificationRequestsQuery.data?.items ?? [],
			),
		[verificationRequestsQuery.data?.items],
	);

	const total = verificationRequestsQuery.data?.meta.pagination.total ?? 0;

	const handleFiltersChange = useCallback(
		(values: ReportsFiltersFormValues) => {
			setSearchDraft(values.search);
			updateSearchParams({
				tab: "individual",
				verification_type:
					values.verificationType === "all"
						? undefined
						: values.verificationType,
				status: values.status === "all" ? undefined : values.status,
				country: values.country === "all" ? undefined : values.country,
				page: undefined,
			});
		},
		[updateSearchParams],
	);

	return (
		<div className="flex min-w-0 flex-col gap-6">
			<ReportsFiltersForm
				scope="requests"
				values={filters}
				verificationTypes={REPORTS_VERIFICATION_TYPES}
				statuses={REPORTS_VERIFICATION_STATUSES}
				countries={countries}
				totalCount={total}
				filteredCount={total}
				disabled={verificationRequestsQuery.isPending}
				onChange={handleFiltersChange}
			/>

			{verificationRequestsQuery.isPending ? (
				<>
					<ReportsTableSkeleton columns={COLUMNS} />
					<ReportsPaginationSkeleton />
				</>
			) : verificationRequestsQuery.isError ? (
				<div className="flex min-h-80 items-center justify-center px-6 text-sm text-muted-foreground">
					Failed to load verifications. Please try again.
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
								{verifications.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={COLUMNS.length}
											className="h-24 text-center text-sm text-muted-foreground"
										>
											{total === 0
												? "No verifications found. Start by creating your first verification."
												: "No verifications match your search or filters."}
										</TableCell>
									</TableRow>
								) : (
									verifications.map((verification) => (
										<IndividualVerificationRow
											key={verification.id}
											verification={verification}
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
						onPageChange={(nextPage) => updateSearchParams({ page: nextPage })}
					/>
				</>
			)}
		</div>
	);
}

function IndividualVerificationRow({
	verification,
}: {
	verification: VerificationReport;
}) {
	return (
		<TableRow className="cursor-pointer">
			<TableCell className="pl-4 font-mono text-xs sm:pl-6">
				<Link
					to="/app/reports/$id"
					params={{ id: verification.id }}
					className="block truncate max-w-[15ch] hover:underline"
				>
					{verification.id}
				</Link>
			</TableCell>
			<TableCell className="font-mono text-xs">
				<p className="truncate max-w-[15ch]">
					{verification.batch_id ?? "N/A"}
				</p>
			</TableCell>
			<TableCell>
				<TypeBadge label={formatVerificationType(verification)} />
			</TableCell>
			<TableCell>
				<VerificationStatusBadge status={verification.status} />
			</TableCell>
			<TableCell className="text-sm">{verification.name}</TableCell>
			<TableCell className="text-sm text-muted-foreground">
				{formatReportDate(verification.created_at)}
			</TableCell>
			<TableCell className="text-sm font-medium tabular-nums">
				{verification.currency} {verification.cost_charged}
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
	);
}
