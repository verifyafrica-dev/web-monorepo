import type {
	AnalyticsDateRangeQuery,
	PlatformAnalyticsPayload,
} from "#/api/http/v2/analytics/analytics.types";
import { VERIFICATION_TYPES_BY_PRODUCT } from "#/api/http/v2/verifications/verifications.types";

export type TimeRange = "all" | "7d" | "30d" | "90d";

const chartDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
});

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
	{ value: "7d", label: "Last 7 days" },
	{ value: "30d", label: "Last 30 days" },
	{ value: "90d", label: "Last 90 days" },
	{ value: "all", label: "All time" },
];

const TIME_RANGE_DAYS: Record<Exclude<TimeRange, "all">, number> = {
	"7d": 7,
	"30d": 30,
	"90d": 90,
};

export function getAnalyticsDateRange(
	range: TimeRange,
	now = new Date(),
): AnalyticsDateRangeQuery {
	if (range === "all") {
		return {};
	}

	const toDate = new Date(now);
	const fromDate = new Date(now);
	fromDate.setDate(fromDate.getDate() - TIME_RANGE_DAYS[range]);

	return {
		from_date: isoDateFormatter.format(fromDate),
		to_date: isoDateFormatter.format(toDate),
	};
}

export const CHART_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"var(--chart-6)",
	"var(--chart-7)",
	"var(--chart-8)",
	"var(--chart-9)",
	"var(--chart-10)",
	"var(--chart-11)",
	"var(--chart-12)",
] as const;

export type ChartPoint = {
	label: string;
	value: number;
	fill: string;
};

export type TimeSeriesPoint = {
	label: string;
	value: number;
};

export type AdminDashboardAlert = {
	type: "info" | "success" | "warning";
	message: string;
	time: string;
};

export type AdminDashboardData = {
	summary: {
		totalTenants: number;
		totalUsers: number;
		totalVerifications: number;
		revenue: number;
		pendingVerifications: number;
		activeUsers: number;
		avgTurnaroundHours: number | null;
		creditUsage: number;
	};
	invitations: {
		sent: number;
		pending: number;
		accepted: number;
		topUpsTotal: number;
	};
	tenantGrowth: TimeSeriesPoint[];
	verificationVolume: TimeSeriesPoint[];
	revenueOverTime: TimeSeriesPoint[];
	verificationTypes: ChartPoint[];
	roleDistribution: ChartPoint[];
	complianceStatus: ChartPoint[];
	topTenants: Array<{
		id: string;
		name: string;
		activityScore: number;
	}>;
	recentAlerts: AdminDashboardAlert[];
};

function formatChartDate(date: string) {
	return chartDateFormatter.format(new Date(date));
}

function formatLabel(value: string) {
	return value
		.replace(/_/g, " ")
		.replace(/\b\w/g, (character) => character.toUpperCase());
}

function mapDistribution(
	distribution: Record<string, number>,
): ChartPoint[] {
	return Object.entries(distribution).map(([key, value], index) => ({
		label: formatLabel(key),
		value,
		fill: CHART_COLORS[index % CHART_COLORS.length],
	}));
}

function mapVerificationTypeDistribution(
	distribution: Record<string, number>,
): ChartPoint[] {
	return Object.entries(VERIFICATION_TYPES_BY_PRODUCT).map(
		([productLabel, verificationTypes], index) => ({
			label: productLabel,
			value: verificationTypes.reduce(
				(sum, verificationType) => sum + (distribution[verificationType] ?? 0),
				0,
			),
			fill: CHART_COLORS[index % CHART_COLORS.length],
		}),
	);
}

export function mapPlatformAnalyticsToDashboardData(
	response: PlatformAnalyticsPayload,
): AdminDashboardData {
	const { summary, users, tenants, verifications, financials } =
		response.analytics;

	const totalVerifications = Object.values(
		verifications.type_distribution,
	).reduce((sum, count) => sum + count, 0);

	return {
		summary: {
			totalTenants: summary.total_tenants,
			totalUsers: summary.total_users,
			totalVerifications,
			revenue: summary.total_revenue_past_30_days,
			pendingVerifications: summary.pending_verifications,
			activeUsers: summary.active_users_past_30_days,
			avgTurnaroundHours: summary.avg_verification_turnaround_time_hours,
			creditUsage: financials.credit_usage,
		},
		invitations: {
			sent: users.invitations.sent,
			pending: users.invitations.pending,
			accepted: users.invitations.accepted,
			topUpsTotal: financials.top_ups.total_amount,
		},
		tenantGrowth: tenants.tenant_growth.map((point) => ({
			label: formatChartDate(point.date),
			value: point.new_tenants,
		})),
		verificationVolume: verifications.verification_volume.map((point) => ({
			label: formatChartDate(point.date),
			value: point.count,
		})),
		revenueOverTime: financials.revenue_over_time.map((point) => ({
			label: formatChartDate(point.date),
			value: point.revenue,
		})),
		verificationTypes: mapVerificationTypeDistribution(
			verifications.type_distribution,
		),
		roleDistribution: mapDistribution(users.role_distribution),
		complianceStatus: mapDistribution(tenants.compliance_status),
		topTenants: tenants.top_tenants_by_activity.map((tenant) => ({
			id: tenant.tenant_id,
			name: tenant.tenant_name,
			activityScore: tenant.activity_score,
		})),
		recentAlerts: [
			{
				type: "info",
				message: `${users.invitations.pending} pending user invitations`,
				time: "Now",
			},
			{
				type: "info",
				message: `${financials.top_ups.count} top-ups`,
				time: "Now",
			},
			{
				type: "success",
				message: `${users.invitations.accepted} invitations accepted`,
				time: "Recent",
			},
		],
	};
}

export function formatAdminNumber(value: number) {
	return new Intl.NumberFormat().format(value);
}

export function formatAdminCurrency(value: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(value);
}
