import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_API } from "./analytics.api";
import type { AnalyticsDateRangeQuery } from "./analytics.types";

const toAnalyticsQueryParams = (
	fromDate?: string | null,
	toDate?: string | null,
): AnalyticsDateRangeQuery | undefined => {
	const params: AnalyticsDateRangeQuery = {};

	if (fromDate) {
		params.from_date = fromDate;
	}

	if (toDate) {
		params.to_date = toDate;
	}

	return Object.keys(params).length > 0 ? params : undefined;
};

export const ANALYTICS_QUERY_KEYS = {
	all: ["analytics"] as const,
	root: (params?: AnalyticsDateRangeQuery) =>
		[
			"analytics",
			"root",
			params?.from_date ?? null,
			params?.to_date ?? null,
		] as const,
	tenant: (tenantId: string, params?: AnalyticsDateRangeQuery) =>
		[
			"analytics",
			"tenant",
			tenantId,
			params?.from_date ?? null,
			params?.to_date ?? null,
		] as const,
} as const;

export const usePlatformAnalyticsQuery = (
	params?: AnalyticsDateRangeQuery,
	enabled = true,
) =>
	useQuery({
		queryKey: ANALYTICS_QUERY_KEYS.root(params),
		queryFn: ({ queryKey }) => {
			const [, , fromDate, toDate] = queryKey;

			return ANALYTICS_API.ROOT(toAnalyticsQueryParams(fromDate, toDate));
		},
		enabled,
	});

export const useTenantAnalyticsQuery = (
	tenantId: string | undefined,
	params?: AnalyticsDateRangeQuery,
	enabled = true,
) =>
	useQuery({
		queryKey: ANALYTICS_QUERY_KEYS.tenant(tenantId ?? "", params),
		queryFn: ({ queryKey }) => {
			const [, , id, fromDate, toDate] = queryKey;

			return ANALYTICS_API.TENANT(id, toAnalyticsQueryParams(fromDate, toDate));
		},
		enabled: enabled && Boolean(tenantId),
	});
