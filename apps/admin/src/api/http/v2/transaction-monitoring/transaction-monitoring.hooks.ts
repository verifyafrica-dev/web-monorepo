import {
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import type {
	TmAdminTemplateListQuery,
	TmCreatePlatformTemplatePayload,
	TmFeatureCatalogData,
	TmTemplateListData,
	TmUpdatePlatformTemplatePayload,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";

import { TRANSACTION_MONITORING_ADMIN_V2_API } from "./transaction-monitoring.api";

const TM_ADMIN_STALE_TIME = 30_000;

export const TM_ADMIN_V2_QUERY_KEYS = {
	all: ["transaction-monitoring-admin-v2"] as const,
	templates: (params?: TmAdminTemplateListQuery) =>
		["transaction-monitoring-admin-v2", "templates", params ?? {}] as const,
	features: ["transaction-monitoring-admin-v2", "features"] as const,
};

export const useTmAdminTemplatesV2Query = (
	params?: TmAdminTemplateListQuery,
): UseQueryResult<TmTemplateListData> =>
	useQuery<TmTemplateListData>({
		queryKey: TM_ADMIN_V2_QUERY_KEYS.templates(params),
		queryFn: () => TRANSACTION_MONITORING_ADMIN_V2_API.TEMPLATES(params),
		staleTime: TM_ADMIN_STALE_TIME,
	});

export const useTmAdminFeaturesV2Query = (
	enabled = true,
): UseQueryResult<TmFeatureCatalogData> =>
	useQuery<TmFeatureCatalogData>({
		queryKey: TM_ADMIN_V2_QUERY_KEYS.features,
		queryFn: () => TRANSACTION_MONITORING_ADMIN_V2_API.FEATURES(),
		enabled,
		staleTime: 5 * 60_000,
	});

export const useCreateTmPlatformTemplateV2Mutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: TmCreatePlatformTemplatePayload) =>
			TRANSACTION_MONITORING_ADMIN_V2_API.CREATE_TEMPLATE(payload),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: [...TM_ADMIN_V2_QUERY_KEYS.all, "templates"],
			}),
	});
};

export const useUpdateTmPlatformTemplateV2Mutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			templateId,
			payload,
		}: {
			templateId: string;
			payload: TmUpdatePlatformTemplatePayload;
		}) =>
			TRANSACTION_MONITORING_ADMIN_V2_API.UPDATE_TEMPLATE(templateId, payload),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: [...TM_ADMIN_V2_QUERY_KEYS.all, "templates"],
			}),
	});
};
