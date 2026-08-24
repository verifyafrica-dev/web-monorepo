import { z } from "zod";
import type { VerificationStatus } from "../verifications/verifications.types";

export const AnalyticsDateRangeQuerySchema = z.object({
	from_date: z.string().optional(),
	to_date: z.string().optional(),
	format: z.enum(["json", "json-html"]).optional(),
});

export type AnalyticsDateRangeQuery = z.infer<
	typeof AnalyticsDateRangeQuerySchema
>;

export interface AnalyticsVolumePoint {
	date: string;
	count: number;
	status_counts: Record<VerificationStatus, number>;
}

export interface AnalyticsTopUps {
	count: number;
	total_amount: number;
}

export interface AnalyticsRefunds {
	count: number;
	total_amount: number;
}

export interface TenantAnalyticsSummary {
	total_users: number;
	active_users_past_30_days: number;
	pending_verifications: number;
	total_revenue_past_30_days: number;
	avg_verification_turnaround_time_hours: number | null;
}

export interface TenantAnalyticsVerifications {
	verification_volume: AnalyticsVolumePoint[];
	type_distribution: Record<string, number>;
	status_distribution: Record<string, number>;
}

export interface TenantAnalyticsFinancials {
	credit_usage: number;
	top_ups: AnalyticsTopUps;
	refunds: AnalyticsRefunds;
}

export interface TenantAnalyticsData {
	summary: TenantAnalyticsSummary;
	verifications: TenantAnalyticsVerifications;
	financials: TenantAnalyticsFinancials;
}

export interface TenantAnalyticsResponse {
	analytics: TenantAnalyticsData;
}

export interface PlatformAnalyticsSummary {
	total_users: number;
	active_users_past_30_days: number;
	total_tenants: number;
	pending_verifications: number;
	total_revenue_past_30_days: number;
	avg_verification_turnaround_time_hours: number | null;
}

export interface PlatformAnalyticsResponse {
	analytics: {
		summary: PlatformAnalyticsSummary;
		users: Record<string, unknown>;
		tenants: Record<string, unknown>;
		verifications: TenantAnalyticsVerifications;
		financials: Record<string, unknown>;
		billing_stats: Record<string, unknown>;
	};
}
