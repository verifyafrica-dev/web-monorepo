import {
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

import type {
	TmCaseListData,
	TmCaseListQuery,
	TmCreateMonitorPayload,
	TmCreateReportPayload,
	TmFeatureCatalogData,
	TmMonitor,
	TmMonitorListData,
	TmMonitorListQuery,
	TmOutcomePayload,
	TmScorePayload,
	TmTemplateListData,
	TmUpdateCasePayload,
	TmUpdateMonitorPayload,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";

import { useOrganizationQueryKey } from "../organization-query";
import { TRANSACTION_MONITORING_V2_API } from "./transaction-monitoring.api";

/** Catalog + templates change rarely (admin-managed), so cache them longer. */
const TM_CATALOG_STALE_TIME = 5 * 60_000;
const TM_STALE_TIME = 30_000;

export const TM_V2_QUERY_KEYS = {
	all: ["transaction-monitoring-v2"] as const,
	features: (tenantId: string) =>
		["transaction-monitoring-v2", "features", tenantId] as const,
	templates: (tenantId: string) =>
		["transaction-monitoring-v2", "templates", tenantId] as const,
	monitors: (tenantId: string, params?: TmMonitorListQuery) =>
		["transaction-monitoring-v2", "monitors", tenantId, params ?? {}] as const,
	monitor: (tenantId: string, monitorId: string) =>
		["transaction-monitoring-v2", "monitor", tenantId, monitorId] as const,
	cases: (tenantId: string, params?: TmCaseListQuery) =>
		["transaction-monitoring-v2", "cases", tenantId, params ?? {}] as const,
};

export const useTmFeaturesV2Query = (
	tenantId: string | undefined,
	enabled = true,
): UseQueryResult<TmFeatureCatalogData> =>
	useQuery<TmFeatureCatalogData>({
		queryKey: useOrganizationQueryKey(
			TM_V2_QUERY_KEYS.features(tenantId ?? ""),
		),
		queryFn: () => {
			if (!tenantId) throw new Error("Tenant ID is required");
			return TRANSACTION_MONITORING_V2_API.FEATURES(tenantId);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: TM_CATALOG_STALE_TIME,
	});

export const useTmTemplatesV2Query = (
	tenantId: string | undefined,
	enabled = true,
): UseQueryResult<TmTemplateListData> =>
	useQuery<TmTemplateListData>({
		queryKey: useOrganizationQueryKey(
			TM_V2_QUERY_KEYS.templates(tenantId ?? ""),
		),
		queryFn: () => {
			if (!tenantId) throw new Error("Tenant ID is required");
			return TRANSACTION_MONITORING_V2_API.TEMPLATES(tenantId);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: TM_CATALOG_STALE_TIME,
	});

export const useTmMonitorsV2Query = (
	tenantId: string | undefined,
	params?: TmMonitorListQuery,
	enabled = true,
): UseQueryResult<TmMonitorListData> =>
	useQuery<TmMonitorListData>({
		queryKey: useOrganizationQueryKey(
			TM_V2_QUERY_KEYS.monitors(tenantId ?? "", params),
		),
		queryFn: () => {
			if (!tenantId) throw new Error("Tenant ID is required");
			return TRANSACTION_MONITORING_V2_API.MONITORS(tenantId, params);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: TM_STALE_TIME,
	});

export const useTmMonitorV2Query = (
	tenantId: string | undefined,
	monitorId: string | undefined,
	enabled = true,
): UseQueryResult<TmMonitor> =>
	useQuery<TmMonitor>({
		queryKey: useOrganizationQueryKey(
			TM_V2_QUERY_KEYS.monitor(tenantId ?? "", monitorId ?? ""),
		),
		queryFn: () => {
			if (!tenantId || !monitorId) throw new Error("Monitor is required");
			return TRANSACTION_MONITORING_V2_API.MONITOR(tenantId, monitorId);
		},
		enabled: enabled && Boolean(tenantId) && Boolean(monitorId),
		staleTime: TM_STALE_TIME,
	});

export const useTmCasesV2Query = (
	tenantId: string | undefined,
	params?: TmCaseListQuery,
	enabled = true,
): UseQueryResult<TmCaseListData> =>
	useQuery<TmCaseListData>({
		queryKey: useOrganizationQueryKey(
			TM_V2_QUERY_KEYS.cases(tenantId ?? "", params),
		),
		queryFn: () => {
			if (!tenantId) throw new Error("Tenant ID is required");
			return TRANSACTION_MONITORING_V2_API.CASES(tenantId, params);
		},
		enabled: enabled && Boolean(tenantId),
		staleTime: TM_STALE_TIME,
	});

/**
 * Invalidating by the shared prefix keeps list + detail + dashboard counts in
 * sync without hand-maintaining every key variant (they all embed api mode +
 * organization id via `useOrganizationQueryKey`).
 */
function useInvalidateTm() {
	const queryClient = useQueryClient();
	return (scope: "monitors" | "cases") =>
		queryClient.invalidateQueries({
			predicate: (query) =>
				query.queryKey.includes(TM_V2_QUERY_KEYS.all[0]) &&
				query.queryKey.includes(scope === "monitors" ? "monitors" : "cases"),
		});
}

export const useCreateTmMonitorV2Mutation = (tenantId: string) => {
	const invalidate = useInvalidateTm();
	return useMutation({
		mutationFn: (payload: TmCreateMonitorPayload) =>
			TRANSACTION_MONITORING_V2_API.CREATE_MONITOR(tenantId, payload),
		onSuccess: () => invalidate("monitors"),
	});
};

export const useUpdateTmMonitorV2Mutation = (tenantId: string) => {
	const queryClient = useQueryClient();
	const invalidate = useInvalidateTm();
	return useMutation({
		mutationFn: ({
			monitorId,
			payload,
		}: {
			monitorId: string;
			payload: TmUpdateMonitorPayload;
		}) =>
			TRANSACTION_MONITORING_V2_API.UPDATE_MONITOR(
				tenantId,
				monitorId,
				payload,
			),
		onSuccess: (data) => {
			void invalidate("monitors");
			// Detail view reads from its own key; refresh it directly.
			void queryClient.invalidateQueries({
				predicate: (query) =>
					query.queryKey.includes("monitor") &&
					query.queryKey.includes(data.monitor_id),
			});
		},
	});
};

export const useTmScoreV2Mutation = (tenantId: string) => {
	const invalidate = useInvalidateTm();
	return useMutation({
		mutationFn: (payload: TmScorePayload) =>
			TRANSACTION_MONITORING_V2_API.SCORE(tenantId, payload),
		// A score above the monitor's auto-case threshold opens a case server-side.
		onSuccess: () => invalidate("cases"),
	});
};

export const useTmOutcomeV2Mutation = (tenantId: string) =>
	useMutation({
		mutationFn: (payload: TmOutcomePayload) =>
			TRANSACTION_MONITORING_V2_API.OUTCOME(tenantId, payload),
	});

export const useUpdateTmCaseV2Mutation = (tenantId: string) => {
	const invalidate = useInvalidateTm();
	return useMutation({
		mutationFn: ({
			caseId,
			payload,
		}: {
			caseId: string;
			payload: TmUpdateCasePayload;
		}) => TRANSACTION_MONITORING_V2_API.UPDATE_CASE(tenantId, caseId, payload),
		onSuccess: () => invalidate("cases"),
	});
};

export const useCreateTmReportV2Mutation = (tenantId: string) =>
	useMutation({
		mutationFn: (payload: TmCreateReportPayload) =>
			TRANSACTION_MONITORING_V2_API.CREATE_REPORT(tenantId, payload),
	});
