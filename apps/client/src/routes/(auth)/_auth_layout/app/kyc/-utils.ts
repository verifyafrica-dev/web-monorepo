import type { KycStatus } from "#/api/http/v2/tenants/tenants.types";
import type { SectionRejectedReason } from "#/api/http/v2/tenants/tenants.types";
import type { KYBApplication } from "#/api/http/v1/kyc/kyc.types";
import type { KycSectionPath } from "./-data";
import { SECTION_NAMES } from "./-data";

export type KycCompletionStatus = {
	basicInformation: boolean;
	primaryContact: boolean;
	directorsAndShareholders: boolean;
	businessActivity: boolean;
	onboardingQuestionnaire: boolean;
	documentsUpload: boolean;
	complianceDeclarations: boolean;
	authorizedSignature: boolean;
};

function hasStructuredDirectorAddress(
	address: KYBApplication["company"]["directors"][number]["address"],
) {
	if (typeof address === "string") {
		return false;
	}

	return Boolean(
		address?.address && address?.postal_code && address?.country,
	);
}

export function getKycCompletionStatus(kycData: KYBApplication): KycCompletionStatus {
	const primaryContact = kycData.company?.primary_contact ?? {
		name: "",
		email: "",
		phone: "",
		position: "",
	};
	const directors = kycData.company?.directors ?? [];
	const ubos = kycData.company?.ubos ?? [];
	const businessActivity = kycData.company?.business_activity ?? {
		nature_of_business: "",
		description_of_products_services: "",
		expected_monthly_verification_volume: "",
		main_geographies_of_clients: [],
		regulatory_licenses_held: [],
	};
	const documents = kycData.documents ?? {
		directors_identification: [],
		proof_of_business_address: [],
		proof_of_directors_address: [],
		proof_of_website_domain_ownership: [],
		legal_company_license: [],
	};
	const complianceDeclarations = kycData.compliance_declarations ?? {
		not_engaged_in_prohibited_activities: false,
		no_directors_ubos_on_sanctions_lists: false,
		information_true_and_complete: false,
		agree_to_provide_supporting_documents: false,
	};
	const onboardingQuestionnaire = kycData.onboarding_questionnaire ?? {
		purpose_of_account: "",
		target_clients: "",
		average_client_transaction_size_eur: 0,
		high_risk_jurisdictions_fatf_exposure: "",
		main_banking_payment_partners: "",
	};
	const authorizedSignature = kycData.authorized_signature ?? {
		full_name: "",
		position_title: "",
		date: "",
	};

	const allDirectorsHaveCompleteAddress =
		directors.length > 0 &&
		directors.every((director) => hasStructuredDirectorAddress(director.address));

	return {
		basicInformation: Boolean(
			kycData.company?.legal_name &&
				kycData.company?.date_of_incorporation &&
				kycData.company?.registration_number &&
				kycData.company?.registered_address?.address,
		),
		primaryContact: Boolean(
			primaryContact.name && primaryContact.email && primaryContact.phone,
		),
		directorsAndShareholders: Boolean(
			directors.length > 0 && ubos.length > 0 && allDirectorsHaveCompleteAddress,
		),
		businessActivity: Boolean(
			businessActivity.nature_of_business &&
				businessActivity.description_of_products_services &&
				businessActivity.main_geographies_of_clients?.length > 0,
		),
		onboardingQuestionnaire: Boolean(
			onboardingQuestionnaire.purpose_of_account &&
				onboardingQuestionnaire.aml_ctf_officer?.name &&
				onboardingQuestionnaire.aml_ctf_officer?.email,
		),
		documentsUpload: Boolean(
			documents.directors_identification?.length > 0 &&
				documents.proof_of_business_address?.length > 0 &&
				documents.proof_of_directors_address?.length > 0 &&
				documents.proof_of_website_domain_ownership?.length > 0 &&
				documents.legal_company_license?.length > 0,
		),
		complianceDeclarations: Boolean(
			complianceDeclarations.not_engaged_in_prohibited_activities &&
				complianceDeclarations.no_directors_ubos_on_sanctions_lists &&
				complianceDeclarations.information_true_and_complete &&
				complianceDeclarations.agree_to_provide_supporting_documents,
		),
		authorizedSignature: Boolean(
			authorizedSignature.full_name &&
				authorizedSignature.position_title &&
				authorizedSignature.signature,
		),
	};
}

export function isKycSectionCompleted(
	path: KycSectionPath,
	completionStatus: KycCompletionStatus,
) {
	switch (path) {
		case SECTION_NAMES.BASIC_INFORMATION:
			return completionStatus.basicInformation;
		case SECTION_NAMES.PRIMARY_CONTACT:
			return completionStatus.primaryContact;
		case SECTION_NAMES.DIRECTORS_AND_SHAREHOLDERS:
			return completionStatus.directorsAndShareholders;
		case SECTION_NAMES.BUSINESS_ACTIVITY:
			return completionStatus.businessActivity;
		case SECTION_NAMES.ONBOARDING_QUESTIONNAIRE:
			return completionStatus.onboardingQuestionnaire;
		case SECTION_NAMES.DOCUMENTS_UPLOAD:
			return completionStatus.documentsUpload;
		case SECTION_NAMES.COMPLIANCE_DECLARATIONS:
			return completionStatus.complianceDeclarations;
		case SECTION_NAMES.AUTHORIZED_SIGNATURE:
			return completionStatus.authorizedSignature;
		default:
			return false;
	}
}

export function getNextIncompleteSectionPath(
	currentPath: KycSectionPath,
	completionStatus: KycCompletionStatus,
	sectionPaths: readonly KycSectionPath[],
) {
	const currentIndex = sectionPaths.indexOf(currentPath);

	if (currentIndex === -1 || currentIndex >= sectionPaths.length - 1) {
		return null;
	}

	const remainingPaths = sectionPaths.slice(currentIndex + 1);
	return (
		remainingPaths.find((path) => !isKycSectionCompleted(path, completionStatus)) ??
		null
	);
}

export function getKycDisplayStatus({
	kyc_verified,
	kyc_status,
}: {
	kyc_verified: boolean;
	kyc_status: KycStatus;
}) {
	if (kyc_verified || kyc_status === "verified") {
		return "approved" as const;
	}

	if (kyc_status === "rejected") {
		return "rejected" as const;
	}

	if (kyc_status === "submitted") {
		return "submitted" as const;
	}

	return "pending" as const;
}

const SECTION_REJECTION_LABELS: Record<keyof SectionRejectedReason, string> = {
	basic_information: "Basic Information",
	primary_contact: "Primary Contact",
	directors_and_shareholders: "Directors and Shareholders",
	business_activity: "Business Activity",
	onboarding_questionnaire: "Onboarding Questionnaire",
	documents_upload: "Documents Upload",
	compliance_declarations: "Compliance Declarations",
	authorized_signature: "Authorized Signature",
};

export function getSectionRejectionEntries(
	sectionRejectedReason: SectionRejectedReason,
) {
	return (Object.entries(sectionRejectedReason) as [keyof SectionRejectedReason, string | null][])
		.filter(([, reason]) => Boolean(reason?.trim()))
		.map(([key, reason]) => ({
			section: SECTION_REJECTION_LABELS[key],
			reason: reason?.trim() ?? "",
		}));
}

export function parseRejectedReasons(reason?: string | null) {
	if (!reason?.trim()) {
		return [];
	}

	return reason
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => line.replace(/^\d+\.\s*/, ""));
}

export function formatRejectedAt(rejectedAt?: string | null) {
	if (!rejectedAt) {
		return null;
	}

	return new Date(rejectedAt).toLocaleString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}
