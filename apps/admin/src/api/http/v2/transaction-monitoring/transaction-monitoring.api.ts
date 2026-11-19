import { unwrapV2Data } from "@verifyafrica/api-client/http/shared";
import type {
	TmAdminTemplateListQuery,
	TmTemplate,
	TmTemplateListData,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";
import $http from "../../xhr";

const TM_ADMIN_ENDPOINTS = {
	templates: "/v2/transaction-monitoring/admin/templates/",
	template: (templateId: string) =>
		`/v2/transaction-monitoring/admin/templates/${templateId}/`,
} as const;

/**
 * Platform templates are a hardcoded replica of Autogon's console templates, so the
 * admin app can only read them (create/update return a validation error server-side).
 */
export const TRANSACTION_MONITORING_ADMIN_V2_API = {
	TEMPLATES: async (
		params?: TmAdminTemplateListQuery,
	): Promise<TmTemplateListData> =>
		await $http
			.get(TM_ADMIN_ENDPOINTS.templates, { params })
			.then((res) => unwrapV2Data<TmTemplateListData>(res)),

	TEMPLATE: async (templateId: string): Promise<TmTemplate> =>
		await $http
			.get(TM_ADMIN_ENDPOINTS.template(templateId))
			.then((res) => unwrapV2Data<TmTemplate>(res)),
};
