import { asRecord, formatHumanLabel } from "../../-utils";
import {
	asStringArray,
	buildProviderOutcome,
	computed,
	formatDocumentType,
	formatVerificationMode,
	leftoverFields,
	linkSettingsFields,
	type ProviderOutcome,
	type ReportCheck,
	SHARED_RESPONSE_KEYS,
	type SubmittedProof,
	sharedRequestFields,
	submittedProof,
	withoutEmpty,
} from "../report-builders";
import type { ReportField } from "../report-sections";

export type AddressVerificationSections = {
	submitted: ReportField[];
	outcome: ProviderOutcome;
	checks: ReportCheck[];
	checkedData: ReportField[];
	proofs: SubmittedProof[];
	additional: ReportField[];
};

/** Always shown so the outcome card keeps a stable layout across verifications. */
const BASE_CHECKS: Array<[string, string]> = [
	["full_address", "Address Match"],
	["address_document", "Address Document"],
	["address_document_must_not_be_expired", "Document Not Expired"],
	["address_document_proof", "Document Proof"],
];

const EXTRA_CHECK_LABELS: Record<string, string> = {
	name: "Name Match",
	issue_date: "Issue Date Check",
	address_document_visibility: "Document Visibility",
	address_document_country: "Document Country",
	selected_type: "Selected Type Check",
};

const KNOWN_INPUT_KEYS = new Set([
	"email",
	"country",
	"language",
	"mode",
	"address",
	"ttl",
	"send_email",
	"allow_file_upload",
	"method_type",
	"collect",
	"filters",
	"reference",
	"callback_url",
	"redirect_url",
]);

const KNOWN_INPUT_ADDRESS_KEYS = new Set([
	"full_address",
	"proof",
	"supported_types",
	"verification_mode",
	"address_fuzzy_match",
	"allow_offline",
	"allow_online",
	"name",
]);

const KNOWN_CHECKED_KEYS = new Set([
	"full_address",
	"name",
	"selected_type",
	"supported_types",
	"issue_date",
]);

function formatName(value: unknown) {
	const name = asRecord(value);
	if (!name) return typeof value === "string" ? value : undefined;
	return (
		[name.first_name, name.middle_name, name.last_name]
			.filter((part) => typeof part === "string" && part.trim())
			.join(" ") ||
		(typeof name.full_name === "string" ? name.full_name : undefined)
	);
}

export function buildAddressVerificationSections({
	inputData,
	responseData,
}: {
	inputData: unknown;
	responseData: unknown;
}): AddressVerificationSections {
	const input = asRecord(inputData) ?? {};
	const inputAddress = asRecord(input.address) ?? {};
	const response = asRecord(responseData) ?? {};
	const checked = asRecord(asRecord(response.verification_data)?.address) ?? {};
	const extracted = asRecord(asRecord(response.additional_data)?.address) ?? {};
	const results =
		asRecord(asRecord(response.verification_result)?.address) ?? {};

	const submitted = [
		computed("full_address", "Address Provided", inputAddress.full_address, {
			wide: true,
		}),
		computed("name", "Name Provided", formatName(inputAddress.name)),
		...sharedRequestFields(input),
		computed(
			"supported_types",
			"Accepted Proof of Address",
			asStringArray(inputAddress.supported_types).map(formatDocumentType),
			{ wide: true },
		),
		computed(
			"verification_mode",
			"Verification Mode",
			formatVerificationMode(inputAddress.verification_mode),
		),
		computed(
			"address_fuzzy_match",
			"Fuzzy Address Matching",
			inputAddress.address_fuzzy_match,
			{ format: "yesNo" },
		),
	];

	const baseCheckKeys = new Set(BASE_CHECKS.map(([key]) => key));
	const checks: ReportCheck[] = [
		...BASE_CHECKS.map(([key, label]) => ({ key, label, value: results[key] })),
		...Object.entries(results)
			.filter(([key]) => !baseCheckKeys.has(key))
			.map(([key, value]) => ({
				key,
				label: EXTRA_CHECK_LABELS[key] ?? `${formatHumanLabel(key)} Check`,
				value,
			})),
	];

	const checkedName = formatName(checked.name);
	const checkedData = [
		computed(
			"full_address",
			"Address Checked",
			checked.full_address !== inputAddress.full_address
				? checked.full_address
				: undefined,
			{ wide: true },
		),
		computed(
			"name",
			"Name Checked",
			checkedName !== formatName(inputAddress.name) ? checkedName : undefined,
		),
		computed(
			"selected_type",
			"Document Type Detected",
			asStringArray(checked.selected_type).map(formatDocumentType),
		),
		computed("issue_date", "Issue Date", checked.issue_date, {
			format: "date",
		}),
		...leftoverFields(checked, KNOWN_CHECKED_KEYS, "verification_data"),
		...leftoverFields(extracted, new Set(), "extracted", {
			labelPrefix: "Extracted",
		}),
	];

	const outcome = buildProviderOutcome(response);
	const additional = [
		...linkSettingsFields(input, inputAddress),
		computed(
			"provider_customer_id",
			"Provider Customer ID",
			outcome.providerCustomerId,
			{ mono: true },
		),
		...leftoverFields(input, KNOWN_INPUT_KEYS, "input"),
		...leftoverFields(inputAddress, KNOWN_INPUT_ADDRESS_KEYS, "input.address"),
		...leftoverFields(response, new Set(SHARED_RESPONSE_KEYS), "response"),
	];

	return {
		submitted: withoutEmpty(submitted),
		outcome,
		checks,
		checkedData: withoutEmpty(checkedData),
		proofs: submittedProof(
			"address_proof",
			"Proof of Address",
			inputAddress.proof,
		),
		additional: withoutEmpty(additional),
	};
}
