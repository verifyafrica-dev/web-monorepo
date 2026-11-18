import { unwrapV2Data } from "@verifyafrica/api-client/http/shared";
import type {
	TmAdminTemplateListQuery,
	TmCreatePlatformTemplatePayload,
	TmFeatureCatalogData,
	TmTemplate,
	TmTemplateListData,
	TmUpdatePlatformTemplatePayload,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";
import $http from "../../xhr";
import { TENANTS_V2_API } from "../tenants/tenants.api";

const TM_ADMIN_ENDPOINTS = {
	templates: "/v2/transaction-monitoring/admin/templates/",
	template: (templateId: string) =>
		`/v2/transaction-monitoring/admin/templates/${templateId}/`,
	features: "/v2/transaction-monitoring/features/",
} as const;

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

	CREATE_TEMPLATE: async (
		data: TmCreatePlatformTemplatePayload,
	): Promise<TmTemplate> =>
		await $http
			.post(TM_ADMIN_ENDPOINTS.templates, data)
			.then((res) => unwrapV2Data<TmTemplate>(res)),

	UPDATE_TEMPLATE: async (
		templateId: string,
		data: TmUpdatePlatformTemplatePayload,
	): Promise<TmTemplate> =>
		await $http
			.patch(TM_ADMIN_ENDPOINTS.template(templateId), data)
			.then((res) => unwrapV2Data<TmTemplate>(res)),

	/**
	 * TODO(backend): `GET /features/` currently requires an `X-TENANT-ID` header
	 * (superusers may target any tenant) but the catalog itself is global. Until
	 * an admin-scoped endpoint exists, borrow the first tenant's id. Replace this
	 * with a header-less call once the backend allows it.
	 */
	FEATURES: async (): Promise<TmFeatureCatalogData> => {
		const tenants = await TENANTS_V2_API.ALL_LIST({ per_page: 1 });
		const tenantId = tenants.items[0]?.id;
		if (!tenantId) {
			throw new Error(
				"At least one tenant must exist to load the feature catalog.",
			);
		}
		return await $http
			.get(TM_ADMIN_ENDPOINTS.features, {
				headers: { "X-TENANT-ID": tenantId },
			})
			.then((res) => unwrapV2Data<TmFeatureCatalogData>(res));
	},
};
