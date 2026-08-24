import type {
	VerificationRequestCreatePayload,
	VerificationType,
} from "#/api/http/v2/verifications/verifications.types";

const KYB_VERIFICATION_TYPE = "kyb_screening" satisfies VerificationType;

type KybFormValues = {
	email: string;
	businessJurisdiction: string;
	companyName: string;
	companyRegistrationNumber: string;
};

export function buildKybVerificationPayload(
	values: KybFormValues,
): VerificationRequestCreatePayload {
	return {
		verification_type: KYB_VERIFICATION_TYPE,
		method_type: "offsite",
		input_data: {
			country: "",
			language: "EN",
			email: values.email.trim(),
			kyb: {
				company_registration_number: values.companyRegistrationNumber.trim(),
				company_jurisdiction_code: values.businessJurisdiction
					.trim()
					.toUpperCase(),
				search_type: "fuzzy",
			},
		},
	};
}
