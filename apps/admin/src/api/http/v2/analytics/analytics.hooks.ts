import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { ANALYTICS_V2_API } from "./analytics.api";
import type {
	AnalyticsDateRangeQuery,
	AnalyticsPayload,
	AnalyticsStatementsListQuery,
	PaginatedStatementsListResult,
	PlatformAnalyticsPayload,
} from "./analytics.types";

export const ANALYTICS_V2_QUERY_KEYS = {
	all: ["analytics-v2"] as const,
	root: (params?: AnalyticsDateRangeQuery) =>
		[
			"analytics-v2",
			"root",
			params?.from_date ?? null,
			params?.to_date ?? null,
		] as const,
	tenant: (tenantId: string, params?: AnalyticsDateRangeQuery) =>
		[
			"analytics-v2",
			"tenant",
			tenantId,
			params?.from_date ?? null,
			params?.to_date ?? null,
		] as const,
	statements: (params?: AnalyticsStatementsListQuery, tenantId?: string) =>
		[
			"analytics-v2",
			"statements",
			tenantId ?? null,
			params?.page ?? null,
			params?.per_page ?? null,
		] as const,
} as const;

export const usePlatformAnalyticsV2Query = (
	params?: AnalyticsDateRangeQuery,
	enabled = true,
): UseQueryResult<PlatformAnalyticsPayload> =>
	useQuery<PlatformAnalyticsPayload>({
		queryKey: ANALYTICS_V2_QUERY_KEYS.root(params),
		queryFn: () => ANALYTICS_V2_API.ROOT(params),
		enabled,
	});

export const useTenantAnalyticsV2Query = (
	tenantId: string | undefined,
	params?: AnalyticsDateRangeQuery,
	enabled = true,
): UseQueryResult<AnalyticsPayload> =>
	useQuery<AnalyticsPayload>({
		queryKey: ANALYTICS_V2_QUERY_KEYS.tenant(tenantId ?? "", params),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return ANALYTICS_V2_API.TENANT(tenantId, params);
		},
		enabled: enabled && Boolean(tenantId),
	});

export const useTenantStatementsV2Query = (
	params?: AnalyticsStatementsListQuery,
	tenantId?: string,
	enabled = true,
): UseQueryResult<PaginatedStatementsListResult> =>
	useQuery<PaginatedStatementsListResult>({
		queryKey: ANALYTICS_V2_QUERY_KEYS.statements(params, tenantId),
		queryFn: () => ANALYTICS_V2_API.STATEMENTS(params, tenantId),
		enabled,
	});

export type {
	AnalyticsPayload,
	PaginatedStatementsListResult,
	PlatformAnalyticsPayload,
};
