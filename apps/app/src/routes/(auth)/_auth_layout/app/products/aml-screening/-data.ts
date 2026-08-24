import type {
	VerificationRequestCreatePayload,
	VerificationType,
} from "#/api/http/v2/verifications/verifications.types";
import { SHUFTI_CHOICES } from "#/lib/constants";

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
] as const;

export type AmlScreeningFilterKey =
	(typeof AML_SCREENING_FILTERS)[number]["key"];

export const DEFAULT_AML_SCREENING_FILTERS = Object.fromEntries(
	AML_SCREENING_FILTERS.map((filter) => [filter.key, true]),
) as Record<AmlScreeningFilterKey, boolean>;

export const DEFAULT_MATCH_SCORE = 100;

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
};

type AmlLinkFormValues = {
	email: string;
	screeningCountry: string;
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
	const backgroundChecks: Record<string, unknown> = {
		name: {
			full_name: mode === "direct" ? (values.fullName?.trim() ?? "") : "",
		},
		filters: getSelectedAmlFilters(options.filters),
		match_score: options.matchScore,
		rca_search: SHUFTI_CHOICES.YES,
		alias_search: SHUFTI_CHOICES.YES,
	};

	if (mode === "direct" && values.dateOfBirth?.trim()) {
		backgroundChecks.dob = values.dateOfBirth.trim();
	}

	if (values.screeningCountry.trim()) {
		backgroundChecks.countries = [values.screeningCountry.trim().toUpperCase()];
	}

	return backgroundChecks;
}

export function buildAmlScreeningLinkPayload(
	values: AmlLinkFormValues,
	options: AmlScreeningOptions,
): VerificationRequestCreatePayload {
	return {
		verification_type: AML_SCREENING_TYPE,
		method_type: "onsite",
		input_data: {
			country: values.screeningCountry.trim().toUpperCase(),
			language: "EN",
			email: values.email.trim(),
			ttl: Number(values.urlLimit),
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
			background_checks: buildBackgroundChecks("direct", values, options),
		},
	};
}
