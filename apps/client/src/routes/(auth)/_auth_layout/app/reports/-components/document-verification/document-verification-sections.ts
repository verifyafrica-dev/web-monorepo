import {
	asNonEmptyString,
	asRecord,
	formatHumanLabel,
	formatLanguageName,
	type UnknownRecord,
} from "../../-utils";
import {
	asProofSource,
	asStringArray,
	computed,
	formatCountry,
	formatDocumentType,
	formatVerificationMode,
	leftoverFields,
	type ReportCheck,
	type SubmittedProof,
	submittedProof,
	toCheckResult,
	withoutEmpty,
} from "../report-builders";
import {
	formatReportValue,
	type ReportField,
	type ReportMatch,
} from "../report-sections";

export { formatDocumentType };
export type DocumentProof = SubmittedProof;
export type DocumentCheck = ReportCheck;

export type DocumentVerificationSections = {
	submitted: ReportField[];
	personal: ReportField[];
	document: ReportField[];
	dataMatches: ReportMatch[];
	checks: DocumentCheck[];
	declinedCodes: string[];
	selectedTypes: string[];
	supportedTypes: string[];
	proofs: DocumentProof[];
	additional: ReportField[];
};

const GENDER_LABELS: Record<string, string> = {
	m: "Male",
	male: "Male",
	f: "Female",
	female: "Female",
	x: "Unspecified",
};

const COLLECT_LABELS: Array<[string, string]> = [
	["dob", "Date of Birth"],
	["age", "Age"],
	["gender", "Gender"],
	["backside_proof_required", "Back of Document"],
];

/** Always shown so the outcome card keeps a stable layout across verifications. */
const BASE_CHECKS: Array<[string, string]> = [
	["document", "Document"],
	["document_country", "Document Country"],
	["document_must_not_be_expired", "Document Must Not Be Expired"],
	["document_proof", "Document Proof"],
	["document_visibility", "Document Visibility"],
	["name", "Name Check"],
	["selected_type", "Selected Type Check"],
];

const EXTRA_CHECK_LABELS: Record<string, string> = {
	dob: "Date of Birth Check",
	age: "Age Check",
	gender: "Gender Check",
	issue_date: "Issue Date Check",
	expiry_date: "Expiry Date Check",
	document_number: "Document Number Check",
};

const MATCH_LABELS: Array<[string, string]> = [
	["name", "Name Match"],
	["dob", "Date of Birth Match"],
	["gender", "Gender Match"],
	["age", "Age Match"],
];

const KNOWN_INPUT_KEYS = new Set([
	"email",
	"country",
	"language",
	"document",
	"collect",
	"first_name",
	"last_name",
	"ttl",
	"send_email",
	"allow_file_upload",
	// Shown on the overview card.
	"customer_unique_id",
	"mode",
	"method_type",
]);

const KNOWN_INPUT_DOCUMENT_KEYS = new Set([
	"name",
	"proof",
	"additional_proof",
	"backside_proof",
	"supported_types",
	"verification_mode",
	"backside_proof_required",
	"fetch_enhanced_data",
	"dob",
	"age",
	"gender",
	"allow_online",
	"allow_offline",
]);

const KNOWN_EXTRACTED_KEYS = new Set([
	"full_name",
	"first_name",
	"last_name",
	"dob",
	"gender",
	"nationality",
	"place_of_birth",
	"document_type",
	"document_official_name",
	"document_number",
	"personal_number",
	"previous_document_number",
	"issue_date",
	"expiry_date",
	"authority",
	"document_country",
	"document_country_code",
	"country_code",
	"country",
	"mrz",
	"license_category",
	"licence_classes",
	"vehicle_categories",
	// Pixel bounding boxes of the face / signature on the scan.
	"face",
	"signature",
]);

const KNOWN_EXTRACTED_BACK_KEYS = new Set([
	"face",
	"signature",
	"country",
	"country_code",
	"document_country_code",
]);

const EXTRACTED_LABELS: Record<string, string> = {
	category: "MRZ Document Category",
	country_native: "Issuing Country (Native Name)",
	nationality_native: "Nationality (Native Name)",
	rotation: "Scan Rotation (Degrees)",
	middle_name: "Middle Name",
};

const KNOWN_VERIFICATION_DATA_KEYS = new Set([
	"name",
	"dob",
	"age",
	"gender",
	"selected_type",
	"supported_types",
]);

const KNOWN_RESPONSE_KEYS = new Set([
	"reference",
	"event",
	"status",
	"country",
	"email",
	"customer_unique_id",
	"verification_url",
	"verification_data",
	"verification_result",
	"info",
	"additional_data",
	"proofs",
	"declined_reason",
	"declined_codes",
	"services_declined_codes",
]);

function joinName(...parts: unknown[]) {
	const name = parts
		.map((part) => asNonEmptyString(part))
		.filter((part): part is string => Boolean(part))
		.join(" ");
	return name || undefined;
}

function formatGender(value: unknown) {
	const raw = asNonEmptyString(value);
	if (!raw) return undefined;
	return GENDER_LABELS[raw.toLowerCase()] ?? formatHumanLabel(raw);
}

/** Proofs exactly as submitted to VerifyAfrica — never the provider-hosted copies. */
export function getSubmittedDocumentProofs(
	inputData: unknown,
): DocumentProof[] {
	const document = asRecord(asRecord(inputData)?.document) ?? {};
	const back =
		asProofSource(document.additional_proof) ??
		asProofSource(document.backside_proof);
	return [
		...submittedProof(
			"document_front",
			back ? "Document (Front)" : "Document",
			document.proof,
		),
		...submittedProof("document_back", "Document (Back)", back),
	];
}

function collectedFromCustomer(collect: UnknownRecord) {
	return COLLECT_LABELS.flatMap(([key, label]) =>
		collect[key] === true || collect[key] === "1" ? [label] : [],
	);
}

export function buildDocumentVerificationSections({
	inputData,
	responseData,
}: {
	inputData: unknown;
	responseData: unknown;
}): DocumentVerificationSections {
	const input = asRecord(inputData) ?? {};
	const inputDocument = asRecord(input.document) ?? {};
	const inputName = asRecord(inputDocument.name) ?? {};
	const collect = asRecord(input.collect) ?? {};

	const response = asRecord(responseData) ?? {};
	const extractedDocument =
		asRecord(asRecord(response.additional_data)?.document) ?? {};
	const extracted = asRecord(extractedDocument.proof) ?? {};
	const extractedBack = asRecord(extractedDocument.additional_proof) ?? {};
	const checkedData =
		asRecord(asRecord(response.verification_data)?.document) ?? {};
	const checkedName = asRecord(checkedData.name) ?? {};
	const results =
		asRecord(asRecord(response.verification_result)?.document) ?? {};

	const submittedFirstName = inputName.first_name ?? input.first_name;
	const submittedLastName = inputName.last_name ?? input.last_name;
	const selectedTypes = asStringArray(checkedData.selected_type);

	const submitted = [
		computed(
			"full_name",
			"Full Name",
			joinName(submittedFirstName, submittedLastName),
			{ wide: true },
		),
		computed("first_name", "First Name", submittedFirstName),
		computed("last_name", "Last Name", submittedLastName),
		computed("dob", "Date of Birth", inputDocument.dob, { format: "date" }),
		computed("age", "Age", inputDocument.age),
		computed("gender", "Gender", formatGender(inputDocument.gender)),
		computed("email", "Email", input.email),
		computed("country", "Country", formatCountry(input.country)),
		computed("language", "Language", formatLanguageName(input.language)),
		computed(
			"requested_types",
			"Requested Document Type",
			asStringArray(inputDocument.supported_types).map(formatDocumentType),
		),
		computed(
			"verification_mode",
			"Verification Mode",
			formatVerificationMode(inputDocument.verification_mode),
		),
		computed("fuzzy_match", "Fuzzy Name Matching", inputName.fuzzy_match, {
			format: "yesNo",
		}),
		computed(
			"backside_proof_required",
			"Back of Document Required",
			inputDocument.backside_proof_required ?? collect.backside_proof_required,
			{ format: "yesNo" },
		),
		computed(
			"fetch_enhanced_data",
			"Enhanced Data Extraction",
			inputDocument.fetch_enhanced_data,
			{ format: "yesNo" },
		),
		computed(
			"collected_from_customer",
			"Collected From Customer",
			collectedFromCustomer(collect),
		),
		computed(
			"verification_instructions",
			"Verification Instructions",
			collect.verification_instructions,
			{ wide: true, multiline: true },
		),
	];

	const personal = [
		computed("full_name", "Full Name", extracted.full_name, {
			format: "title",
			wide: true,
		}),
		computed("first_name", "First Name", extracted.first_name, {
			format: "title",
		}),
		computed("last_name", "Last Name", extracted.last_name, {
			format: "title",
		}),
		computed("dob", "Date of Birth", extracted.dob, { format: "date" }),
		computed("gender", "Gender", formatGender(extracted.gender)),
		computed(
			"nationality",
			"Nationality",
			formatCountry(extracted.nationality),
		),
		computed("place_of_birth", "Place of Birth", extracted.place_of_birth, {
			format: "title",
		}),
	];

	const document = [
		computed(
			"document_type",
			"Document Type",
			formatDocumentType(extracted.document_type) ??
				selectedTypes.map(formatDocumentType),
		),
		computed(
			"document_official_name",
			"Document Name",
			extracted.document_official_name,
		),
		computed("document_number", "Document Number", extracted.document_number, {
			mono: true,
		}),
		computed("personal_number", "Personal Number", extracted.personal_number, {
			mono: true,
		}),
		computed(
			"previous_document_number",
			"Previous Document Number",
			extracted.previous_document_number,
			{ mono: true },
		),
		computed("issue_date", "Issue Date", extracted.issue_date, {
			format: "date",
		}),
		computed("expiry_date", "Expiry Date", extracted.expiry_date, {
			format: "date",
		}),
		computed("authority", "Issuing Authority", extracted.authority, {
			format: "title",
		}),
		computed(
			"license_category",
			"License Category",
			extracted.license_category,
		),
		computed("licence_classes", "License Classes", extracted.licence_classes),
		computed(
			"vehicle_categories",
			"Vehicle Categories",
			asNonEmptyString(extracted.vehicle_categories)
				?.split(",")
				.map((item) => item.trim())
				.filter(Boolean),
		),
		computed(
			"issuing_country",
			"Issuing Country",
			asNonEmptyString(extracted.document_country) ??
				formatCountry(extracted.document_country_code) ??
				formatCountry(extracted.country_code) ??
				formatCountry(extracted.country),
		),
		computed("mrz", "Machine Readable Zone (MRZ)", extracted.mrz, {
			mono: true,
			wide: true,
			multiline: true,
		}),
	];

	const submittedForMatch: Record<string, unknown> = {
		name:
			joinName(checkedName.first_name, checkedName.last_name) ??
			joinName(submittedFirstName, submittedLastName),
		dob: formatReportValue(checkedData.dob ?? inputDocument.dob, "date"),
		gender: formatGender(checkedData.gender ?? inputDocument.gender),
		age: checkedData.age ?? inputDocument.age,
	};
	const dataMatches = MATCH_LABELS.flatMap(([key, label]): ReportMatch[] => {
		const match = toCheckResult(results[key]);
		return match === undefined
			? []
			: [{ key, label, submitted: submittedForMatch[key], match }];
	});

	const baseCheckKeys = new Set(BASE_CHECKS.map(([key]) => key));
	const checks: DocumentCheck[] = [
		...BASE_CHECKS.map(([key, label]) => ({ key, label, value: results[key] })),
		...Object.entries(results)
			.filter(([key]) => !baseCheckKeys.has(key))
			.map(([key, value]) => ({
				key,
				label: EXTRA_CHECK_LABELS[key] ?? `${formatHumanLabel(key)} Check`,
				value,
			})),
	];

	const providerCustomerId = asNonEmptyString(response.customer_unique_id);
	const ttl = Number(input.ttl);
	const additional = [
		computed(
			"ttl",
			"Link Expiry",
			Number.isFinite(ttl) && ttl > 0 ? `${ttl} minutes` : undefined,
		),
		computed("send_email", "Link Emailed to Customer", input.send_email, {
			format: "yesNo",
		}),
		computed(
			"allow_file_upload",
			"File Upload Allowed",
			input.allow_file_upload ?? inputDocument.allow_offline,
			{ format: "yesNo" },
		),
		computed(
			"allow_online",
			"Live Camera Capture Allowed",
			inputDocument.allow_online,
			{ format: "yesNo" },
		),
		computed(
			"provider_customer_id",
			"Provider Customer ID",
			providerCustomerId !== input.customer_unique_id
				? providerCustomerId
				: undefined,
			{ mono: true },
		),
		...leftoverFields(input, KNOWN_INPUT_KEYS, "input"),
		...leftoverFields(
			inputDocument,
			KNOWN_INPUT_DOCUMENT_KEYS,
			"input.document",
		),
		...leftoverFields(extracted, KNOWN_EXTRACTED_KEYS, "extracted", {
			labels: EXTRACTED_LABELS,
		}),
		...leftoverFields(
			{
				...extractedBack,
				document_type: formatDocumentType(extractedBack.document_type),
			},
			KNOWN_EXTRACTED_BACK_KEYS,
			"extracted_back",
			{
				labels: {
					...EXTRACTED_LABELS,
					document_official_name: "Document Name",
					document_country: "Issuing Country",
				},
				labelPrefix: "Back of Document",
			},
		),
		...leftoverFields(
			checkedData,
			KNOWN_VERIFICATION_DATA_KEYS,
			"verification_data",
		),
		...leftoverFields(response, KNOWN_RESPONSE_KEYS, "response"),
	];

	return {
		submitted: withoutEmpty(submitted),
		personal: withoutEmpty(personal),
		document: withoutEmpty(document),
		dataMatches,
		checks,
		declinedCodes: asStringArray(response.declined_codes),
		selectedTypes,
		supportedTypes: asStringArray(checkedData.supported_types),
		proofs: getSubmittedDocumentProofs(inputData),
		additional: withoutEmpty(additional),
	};
}
