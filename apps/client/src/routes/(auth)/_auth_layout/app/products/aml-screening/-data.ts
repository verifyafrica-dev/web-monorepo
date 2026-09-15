import type {
	VerificationRequestCreatePayload,
	VerificationType,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

const AML_SCREENING_TYPE = "aml_screening" satisfies VerificationType;

export const AML_SCREENING_FILTERS = [
	{ key: "sanction", label: "SANCTION" },
	{ key: "warning", label: "WARNING" },
	{ key: "fitness_probity", label: "FITNESS PROBITY" },
	{ key: "pep", label: "PEP" },
	{ key: "pep_class_1", label: "PEP CLASS 1" },
	{ key: "pep_class_2", label: "PEP CLASS 2" },
	{ key: "pep_class_3", label: "PEP CLASS 3" },
	{ key: "pep_class_4", label: "PEP CLASS 4" },
	{ key: "adverse_media", label: "ADVERSE MEDIA" },
] as const;

export type AmlScreeningFilterKey =
	(typeof AML_SCREENING_FILTERS)[number]["key"];

export const DEFAULT_AML_SCREENING_FILTERS = Object.fromEntries(
	AML_SCREENING_FILTERS.map((filter) => [filter.key, true]),
) as Record<AmlScreeningFilterKey, boolean>;

export const DEFAULT_MATCH_SCORE = 70;

export function getSelectedAmlFilters(
	filters: Record<AmlScreeningFilterKey, boolean>,
) {
	return AML_SCREENING_FILTERS.filter((filter) => filters[filter.key]).map(
		(filter) => filter.key.replace(/_/g, "-"),
	);
}

type AmlScreeningOptions = {
	filters: Record<AmlScreeningFilterKey, boolean>;
	matchScore: number;
	rcaSearch: boolean;
	aliasSearch: boolean;
	context: string;
	biometricSearchImage: string | null;
};

type AmlLinkFormValues = {
	email: string;
	screeningCountry: string;
	dateOfBirth: string;
	urlLimit: string;
};

type AmlDirectFormValues = {
	email: string;
	screeningCountry: string;
	fullName: string;
	dateOfBirth: string;
};

function buildBackgroundChecks(
	mode: "link" | "direct",
	values: {
		screeningCountry: string;
		fullName?: string;
		dateOfBirth?: string;
	},
	options: AmlScreeningOptions,
) {
	const backgroundChecks: Record<string, unknown> = {};

	if (mode === "direct") {
		backgroundChecks.name = {
			full_name: values.fullName?.trim() ?? "",
		};
	}

	if (values.dateOfBirth?.trim()) {
		backgroundChecks.dob = values.dateOfBirth.trim();
	}

	if (values.screeningCountry.trim()) {
		backgroundChecks.countries = [values.screeningCountry.trim().toUpperCase()];
	}

	if (options.biometricSearchImage?.trim()) {
		backgroundChecks.biometric_search_image = options.biometricSearchImage.trim();
	}

	if (options.context.trim()) {
		backgroundChecks.context = options.context.trim();
	}

	return backgroundChecks;
}

function buildFiltersObject(options: AmlScreeningOptions) {
	return {
		filters: getSelectedAmlFilters(options.filters),
		match_score: options.matchScore,
		rca_search: options.rcaSearch,
		alias_search: options.aliasSearch,
	};
}

export function buildAmlScreeningLinkPayload(
	values: AmlLinkFormValues,
	options: AmlScreeningOptions,
): VerificationRequestCreatePayload {
	const country = values.screeningCountry.trim().toUpperCase();
	return {
		verification_type: AML_SCREENING_TYPE,
		method_type: "new_link",
		input_data: {
			...(country ? { country } : {}),
			language: "EN",
			email: values.email.trim(),
			ttl: Number(values.urlLimit),
			filters: buildFiltersObject(options),
			background_checks: buildBackgroundChecks("link", values, options),
		},
	};
}

export function buildAmlScreeningDirectPayload(
	values: AmlDirectFormValues,
	options: AmlScreeningOptions,
): VerificationRequestCreatePayload {
	return {
		verification_type: AML_SCREENING_TYPE,
		method_type: "offsite",
		input_data: {
			country: values.screeningCountry.trim().toUpperCase(),
			language: "EN",
			email: values.email.trim(),
			filters: buildFiltersObject(options),
			background_checks: buildBackgroundChecks("direct", values, options),
		},
	};
}
