import { z } from "zod";

import type {
	V2PaginatedSuccessResponse,
	V2SuccessResponse,
} from "#/api/http/shared";
import type {
	AnalyticsRefunds,
	AnalyticsTopUps,
	PlatformAnalyticsSummary,
	TenantAnalyticsData,
	TenantAnalyticsVerifications,
} from "#/api/http/v1/analytics/analytics.types";

export type {
	AnalyticsDateRangeQuery,
	AnalyticsRefunds,
	AnalyticsTopUps,
	AnalyticsVolumePoint,
	PlatformAnalyticsSummary,
	TenantAnalyticsData,
	TenantAnalyticsFinancials,
	TenantAnalyticsSummary,
	TenantAnalyticsVerifications,
} from "#/api/http/v1/analytics/analytics.types";

export { AnalyticsDateRangeQuerySchema } from "#/api/http/v1/analytics/analytics.types";

export const AnalyticsStatementsListQuerySchema = z.object({
	page: z.number().int().positive().optional(),
	per_page: z.number().int().positive().optional(),
});

export type AnalyticsStatementsListQuery = z.infer<
	typeof AnalyticsStatementsListQuerySchema
>;

export interface Statement {
	id: string;
	name: string;
	balance: string;
	billing_address: string;
}

export interface PlatformAnalyticsInvitations {
	sent: number;
	accepted: number;
	expired: number;
	pending: number;
	canceled: number;
}

export interface PlatformAnalyticsUsers {
	user_growth: Array<{ date: string; new_users: number }>;
	role_distribution: Record<string, number>;
	invitations: PlatformAnalyticsInvitations;
}

export interface PlatformAnalyticsTopTenant {
	tenant_id: string;
	tenant_name: string;
	activity_score: number;
}

export interface PlatformAnalyticsTenants {
	tenant_growth: Array<{ date: string; new_tenants: number }>;
	top_tenants_by_activity: PlatformAnalyticsTopTenant[];
	compliance_status: Record<string, number>;
}

export interface PlatformAnalyticsRevenuePoint {
	date: string;
	revenue: number;
}

export interface PlatformAnalyticsFinancials {
	revenue_over_time: PlatformAnalyticsRevenuePoint[];
	credit_usage: number;
	top_ups: AnalyticsTopUps;
	refunds: AnalyticsRefunds;
}

export interface PlatformAnalyticsData {
	summary: PlatformAnalyticsSummary;
	users: PlatformAnalyticsUsers;
	tenants: PlatformAnalyticsTenants;
	verifications: TenantAnalyticsVerifications;
	financials: PlatformAnalyticsFinancials;
	billing_stats: Record<string, unknown>;
}

export interface AnalyticsPayload {
	analytics: TenantAnalyticsData;
}

export interface PlatformAnalyticsPayload {
	analytics: PlatformAnalyticsData;
}

export type PlatformAnalyticsResponse =
	V2SuccessResponse<PlatformAnalyticsPayload>;
export type TenantAnalyticsResponse = V2SuccessResponse<AnalyticsPayload>;
export type TenantStatementsListResponse =
	V2PaginatedSuccessResponse<Statement>;

export interface PaginatedStatementsListResult {
	items: Statement[];
	meta: NonNullable<TenantStatementsListResponse["meta"]>;
	message: string;
}
