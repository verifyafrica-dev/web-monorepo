import { ArrowClockwiseIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { usePlatformAnalyticsV2Query } from "#/api/http/v2/analytics/analytics.hooks";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import {
	AdminDashboardContent,
	AdminDashboardSkeleton,
} from "./-components/admin-dashboard-content";
import { SendMessageDialog } from "./-components/send-message-dialog";
import {
	getAnalyticsDateRange,
	mapPlatformAnalyticsToDashboardData,
	TIME_RANGE_OPTIONS,
	type TimeRange,
} from "./-data";

export const Route = createFileRoute("/(auth)/_auth_layout/app/")({
	head: () => ({
		meta: [
			{ title: "Dashboard | VerifyAfrica" },
			{ name: "description", content: "View key admin metrics and monitor platform activity at a glance." },
		],
	}),
	component: DashboardPage,
});

function DashboardPage() {
	const [timeRange, setTimeRange] = useState<TimeRange>("30d");
	const [sendMessageOpen, setSendMessageOpen] = useState(false);
	const analyticsDateRange = useMemo(
		() => getAnalyticsDateRange(timeRange),
		[timeRange],
	);
	const platformAnalyticsQuery = usePlatformAnalyticsV2Query(analyticsDateRange);
	const data = useMemo(
		() =>
			platformAnalyticsQuery.data
				? mapPlatformAnalyticsToDashboardData(platformAnalyticsQuery.data)
				: undefined,
		[platformAnalyticsQuery.data],
	);
	const isLoading =
		platformAnalyticsQuery.isPending || platformAnalyticsQuery.isFetching;
	const chartKey = `${timeRange}-${analyticsDateRange.from_date ?? "all"}-${analyticsDateRange.to_date ?? "now"}`;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Admin Dashboard
					</h1>
					<p className="text-sm text-muted-foreground">
						Platform-wide monitoring and analytics
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<Select
						value={timeRange}
						onValueChange={(value) => setTimeRange(value as TimeRange)}
						disabled={isLoading}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TIME_RANGE_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						variant="outline"
						onClick={() => setSendMessageOpen(true)}
					>
						<EnvelopeSimpleIcon weight="bold" />
						Send message
					</Button>
					<Button
						onClick={() => platformAnalyticsQuery.refetch()}
						disabled={isLoading}
					>
						<ArrowClockwiseIcon
							className={isLoading ? "animate-spin" : undefined}
							weight="bold"
						/>
						{isLoading ? "Refreshing..." : "Refresh"}
					</Button>
				</div>
			</div>

			{platformAnalyticsQuery.isError ? (
				<div className="rounded-lg border px-6 py-10 text-center text-sm text-muted-foreground">
					Failed to load platform analytics. Please try again.
				</div>
			) : isLoading && !data ? (
				<AdminDashboardSkeleton />
			) : data ? (
				<AdminDashboardContent data={data} chartKey={chartKey} />
			) : null}

			<SendMessageDialog
				open={sendMessageOpen}
				onOpenChange={setSendMessageOpen}
			/>
		</div>
	);
}
