import {
	ActivityIcon,
	BuildingsIcon,
	CheckCircleIcon,
	ClockIcon,
	CreditCardIcon,
	CurrencyDollarIcon,
	ShieldCheckIcon,
	UsersIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@verifyafrica/ui/components/ui/alert";
import { Avatar, AvatarFallback } from "@verifyafrica/ui/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@verifyafrica/ui/components/ui/chart";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { cn } from "@verifyafrica/ui/lib/utils";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import type {
	AdminDashboardAlert,
	AdminDashboardData,
	ChartPoint,
} from "../-data";
import { formatAdminCurrency, formatAdminNumber } from "../-data";

const tenantGrowthChartConfig = {
	value: {
		label: "New Tenants",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

const verificationVolumeChartConfig = {
	value: {
		label: "Verifications",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

const revenueChartConfig = {
	value: {
		label: "Revenue",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

function MetricCard({
	icon: Icon,
	iconClassName,
	value,
	label,
	footnote,
	className,
}: {
	icon: ComponentType<{ className?: string; weight?: "fill" | "regular" }>;
	iconClassName: string;
	value: string;
	label: string;
	footnote?: string;
	className?: string;
}) {
	return (
		<Card className={className}>
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
					<p className="text-2xl font-semibold tracking-tight tabular-nums">
						{value}
					</p>
					<p className="text-sm text-muted-foreground">{label}</p>
					{footnote ? (
						<p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
							{footnote}
						</p>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}

function DistributionList({
	items,
	total,
	showCountInLabel = false,
}: {
	items: ChartPoint[];
	total: number;
	showCountInLabel?: boolean;
}) {
	if (items.length === 0) {
		return (
			<p className="py-8 text-center text-sm text-muted-foreground">
				No data available
			</p>
		);
	}

	return (
		<div className="space-y-3">
			{items.map((item) => {
				const percentage =
					total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
				const label = showCountInLabel
					? `${item.label} (${formatAdminNumber(item.value)})`
					: item.label;

				return (
					<div
						key={item.label}
						className="flex items-center justify-between rounded-lg bg-muted/40 p-3"
					>
						<div className="flex items-center gap-3">
							<span
								className="size-3 rounded-full"
								style={{ backgroundColor: item.fill }}
							/>
							<span className="text-sm font-medium">{label}</span>
						</div>
						<div className="text-right">
							{!showCountInLabel ? (
								<p className="text-sm font-semibold tabular-nums">
									{formatAdminNumber(item.value)}
								</p>
							) : null}
							<p className="text-xs text-muted-foreground">{percentage}%</p>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function AlertCard({ alert }: { alert: AdminDashboardAlert }) {
	const iconMap = {
		info: ActivityIcon,
		success: CheckCircleIcon,
		warning: WarningCircleIcon,
	} as const;

	const toneMap = {
		info: "border-blue-200 bg-blue-50/70 text-blue-950",
		success: "border-emerald-200 bg-emerald-50/70 text-emerald-950",
		warning: "border-amber-200 bg-amber-50/70 text-amber-950",
	} as const;

	const Icon = iconMap[alert.type];

	return (
		<Alert className={toneMap[alert.type]}>
			<Icon
				className="size-4"
				weight="fill"
			/>
			<AlertTitle className="text-sm font-medium">{alert.message}</AlertTitle>
			<AlertDescription>{alert.time}</AlertDescription>
		</Alert>
	);
}

export function AdminDashboardSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{createSkeletonKeys(4, "dashboard-stat").map((key) => (
					<Skeleton
						key={key}
						className="h-36 rounded-xl"
					/>
				))}
			</div>
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{createSkeletonKeys(4, "dashboard-metric").map((key) => (
					<Skeleton
						key={key}
						className="h-32 rounded-xl"
					/>
				))}
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				<Skeleton className="h-[420px] rounded-xl" />
				<Skeleton className="h-[420px] rounded-xl" />
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				<Skeleton className="h-[420px] rounded-xl" />
				<Skeleton className="h-[420px] rounded-xl" />
			</div>
		</div>
	);
}

export function AdminDashboardContent({
	data,
	chartKey,
}: {
	data: AdminDashboardData;
	chartKey: string;
}) {
	const roleDistributionTotal = data.roleDistribution.reduce(
		(sum, item) => sum + item.value,
		0,
	);
	const complianceTotal = data.complianceStatus.reduce(
		(sum, item) => sum + item.value,
		0,
	);
	const verificationTypeChartData = data.verificationTypes.filter(
		(item) => item.value > 0,
	);

	return (
		<div className="flex flex-col gap-6">
			<p className="text-sm text-muted-foreground">
				{new Date().toLocaleDateString("en-US", {
					weekday: "long",
					month: "short",
					day: "numeric",
					year: "numeric",
				})}
			</p>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					icon={BuildingsIcon}
					iconClassName="bg-blue-100 text-blue-600"
					value={formatAdminNumber(data.summary.totalTenants)}
					label="Total Tenants"
					footnote={`${formatAdminNumber(data.summary.pendingVerifications)} pending verifications`}
				/>
				<MetricCard
					icon={UsersIcon}
					iconClassName="bg-emerald-100 text-emerald-600"
					value={formatAdminNumber(data.summary.totalUsers)}
					label="Total Users"
					footnote={`${formatAdminNumber(data.summary.activeUsers)} active`}
					className="hidden sm:block"
				/>
				<MetricCard
					icon={ActivityIcon}
					iconClassName="bg-violet-100 text-violet-600"
					value={formatAdminNumber(data.summary.totalVerifications)}
					label="Total Verifications"
					footnote={
						data.summary.avgTurnaroundHours != null
							? `${data.summary.avgTurnaroundHours.toFixed(1)}h avg turnaround`
							: "No turnaround data"
					}
					className="hidden sm:block"
				/>
				<MetricCard
					icon={CurrencyDollarIcon}
					iconClassName="bg-amber-100 text-amber-600"
					value={formatAdminCurrency(data.summary.revenue)}
					label="Revenue"
					footnote={`${formatAdminNumber(data.summary.creditUsage)} credits used`}
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					icon={CheckCircleIcon}
					iconClassName="bg-emerald-100 text-emerald-600"
					value={formatAdminNumber(data.invitations.sent)}
					label="Invitations Sent"
					className="hidden lg:block"
				/>
				<MetricCard
					icon={ClockIcon}
					iconClassName="bg-blue-100 text-blue-600"
					value={formatAdminNumber(data.invitations.pending)}
					label="Pending Invitations"
					className="hidden lg:block"
				/>
				<MetricCard
					icon={UsersIcon}
					iconClassName="bg-violet-100 text-violet-600"
					value={formatAdminNumber(data.invitations.accepted)}
					label="Accepted Invitations"
					className="hidden lg:block"
				/>
				<MetricCard
					icon={CreditCardIcon}
					iconClassName="bg-amber-100 text-amber-600"
					value={formatAdminCurrency(data.invitations.topUpsTotal)}
					label="Top-ups"
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card className="hidden lg:block">
					<CardHeader>
						<CardTitle className="font-semibold">
							{" "}
							Tenant Growth Over Time
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							key={`${chartKey}-tenant-growth`}
							config={tenantGrowthChartConfig}
							className="aspect-auto h-[320px] w-full"
						>
							<AreaChart data={data.tenantGrowth}>
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
									width={40}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<Area
									type="monotone"
									dataKey="value"
									stroke="var(--color-value)"
									fill="var(--color-value)"
									fillOpacity={0.15}
									strokeWidth={2}
								/>
							</AreaChart>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-semibold">
							{" "}
							Verification Types Distribution
						</CardTitle>
					</CardHeader>
					<CardContent>
						{verificationTypeChartData.length === 0 ? (
							<p className="py-16 text-center text-sm text-muted-foreground">
								No verification type data available
							</p>
						) : (
							<div>
								<ChartContainer
									key={`${chartKey}-verification-types`}
									config={Object.fromEntries(
										data.verificationTypes.map((item) => [
											item.label,
											{ label: item.label, color: item.fill },
										]),
									)}
									className="mx-auto aspect-square h-[280px] w-full max-w-[280px]"
								>
									<PieChart>
										<ChartTooltip
											isAnimationActive={false}
											content={<ChartTooltipContent hideLabel />}
										/>
										<Pie
											data={verificationTypeChartData}
											dataKey="value"
											nameKey="label"
											innerRadius={60}
											outerRadius={100}
										>
											{verificationTypeChartData.map((entry) => (
												<Cell
													key={entry.label}
													fill={entry.fill}
												/>
											))}
										</Pie>
									</PieChart>
								</ChartContainer>
								<div className="mt-4 space-y-2">
									<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
										{verificationTypeChartData.map((entry) => (
											<div
												key={entry.label}
												className="flex items-center gap-2 text-xs text-muted-foreground"
											>
												<span
													className="size-2 shrink-0 rounded-full"
													style={{ backgroundColor: entry.fill }}
												/>
												<span>
													{entry.label} ({formatAdminNumber(entry.value)})
												</span>
											</div>
										))}
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<div
				className={cn(
					"grid gap-4 lg:grid-cols-2",
					data.revenueOverTime.length === 0 && "hidden",
				)}
			>
				<Card className="gap-10 flex flex-col">
					<CardHeader>
						<CardTitle className="font-semibold"> Revenue Over Time</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							key={`${chartKey}-revenue`}
							config={revenueChartConfig}
							className="aspect-auto h-[320px] w-full"
						>
							<BarChart data={data.revenueOverTime}>
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
									width={48}
									tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
								/>
								<ChartTooltip
									content={
										<ChartTooltipContent
											formatter={(value) => formatAdminCurrency(Number(value))}
										/>
									}
								/>
								<Bar
									dataKey="value"
									fill="var(--color-value)"
									radius={[8, 8, 0, 0]}
								/>
							</BarChart>
						</ChartContainer>
						<div className="mt-6 grid grid-cols-2 gap-4 border-t pt-6">
							<div className="text-center">
								<p className="text-xs text-muted-foreground">Total Revenue</p>
								<p className="font-semibold tabular-nums">
									{formatAdminCurrency(data.summary.revenue)}
								</p>
							</div>
							<div className="text-center">
								<p className="text-xs text-muted-foreground">Credits Used</p>
								<p className="font-semibold tabular-nums">
									{formatAdminNumber(data.summary.creditUsage)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="hidden lg:flex gap-10 flex-col">
					<CardHeader>
						<CardTitle className="font-semibold">
							{" "}
							Verification Volume
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer
							key={`${chartKey}-verification-volume`}
							config={verificationVolumeChartConfig}
							className="aspect-auto h-[320px] w-full"
						>
							<LineChart data={data.verificationVolume}>
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
									width={40}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<Line
									type="monotone"
									dataKey="value"
									stroke="var(--color-value)"
									strokeWidth={2}
									dot={{ r: 4 }}
								/>
							</LineChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 xl:grid-cols-3">
				<Card className="hidden xl:col-span-2 xl:block">
					<CardHeader>
						<CardTitle className="font-semibold">
							{" "}
							Top Performing Tenants by Activity
						</CardTitle>
					</CardHeader>
					<CardContent>
						{data.topTenants.length === 0 ? (
							<div className="flex flex-col items-center gap-3 py-12 text-center">
								<BuildingsIcon className="size-12 text-muted-foreground/60" />
								<p className="text-sm text-muted-foreground">
									No tenant activity data available
								</p>
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Tenant Name</TableHead>
										<TableHead>Tenant ID</TableHead>
										<TableHead className="text-right">Activity Score</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.topTenants.map((tenant) => (
										<TableRow key={tenant.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="size-10 rounded-lg">
														<AvatarFallback className="rounded-lg bg-blue-100 text-blue-700">
															{tenant.name.charAt(0).toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<span className="font-medium">{tenant.name}</span>
												</div>
											</TableCell>
											<TableCell>
												<span className="font-mono text-xs text-muted-foreground">
													{tenant.id.slice(0, 20)}...
												</span>
											</TableCell>
											<TableCell className="text-right font-semibold tabular-nums">
												{formatAdminNumber(tenant.activityScore)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>

				<Card className="hidden xl:block">
					<CardHeader>
						<CardTitle className="font-semibold"> Recent Alerts</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{data.recentAlerts.map((alert) => (
							<AlertCard
								key={alert.message}
								alert={alert}
							/>
						))}
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card className="hidden lg:block">
					<CardHeader>
						<div className="flex items-center gap-3">
							<UsersIcon
								className="size-5 text-blue-600"
								weight="fill"
							/>
							<CardTitle className="font-semibold">
								{" "}
								User Role Distribution
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<DistributionList
							items={data.roleDistribution}
							total={roleDistributionTotal}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<ShieldCheckIcon
								className="size-5 text-emerald-600"
								weight="fill"
							/>
							<CardTitle className="font-semibold">
								{" "}
								Tenant Compliance Status
							</CardTitle>
						</div>
					</CardHeader>
					<CardContent>
						<DistributionList
							items={data.complianceStatus}
							total={complianceTotal}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
