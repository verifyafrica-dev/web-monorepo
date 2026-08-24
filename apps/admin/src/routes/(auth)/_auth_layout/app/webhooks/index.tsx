import {
	ArrowClockwiseIcon,
	CaretDownIcon,
	CaretRightIcon,
	FunnelIcon,
	MagnifyingGlassIcon,
	WebhooksLogoIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import type { WebhookEvent } from "#/api/http/v2/webhooks/webhooks.hooks";
import { useAllWebhookEventsV2Query } from "#/api/http/v2/webhooks/webhooks.hooks";
import { DateFilterPicker } from "@verifyafrica/ui/components/ui-extended/date-filter-picker";
import {
	TablePagination,
	TablePaginationSkeleton,
} from "@verifyafrica/ui/components/ui-extended/table-pagination";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
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
import { useDebouncedValue } from "@verifyafrica/ui/hooks/use-debounced-value";
import { cn } from "@verifyafrica/ui/lib/utils";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import {
	buildWebhookEventsListQuery,
	formatWebhookEventData,
	formatWebhookEventDate,
	getWebhookSourceBadgeClass,
	hasActiveWebhookFilters,
	WEBHOOK_EVENTS_PAGE_SIZE,
} from "./-data";
import { WebhookEndpointCard } from "./-components/webhook-endpoint-card";

const WEBHOOK_TABLE_COLUMNS = ["", "Event ID", "Source", "Created Date"] as const;

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/webhooks/",
)({
	head: () => ({
		meta: [
			{ title: "Webhooks | VerifyAfrica" },
			{ name: "description", content: "Monitor webhook delivery events and integration status." },
		],
	}),
	component: WebhooksPage,
});

function WebhooksPage() {
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
	const debouncedSearch = useDebouncedValue(searchQuery, 300);

	const webhookEventsListQuery = useMemo(
		() =>
			buildWebhookEventsListQuery({
				page,
				perPage: WEBHOOK_EVENTS_PAGE_SIZE,
				search: debouncedSearch,
				dateFrom,
				dateTo,
			}),
		[page, debouncedSearch, dateFrom, dateTo],
	);

	const webhookEventsQuery = useAllWebhookEventsV2Query(webhookEventsListQuery);

	useEffect(() => {
		setPage(1);
	}, []);

	const events = webhookEventsQuery.data?.items ?? [];
	const total = webhookEventsQuery.data?.meta.pagination.total ?? 0;
	const isLoading =
		webhookEventsQuery.isPending ||
		(webhookEventsQuery.isFetching && !webhookEventsQuery.data);
	const isRefreshing = webhookEventsQuery.isFetching;
	const hasActiveFilters = hasActiveWebhookFilters({
		search: debouncedSearch,
		dateFrom,
		dateTo,
	});

	const toggleRowExpansion = (eventId: string) => {
		setExpandedRows((current) => {
			const next = new Set(current);
			if (next.has(eventId)) {
				next.delete(eventId);
			} else {
				next.add(eventId);
			}
			return next;
		});
	};

	const handleRefresh = () => {
		void webhookEventsQuery.refetch();
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Webhook Events
					</h1>
					<p className="text-sm text-muted-foreground">
						Monitor inbound webhook payloads from external providers.
					</p>
				</div>
				<div className="w-full max-w-xl">
					<WebhookEndpointCard />
				</div>
			</div>

			<Card className="gap-0 py-0">
				<div className="border-b p-4 sm:p-6">
					<div className="relative">
						<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Search by source, event data, or ID..."
							className="pl-9"
							disabled={isLoading}
						/>
					</div>
				</div>

				<div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-start sm:px-6">
					<div className="flex items-center gap-2 pt-2">
						<FunnelIcon className="size-4 text-muted-foreground" />
						<span className="text-sm font-medium">Filters:</span>
					</div>

					<div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
						<DateFilterPicker
							id="webhooks-date-from"
							label="Date from"
							value={dateFrom}
							onChange={setDateFrom}
							disabled={isLoading}
							max={dateTo || undefined}
							placeholder="Start date"
						/>
						<DateFilterPicker
							id="webhooks-date-to"
							label="Date to"
							value={dateTo}
							onChange={setDateTo}
							disabled={isLoading}
							min={dateFrom || undefined}
							placeholder="End date"
						/>
						<div className="flex items-end">
							<Button
								variant="outline"
								className="w-full"
								onClick={handleRefresh}
								disabled={isRefreshing}
							>
								<ArrowClockwiseIcon
									className={isRefreshing ? "animate-spin" : undefined}
									weight="bold"
								/>
								Refresh
							</Button>
						</div>
					</div>
				</div>

				<CardContent className="gap-0 p-0">
					{isLoading ? (
						<div className="p-4">
							<WebhooksTableSkeleton />
							<TablePaginationSkeleton />
						</div>
					) : webhookEventsQuery.isError ? (
						<div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
							<p className="text-sm text-muted-foreground">
								Failed to load webhook events. Please try again.
							</p>
							<Button onClick={handleRefresh}>Try Again</Button>
						</div>
					) : events.length === 0 ? (
						<div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
							<WebhooksLogoIcon className="size-10 text-muted-foreground" />
							<p className="text-sm text-muted-foreground">
								{hasActiveFilters
									? "No webhook events match your search or filters"
									: "No webhook events available"}
							</p>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="hover:bg-transparent">
											{WEBHOOK_TABLE_COLUMNS.map((column) => (
												<TableHead
													key={column || "expand"}
													className={cn(
														"text-xs font-semibold tracking-wide uppercase",
														column === "" && "w-12 pl-4 sm:pl-6",
														column === "Event ID" && "min-w-[280px]",
														column === "Created Date" &&
															"pr-4 sm:pr-6",
													)}
												>
													{column}
												</TableHead>
											))}
										</TableRow>
									</TableHeader>
									<TableBody>
										{events.map((event) => (
											<WebhookEventRow
												key={event.id}
												event={event}
												isExpanded={expandedRows.has(event.id)}
												onToggle={() => toggleRowExpansion(event.id)}
											/>
										))}
									</TableBody>
								</Table>
							</div>
							<TablePagination
								page={page}
								pageSize={WEBHOOK_EVENTS_PAGE_SIZE}
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

function WebhookEventRow({
	event,
	isExpanded,
	onToggle,
}: {
	event: WebhookEvent;
	isExpanded: boolean;
	onToggle: () => void;
}) {
	return (
		<Fragment>
			<TableRow className="cursor-pointer" onClick={onToggle}>
				<TableCell className="w-12 pl-4 sm:pl-6">
					{isExpanded ? (
						<CaretDownIcon className="size-4 text-muted-foreground" />
					) : (
						<CaretRightIcon className="size-4 text-muted-foreground" />
					)}
				</TableCell>
				<TableCell className="font-mono text-xs break-all">
					{event.id}
				</TableCell>
				<TableCell>
					<Badge
						variant="outline"
						className={getWebhookSourceBadgeClass(event.source)}
					>
						{event.source}
					</Badge>
				</TableCell>
				<TableCell className="pr-4 text-sm sm:pr-6">
					{formatWebhookEventDate(event.created_at)}
				</TableCell>
			</TableRow>
			{isExpanded ? (
				<TableRow className="hover:bg-transparent">
					<TableCell
						colSpan={WEBHOOK_TABLE_COLUMNS.length}
						className="bg-muted/20 p-0"
					>
						<div className="border-b px-4 py-4 sm:px-6">
							<p className="mb-2 text-sm font-semibold">Event Data</p>
							<pre className="overflow-x-auto rounded-lg border bg-background p-4 font-mono text-xs">
								{formatWebhookEventData(event)}
							</pre>
						</div>
					</TableCell>
				</TableRow>
			) : null}
		</Fragment>
	);
}

function WebhooksTableSkeleton() {
	return (
		<div className="space-y-3">
			{createSkeletonKeys(5, "webhook-row").map((key) => (
				<Skeleton key={key} className="h-12 rounded-lg" />
			))}
		</div>
	);
}
