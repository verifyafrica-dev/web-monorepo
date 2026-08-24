import {
	ActivityIcon,
	ArrowClockwiseIcon,
	ArrowsCounterClockwiseIcon,
	CheckCircleIcon,
	CreditCardIcon,
	LightningIcon,
	TrendUpIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from "recharts";
import { useTenantAnalyticsV2Query } from "#/api/http/v2/analytics/analytics.hooks";
import { useTenantV2DetailQuery } from "#/api/http/v2/tenants/tenants.hooks";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@verifyafrica/ui/components/ui/chart";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { cn } from "@verifyafrica/ui/lib/utils";
import { useCurrentTenant } from "./team/-data";
import { DashboardOnboarding } from "./-components/dashboard-onboarding";
import {
	type DashboardData,
	getAnalyticsDateRange,
	mapTenantAnalyticsToDashboardData,
	shouldShowDashboardOnboarding,
	TIME_RANGE_OPTIONS,
	type TimeRange,
} from "./-data";

export const Route = createFileRoute("/(auth)/_auth_layout/app/")({
	head: () => ({
		meta: [
			{ title: "Dashboard | VerifyAfrica" },
			{
				name: "description",
				content:
					"View your organization overview and recent verification activity.",
			},
		],
	}),
	component: DashboardPage,
});

const trendChartConfig = {
	successful: {
		label: "Successful",
		color: "oklch(0.65 0.15 155)",
	},
	failed: {
		label: "Failed",
		color: "oklch(0.769 0.165 70.1)",
	},
	error: {
		label: "Error",
		color: "oklch(0.57 0.22 12)",
	},
} satisfies ChartConfig;

function DashboardPage() {
	const [timeRange, setTimeRange] = useState<TimeRange>("30d");
	const { tenantId } = useCurrentTenant();
	const tenantQuery = useTenantV2DetailQuery(tenantId, Boolean(tenantId));
	const isKycVerified = tenantQuery.data?.kyc.kyc_verified ?? false;
	const isKycLoading = tenantQuery.isPending || tenantQuery.isFetching;
	const showOnboarding =
		!tenantQuery.isError &&
		!isKycLoading &&
		shouldShowDashboardOnboarding(isKycVerified);
	const analyticsDateRange = useMemo(
		() => getAnalyticsDateRange(timeRange),
		[timeRange],
	);

	const tenantsAnalyticsQuery = useTenantAnalyticsV2Query(
		tenantId,
		analyticsDateRange,
		Boolean(tenantId) && isKycVerified,
	);

	const data = useMemo(
		() =>
			tenantsAnalyticsQuery.data
				? mapTenantAnalyticsToDashboardData(tenantsAnalyticsQuery.data)
				: undefined,
		[tenantsAnalyticsQuery.data],
	);

	const isAnalyticsLoading =
		isKycVerified &&
		(tenantsAnalyticsQuery.isPending || tenantsAnalyticsQuery.isFetching);
	const chartKey = `${tenantId ?? "tenant"}-${timeRange}`;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
					<p className="text-sm text-muted-foreground">
						Welcome back! Here&apos;s your verification overview.
					</p>
				</div>
				{isKycVerified && (
					<div className="flex flex-wrap items-center gap-4">
						<Select
							value={timeRange}
							onValueChange={(value) => setTimeRange(value as TimeRange)}
							disabled={isAnalyticsLoading}
						>
							<SelectTrigger className="w-[160px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{TIME_RANGE_OPTIONS.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							onClick={() => tenantsAnalyticsQuery.refetch()}
							disabled={isAnalyticsLoading}
						>
							<ArrowClockwiseIcon
								className={isAnalyticsLoading ? "animate-spin" : undefined}
								weight="bold"
							/>
							Refresh
						</Button>
					</div>
				)}
			</div>

			{tenantQuery.isError ? (
				<div className="rounded-lg border px-6 py-10 text-center text-sm text-muted-foreground">
					Failed to load verification status. Please try again.
				</div>
			) : isKycLoading ? (
				<DashboardKycLoadingState />
			) : (
				<>
					{showOnboarding && <DashboardOnboarding />}

					{isKycVerified &&
						(isAnalyticsLoading || !data ? (
							<DashboardContentSkeleton />
						) : (
							<DashboardContent
								stats={data.stats}
								trendData={data.trendData}
								typeData={data.typeData}
								chartKey={chartKey}
							/>
						))}
				</>
			)}
		</div>
	);
}

function DashboardKycLoadingState() {
	return <Skeleton className="h-48 w-full rounded-2xl" />;
}

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(value);
}

function MetricCard({
	icon: Icon,
	iconClassName,
	value,
	label,
}: {
	icon: ComponentType<{ className?: string; weight?: "fill" | "regular" }>;
	iconClassName: string;
	value: string;
	label: string;
}) {
	return (
		<Card>
			<CardContent className="flex flex-col gap-3">
				<div
					className={cn(
						"flex size-10 items-center justify-center rounded-xl",
						iconClassName,
					)}
				>
					<Icon
						className="size-5"
						weight="fill"
					/>
				</div>
				<div>
					<p className="text-2xl font-semibold tracking-tight">{value}</p>
					<p className="text-sm text-muted-foreground">{label}</p>
				</div>
			</CardContent>
		</Card>
	);
}

function MetricCardSkeleton() {
	return (
		<Card>
			<CardContent className="flex flex-col gap-3">
				<Skeleton className="size-10 rounded-xl" />
				<div className="space-y-1.5">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-4 w-36" />
				</div>
			</CardContent>
		</Card>
	);
}

function VerificationTrendsSkeleton() {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0">
				<Skeleton className="h-5 w-36" />
				<div className="flex items-center gap-4">
					<Skeleton className="h-3 w-12" />
					<Skeleton className="h-3 w-16" />
				</div>
			</CardHeader>
			<CardContent>
				<Skeleton className="h-[280px] w-full rounded-xl" />
			</CardContent>
		</Card>
	);
}

function VerificationTypesSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-5 w-36" />
			</CardHeader>
			<CardContent>
				<div className="mx-auto flex h-[280px] w-full max-w-[320px] items-center justify-center">
					<Skeleton className="size-[200px] rounded-full" />
				</div>
				<div className="mt-4 grid grid-cols-2 gap-2">
					{["id", "passport", "faceMatch", "address"].map((type) => (
						<div
							key={type}
							className="flex items-center justify-between gap-2"
						>
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-10" />
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function FinancialSummarySkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-5 w-52" />
			</CardHeader>
			<CardContent>
				<div className="grid gap-6 sm:grid-cols-3">
					<div className="flex flex-col items-center gap-2 text-center">
						<Skeleton className="size-12 rounded-full" />
						<Skeleton className="h-8 w-24" />
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-3 w-32" />
					</div>
					<div className="flex flex-col items-center gap-2 text-center">
						<Skeleton className="size-12 rounded-full" />
						<Skeleton className="h-8 w-16" />
						<Skeleton className="h-4 w-24" />
					</div>
					<div className="flex flex-col items-center gap-2 text-center">
						<Skeleton className="size-12 rounded-full" />
						<Skeleton className="h-8 w-24" />
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-3 w-32" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function DashboardMetricsSkeleton() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{["total", "success", "topups", "credits"].map((metric) => (
				<MetricCardSkeleton key={metric} />
			))}
		</div>
	);
}

function DashboardContentSkeleton() {
	return (
		<>
			<DashboardMetricsSkeleton />
			<div className="grid gap-4 lg:grid-cols-2">
				<VerificationTrendsSkeleton />
				<VerificationTypesSkeleton />
			</div>
			<FinancialSummarySkeleton />
		</>
	);
}

type DashboardContentProps = DashboardData & {
	chartKey: string;
};

function DashboardContent({
	stats,
	trendData,
	typeData,
	chartKey,
}: DashboardContentProps) {
	const trendLegend = (
		Object.entries(trendChartConfig) as Array<
			[
				keyof typeof trendChartConfig,
				(typeof trendChartConfig)[keyof typeof trendChartConfig],
			]
		>
	).map(([key, config]) => ({
		key,
		label: config.label,
		color: config.color,
		count: trendData.reduce((sum, entry) => sum + (entry[key] ?? 0), 0),
	}));

	const typeChartData = typeData.filter((entry) => entry.count > 0);
	const verificationTypeLegend = typeChartData;
	const typeChartConfig = Object.fromEntries(
		typeData.map((entry) => [
			entry.type,
			{ label: entry.label, color: entry.fill },
		]),
	) satisfies ChartConfig;

	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					icon={ActivityIcon}
					iconClassName="bg-blue-100 text-blue-600"
					value={stats.totalVerifications.toLocaleString()}
					label="Total Verifications"
				/>
				<MetricCard
					icon={CheckCircleIcon}
					iconClassName="bg-emerald-100 text-emerald-600"
					value={`${stats.successRate.toFixed(1)}%`}
					label="Success Rate"
				/>
				<MetricCard
					icon={CreditCardIcon}
					iconClassName="bg-violet-100 text-violet-600"
					value={formatCurrency(stats.topUps)}
					label="Top-ups (30 days)"
				/>
				<MetricCard
					icon={LightningIcon}
					iconClassName="bg-amber-100 text-amber-600"
					value={stats.creditsUsed.toLocaleString()}
					label="Credits Used (30 days)"
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0">
						<CardTitle className="font-semibold">Verification Trends</CardTitle>
					</CardHeader>
					<CardContent className="flex-1 flex flex-col justify-between">
						<ChartContainer
							key={chartKey}
							config={trendChartConfig}
							className="aspect-auto h-[280px] w-full"
						>
							<AreaChart
								data={trendData}
								margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
							>
								<CartesianGrid
									vertical={false}
									strokeDasharray="3 3"
								/>
								<XAxis
									dataKey="label"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
								/>
								<YAxis
									tickLine={false}
									axisLine={false}
									tickMargin={8}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<Area
									type="monotone"
									dataKey="successful"
									stroke="var(--color-successful)"
									fill="var(--color-successful)"
									fillOpacity={0.15}
									strokeWidth={2}
								/>
								<Area
									type="monotone"
									dataKey="failed"
									stroke="var(--color-failed)"
									fill="var(--color-failed)"
									fillOpacity={0.15}
									strokeWidth={2}
								/>
								<Area
									type="monotone"
									dataKey="error"
									stroke="var(--color-error)"
									fill="var(--color-error)"
									fillOpacity={0.15}
									strokeWidth={2}
								/>
							</AreaChart>
						</ChartContainer>
						<div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
							{trendLegend.map((entry) => (
								<div
									key={entry.key}
									className="flex items-center gap-2 text-xs text-muted-foreground"
								>
									<span
										className="size-2 rounded-full"
										style={{ backgroundColor: entry.color }}
									/>
									<span>
										{entry.label} ({entry.count})
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-semibold">Verification Types</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							key={chartKey}
							config={typeChartConfig}
							className="mx-auto aspect-square h-[280px] w-full max-w-[320px]"
						>
							<PieChart>
								<ChartTooltip
									content={
										<ChartTooltipContent
											hideLabel
											nameKey="type"
										/>
									}
								/>
								<Pie
									data={typeChartData}
									dataKey="count"
									nameKey="type"
									innerRadius={60}
									outerRadius={100}
								/>
							</PieChart>
						</ChartContainer>
						<div className="mt-4 space-y-2">
							<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
								{verificationTypeLegend.map((entry) => (
									<div
										key={entry.type}
										className="flex items-center gap-2 text-xs text-muted-foreground"
									>
										<span
											className="size-2 shrink-0 rounded-full"
											style={{ backgroundColor: entry.fill }}
										/>
										<span>
											{entry.label} ({entry.count})
										</span>
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="font-semibold">Financial Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-6 sm:grid-cols-3">
						<div className="flex flex-col items-center gap-2 text-center">
							<div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
								<TrendUpIcon
									className="size-6"
									weight="fill"
								/>
							</div>
							<p className="text-2xl font-semibold">
								{formatCurrency(stats.topUps)}
							</p>
							<p className="text-sm font-medium">Total Top-ups</p>
							<p className="text-xs text-muted-foreground">
								{stats.topUpTransactions} transactions
							</p>
						</div>
						<div className="flex flex-col items-center gap-2 text-center">
							<div className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
								<LightningIcon
									className="size-6"
									weight="fill"
								/>
							</div>
							<p className="text-2xl font-semibold">
								{stats.creditsUsed.toLocaleString()}
							</p>
							<p className="text-sm font-medium">Credits Used</p>
						</div>
						<div className="flex flex-col items-center gap-2 text-center">
							<div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
								<ArrowsCounterClockwiseIcon
									className="size-6"
									weight="fill"
								/>
							</div>
							<p className="text-2xl font-semibold">
								{formatCurrency(stats.refunds.amount)}
							</p>
							<p className="text-sm font-medium">Total Refunds</p>
							<p className="text-xs text-muted-foreground">
								{stats.refunds.transactions} transactions
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
