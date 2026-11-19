import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import type {
	TmAdminTemplateListQuery,
	TmTemplateListData,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";

import { TRANSACTION_MONITORING_ADMIN_V2_API } from "./transaction-monitoring.api";

const TM_ADMIN_STALE_TIME = 30_000;

export const TM_ADMIN_V2_QUERY_KEYS = {
	all: ["transaction-monitoring-admin-v2"] as const,
	templates: (params?: TmAdminTemplateListQuery) =>
		["transaction-monitoring-admin-v2", "templates", params ?? {}] as const,
};

export const useTmAdminTemplatesV2Query = (
	params?: TmAdminTemplateListQuery,
): UseQueryResult<TmTemplateListData> =>
	useQuery<TmTemplateListData>({
		queryKey: TM_ADMIN_V2_QUERY_KEYS.templates(params),
		queryFn: () => TRANSACTION_MONITORING_ADMIN_V2_API.TEMPLATES(params),
		staleTime: TM_ADMIN_STALE_TIME,
	});
