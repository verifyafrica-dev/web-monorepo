import type { VerificationRequestCreatePayload } from "#/api/http/v2/verifications/verifications.types";
import type { VerificationType } from "#/api/http/v2/verifications/verifications.types";
import { SHUFTI_CHOICES } from "#/lib/constants";

const ADDRESS_VERIFICATION_TYPE =
	"address_verification" satisfies VerificationType;

type LinkFormValues = {
	email: string;
	country: string;
	address: string;
	urlLimit: string;
};

type DirectFormValues = {
	email: string;
	country: string;
	address: string;
};

export function buildAddressVerificationLinkPayload(
	values: LinkFormValues,
): VerificationRequestCreatePayload {
	return {
		verification_type: ADDRESS_VERIFICATION_TYPE,
		method_type: "onsite",
		input_data: {
			country: values.country.trim().toUpperCase(),
			language: "EN",
			email: values.email.trim(),
			ttl: Number(values.urlLimit),
			address: {
				full_address: values.address.trim(),
				address_fuzzy_match: SHUFTI_CHOICES.YES,
				verification_mode: SHUFTI_CHOICES.ANY,
			},
		},
	};
}

export function buildAddressVerificationDirectPayload(
	values: DirectFormValues,
	proof: string,
): VerificationRequestCreatePayload {
	return {
		verification_type: ADDRESS_VERIFICATION_TYPE,
		method_type: "offsite",
		input_data: {
			country: values.country.trim().toUpperCase(),
			language: "EN",
			email: values.email.trim(),
			address: {
				full_address: values.address.trim(),
				address_fuzzy_match: SHUFTI_CHOICES.YES,
				verification_mode: SHUFTI_CHOICES.ANY,
				proof,
			},
		},
	};
}
