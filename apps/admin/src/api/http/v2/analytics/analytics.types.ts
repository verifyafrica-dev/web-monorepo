import { z } from "zod";

import type {
	V2PaginatedSuccessResponse,
	V2SuccessResponse,
} from "@verifyafrica/api-client/http/shared";
import type { VerificationStatus } from "../verifications/verifications.types";

export const AnalyticsDateRangeQuerySchema = z.object({
	from_date: z.string().optional(),
	to_date: z.string().optional(),
	format: z.enum(["json", "json-html"]).optional(),
});
export type AnalyticsDateRangeQuery = z.infer<typeof AnalyticsDateRangeQuerySchema>;
export interface AnalyticsVolumePoint { date: string; count: number; status_counts: Record<VerificationStatus, number>; }
export interface AnalyticsTopUps { count: number; total_amount: number; }
export interface AnalyticsRefunds { count: number; total_amount: number; }
export interface TenantAnalyticsSummary { total_users: number; active_users_past_30_days: number; pending_verifications: number; total_revenue_past_30_days: number; avg_verification_turnaround_time_hours: number | null; }
export interface TenantAnalyticsVerifications { verification_volume: AnalyticsVolumePoint[]; type_distribution: Record<string, number>; status_distribution: Record<string, number>; }
export interface TenantAnalyticsFinancials { credit_usage: number; top_ups: AnalyticsTopUps; refunds: AnalyticsRefunds; }
export interface TenantAnalyticsData { summary: TenantAnalyticsSummary; verifications: TenantAnalyticsVerifications; financials: TenantAnalyticsFinancials; }
export interface PlatformAnalyticsSummary { total_users: number; active_users_past_30_days: number; total_tenants: number; pending_verifications: number; total_revenue_past_30_days: number; avg_verification_turnaround_time_hours: number | null; }

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
