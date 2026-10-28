import { EyeIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { useTenantMixedVerificationsV2Query } from "#/api/http/v2/verifications/verifications.hooks";
import type {
	MixedVerification,
	MixedVerificationSteps,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { TablePagination } from "@verifyafrica/ui/components/ui-extended/table-pagination";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { cn } from "@verifyafrica/ui/lib/utils";
import { formatReportDate, REPORTS_PAGE_SIZE } from "../-data";
import type { ReportsSearchParams } from "../-filter-utils";
import { ClickableTableRow } from "./clickable-table-row";
import { ReportsTableShell } from "./reports-table-shell";
import {
	ReportsPaginationSkeleton,
	ReportsTableSkeleton,
} from "./reports-table-skeleton";

const COLUMNS = ["ID", "Name", "Status", "Steps", "Created At", "Actions"];

type BatchVerificationsTabProps = {
	tenantId: string;
	searchParams: ReportsSearchParams;
	updateSearchParams: (patch: Partial<ReportsSearchParams>) => void;
};

export function BatchVerificationsTab({
	tenantId,
	searchParams,
	updateSearchParams,
}: BatchVerificationsTabProps) {
	const page = searchParams.batch_page ?? 1;

	const templatesQuery = useTenantMixedVerificationsV2Query(
		tenantId,
		{
			page,
			per_page: REPORTS_PAGE_SIZE,
			is_custom: true,
		},
		Boolean(tenantId),
	);

	const templates = templatesQuery.data?.items ?? [];
	const total = templatesQuery.data?.meta.pagination.total ?? 0;

	return (
		<div className="flex min-w-0 flex-col gap-6">
			{templatesQuery.isPending ? (
				<>
					<ReportsTableSkeleton columns={COLUMNS} />
					<ReportsPaginationSkeleton />
				</>
			) : templatesQuery.isError ? (
				<div className="flex min-h-[320px] items-center justify-center px-6 text-sm text-muted-foreground">
					Failed to load custom verifications. Please try again.
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
								{templates.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={COLUMNS.length}
											className="h-24 text-center text-sm text-muted-foreground"
										>
											No custom verifications found.
										</TableCell>
									</TableRow>
								) : (
									templates.map((template) => (
										<CustomVerificationRow
											key={template.id}
											template={template}
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

function CustomVerificationRow({ template }: { template: MixedVerification }) {
	const stepsPayload = template.steps as MixedVerificationSteps | undefined;
	const stepsMap = stepsPayload?.steps;
	const stepCount =
		stepsMap && typeof stepsMap === "object"
			? Object.keys(stepsMap).length
			: Array.isArray(template.verifications)
				? template.verifications.length
				: 0;

	return (
		<ClickableTableRow href={`/app/reports/custom/${template.id}`}>
			<TableCell className="pl-4 font-mono text-xs sm:pl-6">
				<Link
					to="/app/reports/custom/$templateId"
					params={{ templateId: template.id }}
					className="block max-w-[15ch] truncate hover:underline"
				>
					{template.id}
				</Link>
			</TableCell>
			<TableCell>
				<div className="min-w-0 space-y-0.5">
					<p className="truncate text-sm font-medium">{template.name}</p>
					{template.description?.trim() ? (
						<p className="max-w-[36ch] truncate text-xs text-muted-foreground">
							{template.description}
						</p>
					) : null}
				</div>
			</TableCell>
			<TableCell>
				<Badge variant={template.is_active ? "default" : "outline"}>
					{template.is_active ? "Active" : "Inactive"}
				</Badge>
			</TableCell>
			<TableCell className="text-sm font-medium tabular-nums">
				{stepCount}
			</TableCell>
			<TableCell className="text-sm text-muted-foreground">
				{template.created_at ? formatReportDate(template.created_at) : "—"}
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
						to="/app/reports/custom/$templateId"
						params={{ templateId: template.id }}
					>
						<EyeIcon className="size-4" />
						View
					</Link>
				</Button>
			</TableCell>
		</ClickableTableRow>
	);
}
