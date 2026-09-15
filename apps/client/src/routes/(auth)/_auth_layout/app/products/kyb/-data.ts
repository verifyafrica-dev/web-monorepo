import type {
	VerificationRequestCreatePayload,
	VerificationType,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

const KYB_VERIFICATION_TYPE = "kyb_screening" satisfies VerificationType;

type KybFormValues = {
	email: string;
	businessJurisdiction: string;
	companyName: string;
	companyRegistrationNumber: string;
	urlLimit?: string;
};

export function buildKybVerificationLinkPayload(
	values: KybFormValues,
): VerificationRequestCreatePayload {
	const country = values.businessJurisdiction.trim().toUpperCase();
	return {
		verification_type: KYB_VERIFICATION_TYPE,
		method_type: "new_link",
		input_data: {
			...(country ? { country } : {}),
			language: "EN",
			email: values.email.trim(),
			ttl: Number(values.urlLimit),
			kyb: {
				...(country ? { company_jurisdiction_code: country } : {}),
				search_type: "fuzzy",
			},
		},
	};
}

export function buildKybVerificationPayload(
	values: KybFormValues,
): VerificationRequestCreatePayload {
	return {
		verification_type: KYB_VERIFICATION_TYPE,
		method_type: "offsite",
		input_data: {
			country: values.businessJurisdiction.trim().toUpperCase(),
			language: "EN",
			email: values.email.trim(),
			kyb: {
				company_name: values.companyName.trim(),
				company_registration_number: values.companyRegistrationNumber.trim(),
				company_jurisdiction_code: values.businessJurisdiction
					.trim()
					.toUpperCase(),
				search_type: "fuzzy",
			},
		},
	};
}
