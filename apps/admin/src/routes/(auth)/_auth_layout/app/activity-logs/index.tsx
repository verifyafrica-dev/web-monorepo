import {
	ListBulletsIcon,
	MagnifyingGlassIcon,
	XIcon,
} from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import type { ActivityLog } from "#/api/http/v2/activity-logs/activity-logs.hooks";
import { useAllActivityLogsV2Query } from "#/api/http/v2/activity-logs/activity-logs.hooks";
import { useUserV2DetailQuery } from "#/api/http/v2/users/users.hooks";
import {
	TablePagination,
	TablePaginationSkeleton,
} from "#/components/table-pagination";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
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
import { useDebouncedValue } from "#/hooks/use-debounced-value";
import { createSkeletonKeys } from "#/lib/skeleton-keys";
import { formatTenantDate } from "../tenants/-data";
import { getUserDisplayName } from "../users/-data";
import {
	exportActivityLogsCsv,
	formatActionLabel,
	getActionBadgeClass,
	matchesActivityLogSearch,
} from "./-data";

const PAGE_SIZE = 20;

const ACTIVITY_LOG_TABLE_COLUMNS = [
	"Timestamp",
	"Action",
	"User",
	"Tenant",
	"Description",
	"IP Address",
] as const;

const activityLogsSearchSchema = z.object({
	user: z.string().uuid().optional(),
});

export const Route = createFileRoute("/(auth)/_auth_layout/app/activity-logs/")(
	{
		head: () => ({
			meta: [
				{ title: "Activity Logs | VerifyAfrica" },
				{
					name: "description",
					content: "Audit actions and system events across the admin platform.",
				},
			],
		}),
		validateSearch: activityLogsSearchSchema,
		component: ActivityLogsPage,
	},
);

function getActivityLogTableHeadClassName(index: number, total: number) {
	if (index === 0) {
		return "pl-4 text-xs font-semibold tracking-wide uppercase sm:pl-6";
	}

	if (index === total - 1) {
		return "pr-4 text-xs font-semibold tracking-wide uppercase sm:pr-6";
	}

	return "text-xs font-semibold tracking-wide uppercase";
}

function ActivityLogsPage() {
	const navigate = useNavigate();
	const { user: userId } = Route.useSearch();

	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [actionFilter, setActionFilter] = useState("all");
	const [_isExporting, setIsExporting] = useState(false);
	const debouncedSearch = useDebouncedValue(searchQuery, 300);

	const filteredUserQuery = useUserV2DetailQuery(userId ?? "");

	const activityLogsQuery = useAllActivityLogsV2Query({
		page,
		per_page: PAGE_SIZE,
		user: userId,
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
		debouncedSearch.trim().length > 0 ||
		actionFilter !== "all" ||
		Boolean(userId);

	const filteredUserLabel = userId
		? filteredUserQuery.data
			? (getUserDisplayName(filteredUserQuery.data) ??
				filteredUserQuery.data.email)
			: "Selected user"
		: null;

	const _handleExport = () => {
		if (filteredLogs.length === 0) {
			return;
		}

		setIsExporting(true);

		try {
			exportActivityLogsCsv(
				filteredLogs,
				userId ? `user_activity_logs_${userId}` : "activity_logs",
			);
		} catch {
			toast.error("Failed to export activity logs");
		} finally {
			setIsExporting(false);
		}
	};

	const handleClearUserFilter = () => {
		void navigate({
			to: "/app/activity-logs",
			search: {},
		});
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">Activity Logs</h1>
				<p className="text-sm text-muted-foreground">
					Audit platform activity for support and compliance workflows.
				</p>
			</div>

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

					{userId ? (
						<div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
							<p className="text-sm">
								Showing activity for{" "}
								<span className="font-medium capitalize">
									{filteredUserLabel}
								</span>
							</p>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleClearUserFilter}
							>
								<XIcon />
								Clear filter
							</Button>
						</div>
					) : null}

					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="relative flex-1">
							<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								placeholder="Search by action, description, user, tenant, or IP address..."
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
									: "No activity logs found"}
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
		</div>
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
			<TableCell>{log.tenant_name ?? "N/A"}</TableCell>
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
			{createSkeletonKeys(5, "activity-log-row").map((key) => (
				<div
					key={key}
					className="flex items-center gap-4 px-2"
				>
					<Skeleton className="h-4 w-36" />
					<Skeleton className="h-6 w-28" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 flex-1" />
					<Skeleton className="h-4 w-24" />
				</div>
			))}
		</div>
	);
}
