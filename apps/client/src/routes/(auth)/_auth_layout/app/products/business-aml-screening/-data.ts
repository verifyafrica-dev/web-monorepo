import type {
	VerificationRequestCreatePayload,
	VerificationType,
} from "#/api/http/v2/verifications/verifications.types";
import { SHUFTI_CHOICES } from "#/lib/constants";

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
	const businessAml: Record<string, unknown> = {
		filters: getSelectedAmlFilters(options.filters),
		match_score: options.matchScore,
		alias_search: SHUFTI_CHOICES.YES,
		rca_search: SHUFTI_CHOICES.YES,
		business_name: mode === "direct" ? (values.businessName?.trim() ?? "") : "",
	};

	if (values.screeningCountry.trim()) {
		businessAml.countries = [values.screeningCountry.trim().toUpperCase()];
	}

	if (values.incorporationDate?.trim()) {
		businessAml.business_incorporation_date = values.incorporationDate.trim();
	}

	return businessAml;
}

export function buildBusinessAmlScreeningLinkPayload(
	values: BusinessAmlLinkFormValues,
	options: BusinessAmlScreeningOptions,
): VerificationRequestCreatePayload {
	return {
		verification_type: BUSINESS_AML_SCREENING_TYPE,
		method_type: "onsite",
		input_data: {
			country: values.screeningCountry.trim().toUpperCase(),
			language: "EN",
			email: values.email.trim(),
			ttl: Number(values.urlLimit),
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
			aml_for_businesses: buildBusinessAmlBlock("direct", values, options),
		},
	};
}
