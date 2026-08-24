import { TENANTS_API } from "../tenants/tenants.api";
import type { TenantCreateAndUpdate } from "../tenants/tenants.types";
import type { KYBApplication } from "./kyc.types";

export const KYC_API = {
	TENANT_DETAIL: async (tenantId: string) =>
		await TENANTS_API.MANAGE_DETAIL(tenantId),

	SAVE_COMPLIANCE: async (tenantId: string, complianceData: KYBApplication) =>
		await TENANTS_API.MANAGE_UPDATE(tenantId, {
			compliance_data: complianceData,
		}),

	SUBMIT_FOR_REVIEW: async (tenantId: string, complianceData: KYBApplication) =>
		await TENANTS_API.MANAGE_UPDATE(tenantId, {
			compliance_data: {
				...complianceData,
				submittedForReview: true,
				lastSubmissionDate: new Date().toISOString(),
			},
		}),
} as const;

export type KycTenantDetailResponse = TenantCreateAndUpdate;
