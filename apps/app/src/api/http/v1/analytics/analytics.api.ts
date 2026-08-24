import $http from "../../xhr";
import type {
	AnalyticsDateRangeQuery,
	PlatformAnalyticsResponse,
	TenantAnalyticsResponse,
} from "./analytics.types";

const ANALYTICS_ENDPOINTS = {
	root: "/analytics/",
	statements: "/analytics/statements/",
	tenant: (tenantId: string) => `/analytics/tenant/${tenantId}`,
} as const;

export const ANALYTICS_API = {
	ROOT: async (params?: AnalyticsDateRangeQuery) =>
		await $http
			.get<PlatformAnalyticsResponse>(ANALYTICS_ENDPOINTS.root, { params })
			.then((res) => res.data),

	TENANT: async (tenantId: string, params?: AnalyticsDateRangeQuery) =>
		await $http
			.get<TenantAnalyticsResponse>(ANALYTICS_ENDPOINTS.tenant(tenantId), {
				params,
			})
			.then((res) => res.data),
};
