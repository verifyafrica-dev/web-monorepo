import {
	ListBulletsIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { ActivityLog } from "#/api/http/v2/activity-logs/activity-logs.hooks";
import { useTenantActivityLogsV2Query } from "#/api/http/v2/activity-logs/activity-logs.hooks";
import {
	TablePagination,
	TablePaginationSkeleton,
} from "@verifyafrica/ui/components/ui-extended/table-pagination";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
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
import {
	downloadCsv,
	formatTenantDate,
	matchesActivityLogSearch,
} from "../-data";

const PAGE_SIZE = 20;

const ACTIVITY_LOG_TABLE_COLUMNS = [
	"Timestamp",
	"Action",
	"User",
	"Description",
	"IP Address",
] as const;

function getActivityLogTableHeadClassName(index: number, total: number) {
	if (index === 0) {
		return "pl-4 text-xs font-semibold tracking-wide uppercase sm:pl-6";
	}

	if (index === total - 1) {
		return "pr-4 text-xs font-semibold tracking-wide uppercase sm:pr-6";
	}

	return "text-xs font-semibold tracking-wide uppercase";
}

function getActionBadgeClass(action: string) {
	const normalizedAction = action.toLowerCase();

	if (
		normalizedAction.includes("create") ||
		normalizedAction.includes("approve")
	) {
		return "border-emerald-200 bg-emerald-50 text-emerald-700";
	}

	if (
		normalizedAction.includes("disable") ||
		normalizedAction.includes("reject") ||
		normalizedAction.includes("delete")
	) {
		return "border-red-200 bg-red-50 text-red-700";
	}

	if (
		normalizedAction.includes("update") ||
		normalizedAction.includes("modify") ||
		normalizedAction.includes("edit")
	) {
		return "border-blue-200 bg-blue-50 text-blue-700";
	}

	return "border-muted bg-muted text-muted-foreground";
}

function formatActionLabel(action: string) {
	return action.replaceAll(".", " · ").replaceAll("_", " ");
}

export function ActivityLogsTab({ tenantId }: { tenantId: string }) {
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [actionFilter, setActionFilter] = useState("all");
	const [_isExporting, setIsExporting] = useState(false);
	const debouncedSearch = useDebouncedValue(searchQuery, 300);

	const activityLogsQuery = useTenantActivityLogsV2Query(tenantId, {
		page,
		per_page: PAGE_SIZE,
	});

	useEffect(() => {
		setPage(1);
	}, []);

	const actionOptions = useMemo(() => {
		const actions = new Set<string>();

		for (const log of activityLogsQuery.data?.items ?? []) {
			if (log.action) {
				actions.add(log.action);
			}
		}

		return Array.from(actions).sort();
	}, [activityLogsQuery.data?.items]);

	const filteredLogs = useMemo(() => {
		return (activityLogsQuery.data?.items ?? []).filter((log) => {
			const matchesAction =
				actionFilter === "all" || log.action === actionFilter;

			return matchesAction && matchesActivityLogSearch(log, debouncedSearch);
		});
	}, [actionFilter, activityLogsQuery.data?.items, debouncedSearch]);

	const total = activityLogsQuery.data?.meta.pagination.total ?? 0;
	const isLoading =
		activityLogsQuery.isPending ||
		(activityLogsQuery.isFetching && !activityLogsQuery.data);
	const hasActiveFilters =
		debouncedSearch.trim().length > 0 || actionFilter !== "all";

	const _handleExport = () => {
		if (filteredLogs.length === 0) {
			return;
		}

		setIsExporting(true);

		try {
			downloadCsv(
				`tenant_activity_logs_${tenantId}_${new Date().toISOString().split("T")[0]}.csv`,
				[
					[
						"Timestamp",
						"Action",
						"User",
						"Description",
						"IP Address",
						"User Agent",
					],
					...filteredLogs.map((log) => [
						formatTenantDate(log.created_at),
						log.action,
						log.user_name ?? "Unknown User",
						log.description ?? "",
						log.ip_address ?? "N/A",
						log.user_agent ?? "N/A",
					]),
				],
			);
		} catch {
			toast.error("Failed to export activity logs");
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Card>
			<CardHeader className="gap-4 border-b">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<CardTitle className="font-semibold">Activity Logs</CardTitle>
					{/* <Button
						variant="outline"
						disabled={isExporting || filteredLogs.length === 0}
						onClick={handleExport}
					>
						<DownloadSimpleIcon />
						{isExporting ? "Exporting..." : "Export"}
					</Button> */}
				</div>
				<div className="flex flex-col gap-3 sm:flex-row">
					<div className="relative flex-1">
						<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Search by action, description, user, or IP address..."
							className="pl-9"
							disabled={isLoading}
						/>
					</div>
					<Select
						value={actionFilter}
						onValueChange={setActionFilter}
						disabled={isLoading}
					>
						<SelectTrigger className="w-full sm:w-[220px]">
							<SelectValue placeholder="Action Type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Actions</SelectItem>
							{actionOptions.map((action) => (
								<SelectItem
									key={action}
									value={action}
								>
									{formatActionLabel(action)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent className="gap-0 p-0">
				{isLoading ? (
					<div className="p-4">
						<ActivityLogsTableSkeleton />
						<TablePaginationSkeleton />
					</div>
				) : activityLogsQuery.isError ? (
					<div className="flex min-h-48 items-center justify-center px-6 text-sm text-muted-foreground">
						Failed to load activity logs. Please try again.
					</div>
				) : filteredLogs.length === 0 ? (
					<div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
						<ListBulletsIcon className="size-10 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							{hasActiveFilters
								? "No activity logs match your search or filters"
								: "No activity logs found for this tenant"}
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										{ACTIVITY_LOG_TABLE_COLUMNS.map((column, index) => (
											<TableHead
												key={column}
												className={getActivityLogTableHeadClassName(
													index,
													ACTIVITY_LOG_TABLE_COLUMNS.length,
												)}
											>
												{column}
											</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredLogs.map((log) => (
										<ActivityLogRow
											key={log.id}
											log={log}
										/>
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
	);
}

function ActivityLogRow({ log }: { log: ActivityLog }) {
	return (
		<TableRow>
			<TableCell className="pl-4 sm:pl-6">
				{formatTenantDate(log.created_at)}
			</TableCell>
			<TableCell>
				<Badge
					variant="outline"
					className={getActionBadgeClass(log.action)}
				>
					{formatActionLabel(log.action)}
				</Badge>
			</TableCell>
			<TableCell>{log.user_name ?? "Unknown User"}</TableCell>
			<TableCell
				className="max-w-md truncate"
				title={log.description}
			>
				{log.description}
			</TableCell>
			<TableCell className="pr-4 sm:pr-6">{log.ip_address ?? "-"}</TableCell>
		</TableRow>
	);
}

function ActivityLogsTableSkeleton() {
	return (
		<div className="space-y-3">
			{createSkeletonKeys(5, "tenant-activity-log-row").map((key) => (
				<div
					key={key}
					className="flex items-center gap-4 px-2"
				>
					<Skeleton className="h-4 w-36" />
					<Skeleton className="h-6 w-28" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 flex-1" />
					<Skeleton className="h-4 w-24" />
				</div>
			))}
		</div>
	);
}
