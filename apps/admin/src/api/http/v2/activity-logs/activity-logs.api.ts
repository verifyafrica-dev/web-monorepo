import { unwrapV2Paginated } from "@verifyafrica/api-client/http/shared";
import $http from "../../xhr";
import type {
	ActivityLogsListQuery,
	PaginatedActivityLogListResult,
} from "./activity-logs.types";

const TENANT_ID_HEADER = "X-TENANT-ID";

const ACTIVITY_LOGS_V2_ENDPOINTS = {
	list: "/v2/activity-logs/",
} as const;

const withTenantHeader = (tenantId: string) => ({
	headers: {
		[TENANT_ID_HEADER]: tenantId,
	},
});

export const ACTIVITY_LOGS_V2_API = {
	TENANT_LIST: async (
		tenantId: string,
		params?: ActivityLogsListQuery,
	): Promise<PaginatedActivityLogListResult> =>
		await $http
			.get(ACTIVITY_LOGS_V2_ENDPOINTS.list, {
				params,
				...withTenantHeader(tenantId),
			})
			.then((res) => unwrapV2Paginated(res)),

	ALL_LIST: async (
		params?: ActivityLogsListQuery,
	): Promise<PaginatedActivityLogListResult> =>
		await $http
			.get(ACTIVITY_LOGS_V2_ENDPOINTS.list, { params })
			.then((res) => unwrapV2Paginated(res)),
};
