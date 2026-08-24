import { z } from "zod";

import type {
	V2PaginatedSuccessResponse,
	V2SuccessResponse,
} from "#/api/http/shared";
import type {
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

export interface AnalyticsPayload {
	analytics: TenantAnalyticsData;
}

export interface PlatformAnalyticsPayload {
	analytics: {
		summary: PlatformAnalyticsSummary;
		users: Record<string, unknown>;
		tenants: Record<string, unknown>;
		verifications: TenantAnalyticsVerifications;
		financials: Record<string, unknown>;
		billing_stats: Record<string, unknown>;
	};
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
