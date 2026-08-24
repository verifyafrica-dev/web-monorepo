import { unwrapV2Data, unwrapV2Paginated } from "#/api/http/shared";
import $http from "../../xhr";
import type {
	AnalyticsDateRangeQuery,
	AnalyticsPayload,
	AnalyticsStatementsListQuery,
	PaginatedStatementsListResult,
	PlatformAnalyticsPayload,
} from "./analytics.types";

const TENANT_ID_HEADER = "X-TENANT-ID";

const ANALYTICS_V2_ENDPOINTS = {
	root: "/v2/analytics/",
	statements: "/v2/analytics/statements/",
	tenant: "/v2/analytics/tenant/",
} as const;

const withTenantHeader = (tenantId?: string) =>
	tenantId
		? {
				headers: {
					[TENANT_ID_HEADER]: tenantId,
				},
			}
		: {};

export const ANALYTICS_V2_API = {
	ROOT: async (
		params?: AnalyticsDateRangeQuery,
	): Promise<PlatformAnalyticsPayload> =>
		await $http
			.get(ANALYTICS_V2_ENDPOINTS.root, { params })
			.then((res) => unwrapV2Data<PlatformAnalyticsPayload>(res)),

	TENANT: async (
		tenantId: string,
		params?: AnalyticsDateRangeQuery,
	): Promise<AnalyticsPayload> =>
		await $http
			.get(ANALYTICS_V2_ENDPOINTS.tenant, {
				params,
				...withTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Data<AnalyticsPayload>(res)),

	STATEMENTS: async (
		params?: AnalyticsStatementsListQuery,
		tenantId?: string,
	): Promise<PaginatedStatementsListResult> =>
		await $http
			.get(ANALYTICS_V2_ENDPOINTS.statements, {
				params,
				...withTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Paginated(res)),
};
