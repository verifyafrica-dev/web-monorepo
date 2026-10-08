import type {
	VerificationRequestCreatePayload,
	VerificationType,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

const BUSINESS_AML_SCREENING_TYPE =
	"business_aml_screening" satisfies VerificationType;

import {
	getSelectedAmlFilters,
	normalizeScreeningCountryCodes,
	type AmlScreeningFilterKey,
	type AmlScreeningOptions,
} from "../aml-screening/-data";

type BusinessAmlScreeningOptions = AmlScreeningOptions & {
	individualFace: string | null;
};

type BusinessAmlLinkFormValues = {
	email: string;
	screeningCountries: string[];
	businessName: string;
	incorporationDate: string;
	urlLimit: string;
};

type BusinessAmlDirectFormValues = {
	email: string;
	screeningCountries: string[];
	businessName: string;
	incorporationDate: string;
};

function buildBusinessAmlBlock(
	values: {
		screeningCountries: string[];
		businessName?: string;
		incorporationDate?: string;
	},
	options: BusinessAmlScreeningOptions,
) {
	const businessAml: Record<string, unknown> = {};
	const countries = normalizeScreeningCountryCodes(values.screeningCountries);

	if (values.businessName?.trim()) {
		businessAml.business_name = values.businessName.trim();
	}

	if (countries.length > 0) {
		businessAml.countries = countries;
	}

	if (values.incorporationDate?.trim()) {
		businessAml.business_incorporation_date = values.incorporationDate.trim();
	}

	if (options.biometricSearchImage?.trim()) {
		businessAml.biometric_search_image = options.biometricSearchImage.trim();
	}

	if (options.individualFace?.trim()) {
		businessAml.individual_face = options.individualFace.trim();
	}

	if (options.context.trim()) {
		businessAml.context = options.context.trim();
	}

	return businessAml;
}

function buildFiltersObject(options: BusinessAmlScreeningOptions) {
	return {
		filters: getSelectedAmlFilters(options.filters),
		match_score: options.matchScore,
		rca_search: options.rcaSearch,
		alias_search: options.aliasSearch,
	};
}

export function buildBusinessAmlScreeningLinkPayload(
	values: BusinessAmlLinkFormValues,
	options: BusinessAmlScreeningOptions,
): VerificationRequestCreatePayload {
	return {
		verification_type: BUSINESS_AML_SCREENING_TYPE,
		method_type: "new_link",
		input_data: {
			language: "EN",
			email: values.email.trim(),
			ttl: Number(values.urlLimit),
			filters: buildFiltersObject(options),
			aml_for_businesses: buildBusinessAmlBlock(values, options),
		},
	};
}

export function buildBusinessAmlScreeningDirectPayload(
	values: BusinessAmlDirectFormValues,
	options: BusinessAmlScreeningOptions,
): VerificationRequestCreatePayload {
	return {
		verification_type: BUSINESS_AML_SCREENING_TYPE,
		method_type: "offsite",
		input_data: {
			language: "EN",
			email: values.email.trim(),
			filters: buildFiltersObject(options),
			aml_for_businesses: buildBusinessAmlBlock(values, options),
		},
	};
}

export type { AmlScreeningFilterKey, BusinessAmlScreeningOptions };
