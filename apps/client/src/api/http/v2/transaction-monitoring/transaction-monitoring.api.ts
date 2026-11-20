import { unwrapV2Data } from "@verifyafrica/api-client/http/shared";
import type {
	TmCase,
	TmCaseListData,
	TmCaseListQuery,
	TmCreateMonitorPayload,
	TmCreateReportPayload,
	TmFeatureCatalogData,
	TmFeatureListQuery,
	TmMonitor,
	TmMonitorListData,
	TmMonitorListQuery,
	TmOutcomePayload,
	TmOutcomeResult,
	TmReport,
	TmScorePayload,
	TmScoreResult,
	TmTemplateListData,
	TmTemplateListQuery,
	TmUpdateCasePayload,
	TmUpdateMonitorPayload,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";
import $http from "../../xhr";

const TENANT_ID_HEADER = "X-TENANT-ID";

const TM_V2_ENDPOINTS = {
	features: "/v2/transaction-monitoring/features/",
	templates: "/v2/transaction-monitoring/templates/",
	monitors: "/v2/transaction-monitoring/monitors/",
	monitor: (monitorId: string) =>
		`/v2/transaction-monitoring/monitors/${monitorId}/`,
	score: "/v2/transaction-monitoring/score/",
	outcome: "/v2/transaction-monitoring/outcome/",
	cases: "/v2/transaction-monitoring/cases/",
	case: (caseId: string) => `/v2/transaction-monitoring/cases/${caseId}/`,
	reports: "/v2/transaction-monitoring/reports/",
	report: (reportId: string) =>
		`/v2/transaction-monitoring/reports/${reportId}/`,
} as const;

const withTenantHeader = (tenantId: string) => ({
	headers: {
		[TENANT_ID_HEADER]: tenantId,
	},
});

export const TRANSACTION_MONITORING_V2_API = {
	FEATURES: async (
		tenantId: string,
		params?: TmFeatureListQuery,
	): Promise<TmFeatureCatalogData> =>
		await $http
			.get(TM_V2_ENDPOINTS.features, { ...withTenantHeader(tenantId), params })
			.then((res) => unwrapV2Data<TmFeatureCatalogData>(res)),

	TEMPLATES: async (
		tenantId: string,
		params?: TmTemplateListQuery,
	): Promise<TmTemplateListData> =>
		await $http
			.get(TM_V2_ENDPOINTS.templates, { ...withTenantHeader(tenantId), params })
			.then((res) => unwrapV2Data<TmTemplateListData>(res)),

	MONITORS: async (
		tenantId: string,
		params?: TmMonitorListQuery,
	): Promise<TmMonitorListData> =>
		await $http
			.get(TM_V2_ENDPOINTS.monitors, { ...withTenantHeader(tenantId), params })
			.then((res) => unwrapV2Data<TmMonitorListData>(res)),

	MONITOR: async (tenantId: string, monitorId: string): Promise<TmMonitor> =>
		await $http
			.get(TM_V2_ENDPOINTS.monitor(monitorId), withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TmMonitor>(res)),

	CREATE_MONITOR: async (
		tenantId: string,
		data: TmCreateMonitorPayload,
	): Promise<TmMonitor> =>
		await $http
			.post(TM_V2_ENDPOINTS.monitors, data, {
				...withTenantHeader(tenantId),
				// Omniguard create + optional rule probe can exceed the default 30s.
				timeout: 90_000,
			})
			.then((res) => unwrapV2Data<TmMonitor>(res)),

	UPDATE_MONITOR: async (
		tenantId: string,
		monitorId: string,
		data: TmUpdateMonitorPayload,
	): Promise<TmMonitor> =>
		await $http
			.patch(
				TM_V2_ENDPOINTS.monitor(monitorId),
				data,
				withTenantHeader(tenantId),
			)
			.then((res) => unwrapV2Data<TmMonitor>(res)),

	SCORE: async (
		tenantId: string,
		data: TmScorePayload,
	): Promise<TmScoreResult> =>
		await $http
			.post(TM_V2_ENDPOINTS.score, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TmScoreResult>(res)),

	OUTCOME: async (
		tenantId: string,
		data: TmOutcomePayload,
	): Promise<TmOutcomeResult> =>
		await $http
			.post(TM_V2_ENDPOINTS.outcome, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TmOutcomeResult>(res)),

	CASES: async (
		tenantId: string,
		params?: TmCaseListQuery,
	): Promise<TmCaseListData> =>
		await $http
			.get(TM_V2_ENDPOINTS.cases, { ...withTenantHeader(tenantId), params })
			.then((res) => unwrapV2Data<TmCaseListData>(res)),

	UPDATE_CASE: async (
		tenantId: string,
		caseId: string,
		data: TmUpdateCasePayload,
	): Promise<TmCase> =>
		await $http
			.patch(TM_V2_ENDPOINTS.case(caseId), data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TmCase>(res)),

	CREATE_REPORT: async (
		tenantId: string,
		data: TmCreateReportPayload,
	): Promise<TmReport> =>
		await $http
			.post(TM_V2_ENDPOINTS.reports, data, withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TmReport>(res)),

	REPORT: async (tenantId: string, reportId: string): Promise<TmReport> =>
		await $http
			.get(TM_V2_ENDPOINTS.report(reportId), withTenantHeader(tenantId))
			.then((res) => unwrapV2Data<TmReport>(res)),
};
