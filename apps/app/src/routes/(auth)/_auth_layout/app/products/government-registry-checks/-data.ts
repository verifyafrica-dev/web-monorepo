import type {
	VerificationRequestCreatePayload,
	VerificationType,
} from "#/api/http/v2/verifications/verifications.types";
import { VERIFICATION_TYPES } from "#/lib/constants";

export const REGISTRY_COUNTRY_CODES = ["ng", "za", "gh", "ke"] as const;

export type RegistryCountryCode = (typeof REGISTRY_COUNTRY_CODES)[number];

export type RegistryVerificationType = {
	value: string;
	label: string;
	countryCode: RegistryCountryCode;
	description: string;
	requiredParameters: string[];
	validationParameters: string[];
};

const REGISTRY_VERIFICATION_TYPES: RegistryVerificationType[] = [
	{
		value: VERIFICATION_TYPES.ZA_SAID_VERIFICATION.value,
		label: "South Africa ID Verification",
		countryCode: "za",
		description: "Verify South African ID numbers",
		requiredParameters: ["id_number"],
		validationParameters: ["first_name", "last_name", "date_of_birth"],
	},
	{
		value: VERIFICATION_TYPES.NG_BVN_VERIFICATION.value,
		label: "Nigeria BVN Verification",
		countryCode: "ng",
		description: "Verify Nigerian Bank Verification Number",
		requiredParameters: ["bvn"],
		validationParameters: ["first_name", "last_name", "date_of_birth", "selfie"],
	},
	{
		value: VERIFICATION_TYPES.NG_NIN_VERIFICATION.value,
		label: "Nigeria NIN Verification",
		countryCode: "ng",
		description: "Verify Nigerian National Identification Number",
		requiredParameters: ["nin"],
		validationParameters: ["first_name", "last_name", "date_of_birth", "selfie"],
	},
	{
		value: VERIFICATION_TYPES.NG_VIRTUAL_NIN_VERIFICATION.value,
		label: "Nigeria Virtual NIN",
		countryCode: "ng",
		description: "Verify Nigerian Virtual NIN",
		requiredParameters: ["virtual_nin"],
		validationParameters: ["first_name", "last_name", "date_of_birth", "selfie"],
	},
	{
		value: VERIFICATION_TYPES.NG_ADVANCED_PHONE_NUMBER_VERIFICATION.value,
		label: "Nigeria Phone Verification",
		countryCode: "ng",
		description: "Advanced phone number verification with validation",
		requiredParameters: ["phone_number"],
		validationParameters: ["first_name", "last_name", "date_of_birth", "selfie"],
	},
	{
		value: VERIFICATION_TYPES.NG_PHONE_NUMBER_LOOKUP.value,
		label: "Nigeria Phone Lookup",
		countryCode: "ng",
		description: "Basic phone number lookup",
		requiredParameters: ["phone_number"],
		validationParameters: [],
	},
	{
		value: VERIFICATION_TYPES.NG_CAC_LOOKUP.value,
		label: "Nigeria CAC Lookup",
		countryCode: "ng",
		description: "Corporate Affairs Commission lookup",
		requiredParameters: ["cac_number"],
		validationParameters: [],
	},
	{
		value: VERIFICATION_TYPES.NG_PASSPORT_VERIFICATION.value,
		label: "Nigeria Passport Verification",
		countryCode: "ng",
		description: "Verify Nigerian international passport",
		requiredParameters: ["passport_id", "last_name"],
		validationParameters: [],
	},
	{
		value: VERIFICATION_TYPES.GH_PASSPORT_LOOKUP.value,
		label: "Ghana Passport Lookup",
		countryCode: "gh",
		description: "Verify Ghanaian passport",
		requiredParameters: ["passport_number"],
		validationParameters: ["first_name", "last_name", "date_of_birth"],
	},
	{
		value: VERIFICATION_TYPES.GH_VOTER_CARD_LOOKUP.value,
		label: "Ghana Voter Card Lookup",
		countryCode: "gh",
		description: "Verify Ghanaian voter card",
		requiredParameters: ["voter_id"],
		validationParameters: ["first_name", "last_name", "date_of_birth", "selfie"],
	},
	{
		value: VERIFICATION_TYPES.GH_SSNIT_LOOKUP.value,
		label: "Ghana SSNIT Lookup",
		countryCode: "gh",
		description: "Verify Ghana SSNIT number",
		requiredParameters: ["ssnit_number"],
		validationParameters: ["first_name", "last_name", "date_of_birth", "selfie"],
	},
	{
		value: VERIFICATION_TYPES.GH_DRIVERS_LICENSE_LOOKUP.value,
		label: "Ghana Driver's License",
		countryCode: "gh",
		description: "Verify Ghanaian driver's license",
		requiredParameters: ["license_number"],
		validationParameters: ["first_name", "last_name", "date_of_birth", "selfie"],
	},
	{
		value: VERIFICATION_TYPES.KE_PASSPORT_LOOKUP.value,
		label: "Kenya Passport Lookup",
		countryCode: "ke",
		description: "Verify Kenyan passport",
		requiredParameters: ["passport_number"],
		validationParameters: ["first_name", "last_name", "date_of_birth", "selfie"],
	},
	{
		value: VERIFICATION_TYPES.KE_NATIONAL_ID_LOOKUP.value,
		label: "Kenya National ID Lookup",
		countryCode: "ke",
		description: "Verify Kenyan National ID (Huduma Namba)",
		requiredParameters: ["national_id"],
		validationParameters: ["first_name", "last_name", "date_of_birth", "selfie"],
	},
	{
		value: VERIFICATION_TYPES.KE_PHONE_NUMBER_LOOKUP.value,
		label: "Kenya Phone Lookup",
		countryCode: "ke",
		description: "Kenyan phone number lookup",
		requiredParameters: ["phone_number"],
		validationParameters: [],
	},
	{
		value: VERIFICATION_TYPES.KE_TAX_PIN_VERIFICATION.value,
		label: "Kenya Tax PIN Verification",
		countryCode: "ke",
		description: "Verify Kenyan Tax PIN (KRA PIN)",
		requiredParameters: ["tax_pin"],
		validationParameters: [],
	},
];

const REGISTRY_VERIFICATION_TYPES_BY_VALUE = Object.fromEntries(
	REGISTRY_VERIFICATION_TYPES.map((type) => [type.value, type]),
) as Record<string, RegistryVerificationType>;

const VERIFICATION_TYPES_ALLOWING_VALIDATION = new Set([
	VERIFICATION_TYPES.NG_PASSPORT_VERIFICATION.value,
	VERIFICATION_TYPES.NG_BVN_VERIFICATION.value,
	VERIFICATION_TYPES.NG_NIN_VERIFICATION.value,
	VERIFICATION_TYPES.NG_VIRTUAL_NIN_VERIFICATION.value,
	VERIFICATION_TYPES.ZA_SAID_VERIFICATION.value,
	VERIFICATION_TYPES.GH_PASSPORT_LOOKUP.value,
	VERIFICATION_TYPES.GH_SSNIT_LOOKUP.value,
	VERIFICATION_TYPES.GH_VOTER_CARD_LOOKUP.value,
	VERIFICATION_TYPES.GH_DRIVERS_LICENSE_LOOKUP.value,
	VERIFICATION_TYPES.KE_PASSPORT_LOOKUP.value,
	VERIFICATION_TYPES.KE_NATIONAL_ID_LOOKUP.value,
]);

const VERIFICATION_TYPES_REQUIRING_LAST_NAME = new Set([
	VERIFICATION_TYPES.NG_PASSPORT_VERIFICATION.value,
]);

const PARAMETER_LABELS: Record<string, string> = {
	id_number: "ID Number",
	bvn: "BVN",
	nin: "NIN",
	virtual_nin: "Virtual NIN",
	phone_number: "Phone Number",
	cac_number: "CAC Number",
	passport_id: "Passport ID",
	passport_number: "Passport Number",
	voter_id: "Voter ID",
	ssnit_number: "SSNIT Number",
	license_number: "License Number",
	national_id: "National ID",
	tax_pin: "Tax PIN",
	last_name: "Last Name",
};

export function getRegistryVerificationTypes(countryCode: string) {
	return REGISTRY_VERIFICATION_TYPES.filter(
		(type) => type.countryCode === countryCode,
	);
}

export function getRegistryVerificationType(value: string) {
	return REGISTRY_VERIFICATION_TYPES_BY_VALUE[value];
}

export function allowsCustomerDataValidation(verificationType: string) {
	return VERIFICATION_TYPES_ALLOWING_VALIDATION.has(verificationType);
}

export function requiresLastNameField(verificationType: string) {
	return VERIFICATION_TYPES_REQUIRING_LAST_NAME.has(verificationType);
}

export function getPrimaryInputParameter(verificationType: string) {
	const type = getRegistryVerificationType(verificationType);
	if (!type) {
		return null;
	}

	return (
		type.requiredParameters.find((parameter) => parameter !== "last_name") ??
		type.requiredParameters[0] ??
		null
	);
}

export function getPrimaryInputLabel(verificationType: string) {
	const parameter = getPrimaryInputParameter(verificationType);
	if (!parameter) {
		return "Input Data";
	}

	return PARAMETER_LABELS[parameter] ?? "Input Data";
}

export function normalizeCountryCode(value: string | undefined) {
	return value?.trim().toLowerCase() ?? "";
}

export function filterRegistryCountries<
	T extends { code: string; name: string },
>(countries: T[], enabledCountryCodes?: string[]) {
	const registryCountries = countries.filter((country) =>
		REGISTRY_COUNTRY_CODES.includes(
			normalizeCountryCode(country.code) as RegistryCountryCode,
		),
	);

	if (enabledCountryCodes === undefined) {
		return registryCountries;
	}

	const enabledCodes = new Set(
		enabledCountryCodes.map((code) => normalizeCountryCode(code)),
	);

	return registryCountries.filter((country) =>
		enabledCodes.has(normalizeCountryCode(country.code)),
	);
}

export function filterToRegistryCountries<
	T extends { code: string; name: string },
>(countries: T[]) {
	return filterRegistryCountries(countries, undefined);
}

type GovernmentRegistryFormValues = {
	verificationType: string;
	input: string;
	lastName: string;
	includeValidation: boolean;
	validationFirstName: string;
	validationLastName: string;
	validationDateOfBirth: string;
};

export function buildGovernmentRegistryPayload(
	values: GovernmentRegistryFormValues,
	options?: { selfieProofUrl?: string | null },
): VerificationRequestCreatePayload {
	const inputField = getPrimaryInputParameter(values.verificationType);
	if (!inputField) {
		throw new Error("Unsupported verification type");
	}

	const inputData: Record<string, unknown> = {
		[inputField]: values.input.trim(),
	};

	if (requiresLastNameField(values.verificationType) && values.lastName.trim()) {
		inputData.last_name = values.lastName.trim();
	}

	if (values.includeValidation) {
		inputData.first_name = values.validationFirstName.trim();
		inputData.last_name = values.validationLastName.trim();
		inputData.date_of_birth = values.validationDateOfBirth.trim();
	}

	if (options?.selfieProofUrl) {
		inputData.selfie = options.selfieProofUrl;
	}

	return {
		verification_type: values.verificationType as VerificationType,
		method_type: "offsite",
		input_data: inputData,
	};
}
