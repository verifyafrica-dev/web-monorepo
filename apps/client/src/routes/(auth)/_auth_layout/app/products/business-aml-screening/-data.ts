import type {
	VerificationRequestCreatePayload,
	VerificationType,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

const BUSINESS_AML_SCREENING_TYPE =
	"business_aml_screening" satisfies VerificationType;

import {
	getSelectedAmlFilters,
	type AmlScreeningFilterKey,
} from "../aml-screening/-data";

type BusinessAmlScreeningOptions = {
	filters: Record<AmlScreeningFilterKey, boolean>;
	matchScore: number;
};

type BusinessAmlLinkFormValues = {
	email: string;
	screeningCountry: string;
	businessName: string;
	incorporationDate: string;
	urlLimit: string;
};

type BusinessAmlDirectFormValues = {
	email: string;
	screeningCountry: string;
	businessName: string;
	incorporationDate: string;
};

function buildBusinessAmlBlock(
	mode: "link" | "direct",
	values: {
		screeningCountry: string;
		businessName?: string;
		incorporationDate?: string;
	},
	options: BusinessAmlScreeningOptions,
) {
	const businessAml: Record<string, unknown> = {};

	if (values.businessName?.trim()) {
		businessAml.business_name = values.businessName.trim();
	}

	if (values.screeningCountry.trim()) {
		businessAml.countries = [values.screeningCountry.trim().toUpperCase()];
	}

	if (values.incorporationDate?.trim()) {
		businessAml.business_incorporation_date = values.incorporationDate.trim();
	}

	return businessAml;
}

function buildFiltersObject(options: BusinessAmlScreeningOptions) {
	return {
		filters: getSelectedAmlFilters(options.filters),
		match_score: options.matchScore,
		rca_search: true,
		alias_search: true,
	};
}

export function buildBusinessAmlScreeningLinkPayload(
	values: BusinessAmlLinkFormValues,
	options: BusinessAmlScreeningOptions,
): VerificationRequestCreatePayload {
	const country = values.screeningCountry.trim().toUpperCase();
	return {
		verification_type: BUSINESS_AML_SCREENING_TYPE,
		method_type: "new_link",
		input_data: {
			...(country ? { country } : {}),
			language: "EN",
			email: values.email.trim(),
			ttl: Number(values.urlLimit),
			filters: buildFiltersObject(options),
			aml_for_businesses: buildBusinessAmlBlock("link", values, options),
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
			country: values.screeningCountry.trim().toUpperCase(),
			language: "EN",
			email: values.email.trim(),
			filters: buildFiltersObject(options),
			aml_for_businesses: buildBusinessAmlBlock("direct", values, options),
		},
	};
}
