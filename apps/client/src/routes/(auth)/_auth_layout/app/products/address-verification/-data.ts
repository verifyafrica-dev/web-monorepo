import type { VerificationRequestCreatePayload } from "#/api/http/v2/verifications/verifications.types";
import type { VerificationType } from "#/api/http/v2/verifications/verifications.types";
import {
	SHUFTI_ADDRESS_RECOMMENDED_SUPPORTED_TYPES,
	SHUFTI_CHOICES,
	type ShuftiAddressSupportedType,
} from "@verifyafrica/ui/lib/constants";

const ADDRESS_VERIFICATION_TYPE =
	"address_verification" satisfies VerificationType;

type LinkFormValues = {
	email: string;
	country: string;
	address: string;
	urlLimit: string;
	documentTypes: ShuftiAddressSupportedType[];
};

type DirectFormValues = {
	email: string;
	country: string;
	address: string;
	documentTypes: ShuftiAddressSupportedType[];
};

export const DEFAULT_ADDRESS_DOCUMENT_TYPES = [
	...SHUFTI_ADDRESS_RECOMMENDED_SUPPORTED_TYPES,
];

function addressPayload(values: {
	address: string;
	documentTypes: ShuftiAddressSupportedType[];
}) {
	return {
		full_address: values.address.trim(),
		address_fuzzy_match: SHUFTI_CHOICES.YES,
		verification_mode: SHUFTI_CHOICES.ANY,
		supported_types: values.documentTypes,
	};
}

export function buildAddressVerificationLinkPayload(
	values: LinkFormValues,
): VerificationRequestCreatePayload {
	return {
		verification_type: ADDRESS_VERIFICATION_TYPE,
		method_type: "new_link",
		input_data: {
			country: values.country.trim().toUpperCase(),
			language: "EN",
			email: values.email.trim(),
			ttl: Number(values.urlLimit),
			address: addressPayload(values),
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
				...addressPayload(values),
				proof,
			},
		},
	};
}
