import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { TENANTS_V2_API } from "#/api/http/v2/tenants/tenants.api";
import { TENANTS_V2_QUERY_KEYS } from "#/api/http/v2/tenants/tenants.hooks";
import type {
	KycComplianceSection,
	KycSectionUpdatePayload,
} from "#/api/http/v2/tenants/tenants.types";

const KYC_STALE_TIME = 60_000;

export const KYC_QUERY_KEYS = {
	all: ["kyc"] as const,
	tenant: (tenantId: string) => TENANTS_V2_QUERY_KEYS.detail(tenantId),
} as const;

export const useKycTenantQuery = (
	tenantId: string | undefined,
	enabled = true,
) =>
	useQuery({
		queryKey: KYC_QUERY_KEYS.tenant(tenantId ?? ""),
		queryFn: () => TENANTS_V2_API.DETAIL(tenantId ?? ""),
		enabled: enabled && Boolean(tenantId),
		staleTime: KYC_STALE_TIME,
	});

export const useSaveKycSectionMutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			section,
			payload,
		}: {
			section: KycComplianceSection;
			payload: KycSectionUpdatePayload;
		}) => TENANTS_V2_API.UPDATE_COMPLIANCE_SECTION(tenantId, section, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: TENANTS_V2_QUERY_KEYS.detail(tenantId),
			});
		},
	});
};

export const useSubmitKycForReviewMutation = (tenantId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => TENANTS_V2_API.SUBMIT_COMPLIANCE(tenantId),
		onSuccess: (tenant) => {
			queryClient.setQueryData(TENANTS_V2_QUERY_KEYS.detail(tenantId), tenant);
		},
	});
};
