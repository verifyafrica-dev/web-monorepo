import type {
	KybBase,
	VerificationRequestCreatePayload,
	VerificationType,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

const KYB_VERIFICATION_TYPE = "kyb_screening" satisfies VerificationType;

export const KYB_BASES = [
	{ value: "search", label: "Search" },
	{ value: "document", label: "Document" },
	{ value: "document_purchase", label: "Document purchase" },
] as const satisfies ReadonlyArray<{ value: KybBase; label: string }>;

export const KYB_SEARCH_TYPES = [
	{ value: "fuzzy", label: "Fuzzy" },
	{ value: "contains", label: "Contains" },
	{ value: "start_with", label: "Starts with" },
] as const;

export const KYB_IDENTIFIER_LABELS: Record<string, string> = {
	company_name: "Company name",
	registration_number: "Registration number",
	vat_number: "VAT number",
	freelance_number: "Freelance number",
	tax_identification_number: "Tax identification number",
	commercial_registration_number: "Commercial registration number",
	cnpj_number: "CNPJ number",
	trn_number: "TRN number",
	iban_number: "IBAN number",
	license_number: "License number",
	vat_certificate_number: "VAT certificate number",
};

export type KybCoverageCountry = {
	code: string;
	name: string;
	iso?: string;
	identifiers?: string[];
	documents?: Array<
		string | { payload_name?: string; name?: string; authority?: string }
	>;
};

export type KybFormValues = {
	email: string;
	base: KybBase;
	businessJurisdiction: string;
	companyName: string;
	companyRegistrationNumber: string;
	searchType: string;
	searchBy: string;
	searchWord: string;
	advancedSearch: boolean;
	aiBusinessInsights: boolean;
	documentProof: string;
	additionalProofLabels: string[];
	validateDocument: boolean;
	requiredDocuments: string[];
	urlLimit?: string;
};

function jurisdictionPayload(code: string) {
	const country = code.trim().toUpperCase();
	return country ? { country, company_jurisdiction_code: country } : {};
}

export function purchaseDocumentOptions(country?: KybCoverageCountry) {
	return (country?.documents ?? [])
		.map((item) => {
			if (typeof item === "string") {
				return { value: item, label: item };
			}
			return {
				value: item.payload_name ?? "",
				label: item.name || item.payload_name || "",
			};
		})
		.filter((item) => item.value);
}

export function documentLabelOptions(country?: KybCoverageCountry) {
	return (country?.documents ?? [])
		.map((item) => (typeof item === "string" ? item : item.payload_name ?? ""))
		.filter(Boolean)
		.map((value) => ({
			value,
			label: value.replaceAll("_", " "),
		}));
}

export function buildKybVerificationLinkPayload(
	values: KybFormValues,
): VerificationRequestCreatePayload {
	const country = values.businessJurisdiction.trim().toUpperCase();
	const kyb: Record<string, unknown> = { base: values.base };

	if (values.base === "search") {
		kyb.search_type = values.searchType || "fuzzy";
		kyb.advanced_search = values.advancedSearch ? "1" : "0";
		if (values.aiBusinessInsights) {
			kyb.ai_business_insights = "1";
		}
		if (values.searchBy) {
			kyb.search_by = values.searchBy;
		}
		if (country) {
			kyb.company_jurisdiction_code = country;
		}
	} else if (values.base === "document") {
		if (values.additionalProofLabels.length > 0) {
			kyb.additional_proof_labels = values.additionalProofLabels;
		}
		if (values.validateDocument) {
			kyb.validate_document = "1";
		}
	} else {
		if (country) {
			kyb.company_jurisdiction_code = country;
		}
		if (values.requiredDocuments.length > 0) {
			kyb.required_documents = values.requiredDocuments;
		}
	}

	return {
		verification_type: KYB_VERIFICATION_TYPE,
		method_type: "new_link",
		input_data: {
			...(country ? { country } : {}),
			language: "EN",
			email: values.email.trim(),
			ttl: Number(values.urlLimit),
			kyb,
		},
	};
}

export function buildKybVerificationPayload(
	values: KybFormValues,
): VerificationRequestCreatePayload {
	const country = values.businessJurisdiction.trim().toUpperCase();
	const kyb: Record<string, unknown> = { base: values.base };

	if (values.base === "search") {
		kyb.search_type = values.searchType || "fuzzy";
		kyb.advanced_search = values.advancedSearch ? "1" : "0";
		if (values.aiBusinessInsights) {
			kyb.ai_business_insights = "1";
		}
		if (values.searchBy && !["company_name", "registration_number"].includes(values.searchBy)) {
			kyb.search_by = values.searchBy;
			kyb.search_word = values.searchWord.trim();
		} else {
			if (values.companyName.trim()) {
				kyb.company_name = values.companyName.trim();
			}
			if (values.companyRegistrationNumber.trim()) {
				kyb.company_registration_number = values.companyRegistrationNumber.trim();
			}
			if (values.searchBy) {
				kyb.search_by = values.searchBy;
			}
		}
		Object.assign(kyb, jurisdictionPayload(country));
	} else if (values.base === "document") {
		kyb.document_proof = values.documentProof.trim();
		if (values.additionalProofLabels.length > 0) {
			kyb.additional_proof_labels = values.additionalProofLabels;
		}
		if (values.validateDocument) {
			kyb.validate_document = "1";
		}
	} else {
		kyb.company_registration_number = values.companyRegistrationNumber.trim();
		kyb.company_jurisdiction_code = country;
		kyb.required_documents = values.requiredDocuments;
	}

	return {
		verification_type: KYB_VERIFICATION_TYPE,
		method_type: "offsite",
		input_data: {
			...(country ? { country } : {}),
			language: "EN",
			email: values.email.trim(),
			kyb,
		},
	};
}
