import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
} from "react";
import { toast } from "sonner";

import {
	useSaveKycSectionMutation,
} from "#/api/http/v1/kyc/kyc.hooks";
import {
	normalizeComplianceData,
	type KYBApplication,
} from "#/api/http/v1/kyc/kyc.types";
import type {
	KycComplianceSection,
	KycSectionUpdatePayload,
	SectionRejectedReason,
	KycSummary,
	TenantDetail,
} from "#/api/http/v2/tenants/tenants.types";
import { getUserTenantMembership } from "../../team/-data";
import { useAuthStore } from "#/stores/auth-store";
import type { KycSectionPath } from "../-data";
import { KYC_SECTION_PATHS } from "../-data";
import {
	getKycCompletionStatus,
	getNextIncompleteSectionPath,
	isKycSectionCompleted,
	type KycCompletionStatus,
} from "../-utils";

type KycContextValue = {
	tenantId: string;
	tenantSlug: string;
	kycData: KYBApplication;
	kyc: KycSummary;
	sectionRejectedReason: SectionRejectedReason;
	isReadOnly: boolean;
	isSaving: boolean;
	completionStatus: KycCompletionStatus;
	allSectionsCompleted: boolean;
	saveSection: (
		section: KycComplianceSection,
		payload: KycSectionUpdatePayload,
		options?: { navigateNext?: boolean; currentSection?: KycSectionPath },
	) => Promise<void>;
	onNavigateToSection: (path: KycSectionPath | null) => void;
};

const KycContext = createContext<KycContextValue | null>(null);

export function KycProvider({
	children,
	tenantId,
	tenant,
	onNavigateToSection,
}: {
	children: ReactNode;
	tenantId: string;
	tenant: TenantDetail;
	onNavigateToSection: (path: KycSectionPath | null) => void;
}) {
	const saveMutation = useSaveKycSectionMutation(tenantId);
	const kyc = tenant.kyc;
	const kycData = useMemo(
		() => normalizeComplianceData(tenant.compliance_data),
		[tenant.compliance_data],
	);
	const isReadOnly =
		kyc.kyc_verified ||
		kyc.kyc_status === "submitted" ||
		kyc.kyc_status === "verified";

	const completionStatus = useMemo(
		() => getKycCompletionStatus(kycData),
		[kycData],
	);

	const allSectionsCompleted = useMemo(
		() => Object.values(completionStatus).every(Boolean),
		[completionStatus],
	);

	const saveSection = useCallback(
		async (
			section: KycComplianceSection,
			payload: KycSectionUpdatePayload,
			options?: { navigateNext?: boolean; currentSection?: KycSectionPath },
		) => {
			if (isReadOnly) {
				return;
			}

			await saveMutation.mutateAsync(
				{ section, payload },
				{
					onSuccess: () => {
						toast.success("Compliance data saved successfully");

						if (options?.navigateNext !== false && options?.currentSection) {
							const nextPath = getNextIncompleteSectionPath(
								options.currentSection,
								completionStatus,
								KYC_SECTION_PATHS,
							);
							onNavigateToSection(nextPath);
						}
					},
					onError: () => {
						toast.error("Failed to save compliance data. Please try again.");
					},
				},
			);
		},
		[isReadOnly, saveMutation, completionStatus, onNavigateToSection],
	);

	const value = useMemo<KycContextValue>(
		() => ({
			tenantId,
			tenantSlug: tenant.slug,
			kycData,
			kyc,
			sectionRejectedReason: tenant.section_rejected_reason,
			isReadOnly,
			isSaving: saveMutation.isPending,
			completionStatus,
			allSectionsCompleted,
			saveSection,
			onNavigateToSection,
		}),
		[
			tenantId,
			tenant.slug,
			kycData,
			kyc,
			tenant.section_rejected_reason,
			isReadOnly,
			saveMutation.isPending,
			completionStatus,
			allSectionsCompleted,
			saveSection,
			onNavigateToSection,
		],
	);

	return <KycContext.Provider value={value}>{children}</KycContext.Provider>;
}

export function useKyc() {
	const context = useContext(KycContext);

	if (!context) {
		throw new Error("useKyc must be used within KycProvider");
	}

	return context;
}

export function useKycSectionCompletion(path: KycSectionPath) {
	const { completionStatus } = useKyc();

	return isKycSectionCompleted(path, completionStatus);
}

export function useKycTenantId() {
	const user = useAuthStore((state) => state.user);

	return user ? getUserTenantMembership(user)?.id : undefined;
}
