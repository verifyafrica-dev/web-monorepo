import {
	useQuery,
	type UseQueryResult,
} from "@tanstack/react-query";

import { ACTIVITY_LOGS_V2_API } from "./activity-logs.api";
import type {
	ActivityLog,
	ActivityLogsListQuery,
	PaginatedActivityLogListResult,
} from "./activity-logs.types";

const ACTIVITY_LOGS_V2_STALE_TIME = 60_000;

export const ACTIVITY_LOGS_V2_QUERY_KEYS = {
	all: ["activity-logs-v2"] as const,
	tenantList: (tenantId: string, params?: ActivityLogsListQuery) =>
		["activity-logs-v2", "tenant", tenantId, params ?? {}] as const,
	allList: (params?: ActivityLogsListQuery) =>
		["activity-logs-v2", "all", params ?? {}] as const,
} as const;

export const useTenantActivityLogsV2Query = (
	tenantId: string | undefined,
	params?: ActivityLogsListQuery,
	enabled = true,
): UseQueryResult<PaginatedActivityLogListResult> =>
	useQuery<PaginatedActivityLogListResult>({
		queryKey: ACTIVITY_LOGS_V2_QUERY_KEYS.tenantList(tenantId ?? "", params),
		queryFn: () => {
			if (!tenantId) {
				throw new Error("Tenant ID is required");
			}

			return ACTIVITY_LOGS_V2_API.TENANT_LIST(tenantId, params);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: ACTIVITY_LOGS_V2_STALE_TIME,
	});

export const useAllActivityLogsV2Query = (
	params?: ActivityLogsListQuery,
	enabled = true,
): UseQueryResult<PaginatedActivityLogListResult> =>
	useQuery<PaginatedActivityLogListResult>({
		queryKey: ACTIVITY_LOGS_V2_QUERY_KEYS.allList(params),
		queryFn: () => ACTIVITY_LOGS_V2_API.ALL_LIST(params),
		enabled,
		staleTime: ACTIVITY_LOGS_V2_STALE_TIME,
	});

export type { ActivityLog, PaginatedActivityLogListResult };
