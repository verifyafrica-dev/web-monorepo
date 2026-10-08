import { asRecord, asUnknownArray, type UnknownRecord } from "../../-utils";

export type RegistryFieldFormat =
	| "text"
	| "date"
	| "datetime"
	| "title"
	| "yesNo";

export type RegistryField = {
	key: string;
	label: string;
	value: unknown;
	format?: RegistryFieldFormat;
	mono?: boolean;
	wide?: boolean;
};

export type RegistryImage = {
	key: string;
	label: string;
	src: string;
};

export type RegistryMatch = {
	key: string;
	label: string;
	submitted: unknown;
	match: boolean;
	confidence?: number;
};

export type RegistryTableColumn = {
	key: string;
	label: string;
	format?: RegistryFieldFormat;
};

export type RegistryTable = {
	key: string;
	title: string;
	columns: RegistryTableColumn[];
	rows: UnknownRecord[];
};

export type RegistrySections = {
	personalTitle: string;
	personal: RegistryField[];
	images: RegistryImage[];
	document: RegistryField[];
	contact: RegistryField[];
	additional: RegistryField[];
	tables: RegistryTable[];
	dataMatches: RegistryMatch[];
	faceMatch: RegistryMatch | null;
};

const COUNTRY_NAMES: Record<string, string> = {
	ci: "Côte d'Ivoire",
	gh: "Ghana",
	ke: "Kenya",
	ng: "Nigeria",
	us: "United States",
	za: "South Africa",
};

const BASE64_IMAGE_SIGNATURES: Array<[string, string]> = [
	["/9j/", "image/jpeg"],
	["iVBORw0KGgo", "image/png"],
	["R0lGOD", "image/gif"],
	["UklGR", "image/webp"],
];

export function isEmptyRegistryValue(value: unknown) {
	if (value === null || value === undefined) return true;
	if (typeof value === "string") return value.trim().length === 0;
	if (Array.isArray(value)) return value.length === 0;
	return false;
}

/** Korapay returns registry photos as raw base64 without a data URI prefix. */
export function toImageSrc(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!trimmed) return null;

	const lower = trimmed.toLowerCase();
	if (
		lower.startsWith("data:image/") ||
		lower.startsWith("http://") ||
		lower.startsWith("https://")
	) {
		return trimmed;
	}

	for (const [signature, mimeType] of BASE64_IMAGE_SIGNATURES) {
		if (trimmed.startsWith(signature)) {
			return `data:${mimeType};base64,${trimmed}`;
		}
	}

	return null;
}

function field(
	data: UnknownRecord,
	key: string,
	label: string,
	options: Omit<RegistryField, "key" | "label" | "value"> = {},
): RegistryField {
	return { key, label, value: data[key], ...options };
}

function recordRows(value: unknown): UnknownRecord[] {
	return asUnknownArray(value).flatMap((row) => {
		const record = asRecord(row);
		return record ? [record] : [];
	});
}

function computed(
	key: string,
	label: string,
	value: unknown,
	options: Omit<RegistryField, "key" | "label" | "value"> = {},
): RegistryField {
	return { key, label, value, ...options };
}

function nameFields(data: UnknownRecord, { withFullName = false } = {}) {
	return [
		...(withFullName
			? [field(data, "full_name", "Full Name", { wide: true })]
			: []),
		field(data, "first_name", "First Name"),
		field(data, "middle_name", "Middle Name"),
		field(data, "last_name", "Last Name"),
	];
}

function formatAddress(value: unknown): string | null {
	if (typeof value === "string") return value.trim() || null;
	const address = asRecord(value);
	if (!address) return null;

	const parts = [address.street, address.town, address.lga, address.state]
		.filter(
			(part): part is string =>
				typeof part === "string" && part.trim().length > 0,
		)
		.map((part) => part.trim());
	return parts.length > 0 ? parts.join(", ") : null;
}

function registryImages(data: UnknownRecord): RegistryImage[] {
	const candidates: Array<[string, string]> = [
		["image", "Registry Photo"],
		["signature", "Signature"],
	];

	return candidates.flatMap(([key, label]) => {
		const src = toImageSrc(data[key]);
		return src ? [{ key, label, src }] : [];
	});
}

function countryField(verificationType: string) {
	const prefix = verificationType.split("_")[0] ?? "";
	return computed("country", "Country", COUNTRY_NAMES[prefix]);
}

function documentBase(
	data: UnknownRecord,
	verificationType: string,
	documentType: string,
	idLabel: string,
): RegistryField[] {
	return [
		computed("document_type", "Document Type", documentType),
		field(data, "id", idLabel, { mono: true }),
		countryField(verificationType),
	];
}

function referenceFields(data: UnknownRecord): RegistryField[] {
	return [field(data, "reference", "Provider Reference", { mono: true })];
}

function requestedByField(data: UnknownRecord): RegistryField {
	return field(data, "requested_by", "Requested By");
}

function parseValidation(data: UnknownRecord) {
	const validation = asRecord(data.validation);
	const dataMatches: RegistryMatch[] = [];
	let faceMatch: RegistryMatch | null = null;
	let submittedSelfie: RegistryImage | null = null;

	if (!validation) {
		return { dataMatches, faceMatch, submittedSelfie };
	}

	const dataKeys: Array<[string, string]> = [
		["first_name", "First Name Match"],
		["last_name", "Last Name Match"],
		["date_of_birth", "Date of Birth Match"],
	];
	for (const [key, label] of dataKeys) {
		const entry = asRecord(validation[key]);
		if (entry && typeof entry.match === "boolean") {
			dataMatches.push({
				key,
				label,
				submitted: entry.value,
				match: entry.match,
			});
		}
	}

	const selfie = asRecord(validation.selfie);
	if (selfie && typeof selfie.match === "boolean") {
		const confidence = Number(selfie.confidence_rating);
		faceMatch = {
			key: "selfie",
			label: "Face Match",
			submitted: null,
			match: selfie.match,
			confidence: Number.isFinite(confidence) ? confidence : undefined,
		};
		const src = toImageSrc(selfie.value);
		if (src) {
			submittedSelfie = {
				key: "submitted_selfie",
				label: "Submitted Selfie",
				src,
			};
		}
	}

	return { dataMatches, faceMatch, submittedSelfie };
}

function emptySections(): Omit<RegistrySections, "dataMatches" | "faceMatch"> {
	return {
		personalTitle: "Personal Information",
		personal: [],
		images: [],
		document: [],
		contact: [],
		additional: [],
		tables: [],
	};
}

function buildTypeSections(
	verificationType: string,
	data: UnknownRecord,
): Omit<RegistrySections, "dataMatches" | "faceMatch"> {
	const sections = emptySections();

	switch (verificationType) {
		case "za_said_verification": {
			sections.personal = [
				...nameFields(data),
				field(data, "marital_status", "Marital Status", { format: "title" }),
				field(data, "date_of_marriage", "Date of Marriage", { format: "date" }),
				field(data, "country_of_birth", "Country of Birth", {
					format: "title",
				}),
				field(data, "deceased_status", "Deceased Status", { format: "title" }),
				field(data, "date_of_death", "Date of Death", { format: "date" }),
			];
			sections.document = [
				...documentBase(
					data,
					verificationType,
					"South African ID (SAID)",
					"ID Number",
				),
				field(data, "issued_date", "Issued Date", { format: "date" }),
				field(data, "is_smart_card_issued", "Smart Card Issued", {
					format: "yesNo",
				}),
				field(data, "sequence_number", "Sequence Number"),
				field(data, "hanis_reference", "HANIS Reference", { mono: true }),
				...referenceFields(data),
			];
			sections.additional = [
				field(data, "on_npr", "On National Population Register", {
					format: "yesNo",
				}),
				field(data, "on_hanis", "On HANIS", { format: "yesNo" }),
				requestedByField(data),
			];
			break;
		}

		case "ng_bvn_verification": {
			sections.personal = [
				field(data, "title", "Title"),
				...nameFields(data),
				field(data, "gender", "Gender", { format: "title" }),
				field(data, "date_of_birth", "Date of Birth", { format: "date" }),
				field(data, "marital_status", "Marital Status", { format: "title" }),
				field(data, "state_of_origin", "State of Origin"),
				field(data, "lga_of_origin", "LGA of Origin"),
			];
			sections.images = registryImages(data);
			sections.document = [
				...documentBase(
					data,
					verificationType,
					"Bank Verification Number (BVN)",
					"BVN",
				),
				field(data, "nin", "Linked NIN", { mono: true }),
				field(data, "name_on_card", "Name on Card"),
				field(data, "level_of_account", "Account Level"),
				field(data, "registration_date", "Registration Date", {
					format: "date",
				}),
				field(data, "enrollment_institution", "Enrollment Institution"),
				field(data, "enrollment_branch", "Enrollment Branch"),
				...referenceFields(data),
			];
			sections.contact = [
				field(data, "phone_number", "Phone Number"),
				field(data, "other_mobile", "Other Phone Number"),
				field(data, "email", "Email"),
				computed("address", "Address", formatAddress(data.address), {
					wide: true,
				}),
			];
			sections.additional = [
				field(data, "watch_listed", "Watch Listed", { format: "yesNo" }),
				requestedByField(data),
			];
			break;
		}

		case "ng_nin_verification":
		case "ng_advanced_phone_number_verification": {
			const isPhoneLookup =
				verificationType === "ng_advanced_phone_number_verification";
			const address = asRecord(data.address);
			sections.personal = [
				...nameFields(data),
				field(data, "gender", "Gender", { format: "title" }),
				field(data, "date_of_birth", "Date of Birth", { format: "date" }),
				field(data, "religion", "Religion", { format: "title" }),
				field(data, "birth_country", "Country of Birth", { format: "title" }),
				field(data, "birth_state", "State of Birth"),
				field(data, "birth_lga", "LGA of Birth"),
			];
			sections.images = registryImages(data);
			sections.document = [
				...documentBase(
					data,
					verificationType,
					isPhoneLookup
						? "NIN Linked to Phone Number"
						: "National Identification Number (NIN)",
					isPhoneLookup ? "Phone Number Searched" : "NIN",
				),
				...referenceFields(data),
			];
			sections.contact = [
				field(data, "phone_number", "Phone Number"),
				field(data, "email", "Email"),
				computed("address", "Address", formatAddress(data.address), {
					wide: true,
				}),
				computed("town", "Town", address?.town, { format: "title" }),
				computed("lga", "LGA", address?.lga),
				computed("state", "State", address?.state),
			];
			sections.additional = [
				field(data, "next_of_kin_state", "Next of Kin State"),
				requestedByField(data),
			];
			break;
		}

		case "ng_virtual_nin_verification": {
			sections.personal = [
				...nameFields(data),
				field(data, "gender", "Gender", { format: "title" }),
				field(data, "date_of_birth", "Date of Birth", { format: "date" }),
			];
			sections.images = registryImages(data);
			sections.document = [
				...documentBase(
					data,
					verificationType,
					"Virtual NIN (vNIN)",
					"Virtual NIN",
				),
				field(data, "v_nin_user_id", "vNIN User ID", { mono: true }),
				...referenceFields(data),
			];
			sections.contact = [field(data, "phone_number", "Phone Number")];
			sections.additional = [requestedByField(data)];
			break;
		}

		case "ng_phone_number_lookup": {
			sections.personal = [
				...nameFields(data, { withFullName: true }),
				field(data, "date_of_birth", "Date of Birth", { format: "date" }),
			];
			sections.document = [
				...documentBase(
					data,
					verificationType,
					"Phone Number Lookup",
					"Phone Number",
				),
				...referenceFields(data),
			];
			sections.additional = [requestedByField(data)];
			break;
		}

		case "ng_cac_lookup": {
			sections.personalTitle = "Company Information";
			sections.personal = [
				field(data, "name", "Company Name", { wide: true }),
				field(data, "brand_name", "Brand Name"),
				field(data, "former_name", "Former Name"),
				field(data, "type_of_entity", "Entity Type", { format: "title" }),
				field(data, "company_status", "Company Status", { format: "title" }),
				field(data, "activity_description", "Business Activity", {
					wide: true,
				}),
				field(data, "objectives", "Objectives", { wide: true }),
				field(data, "date_dissolved", "Date Dissolved", { format: "date" }),
			];
			sections.document = [
				...documentBase(
					data,
					verificationType,
					"Corporate Affairs Commission (CAC)",
					"Number Searched",
				),
				field(data, "registration_number", "Registration Number", {
					mono: true,
				}),
				field(data, "registry_number", "Registry Number", { mono: true }),
				field(data, "registration_date", "Registration Date", {
					format: "date",
				}),
				field(data, "registration_submission_date", "Registration Submitted", {
					format: "date",
				}),
				field(data, "tin", "TIN", { mono: true }),
				field(data, "jtb_tin", "JTB TIN", { mono: true }),
				field(data, "vat_number", "VAT Number", { mono: true }),
				field(data, "tax_office", "Tax Office"),
				field(data, "last_updated_at", "Registry Last Updated", {
					format: "datetime",
				}),
				...referenceFields(data),
			];
			sections.contact = [
				field(data, "email", "Email"),
				field(data, "website_email", "Website Email"),
				field(data, "phone_number", "Phone Number"),
				field(data, "address", "Registered Address", { wide: true }),
				field(data, "branch_address", "Branch Address", { wide: true }),
				field(data, "head_office_address", "Head Office Address", {
					wide: true,
				}),
				field(data, "city", "City", { format: "title" }),
				field(data, "lga", "LGA"),
				field(data, "state", "State", { format: "title" }),
			];
			sections.additional = [
				field(data, "shares_issued", "Shares Issued"),
				field(data, "shares_value", "Share Value"),
				field(data, "paid_share_capital", "Paid Share Capital"),
				field(data, "subscribed_share_capital", "Subscribed Share Capital"),
				field(data, "share_capital_in_words", "Share Capital (in Words)", {
					wide: true,
				}),
				requestedByField(data),
			];
			sections.tables = [
				{
					key: "key_personnel",
					title: "Key Personnel",
					columns: [
						{ key: "name", label: "Name" },
						{ key: "designation", label: "Designation", format: "title" },
						{ key: "status", label: "Status", format: "title" },
						{ key: "occupation", label: "Occupation", format: "title" },
						{
							key: "country_of_residence",
							label: "Country of Residence",
							format: "title",
						},
						{ key: "appointed_on", label: "Appointed On", format: "date" },
					],
					rows: recordRows(data.key_personnel),
				},
				{
					key: "company_contact_persons",
					title: "Contact Persons",
					columns: [
						{ key: "name", label: "Name" },
						{ key: "emails", label: "Email" },
						{ key: "phones", label: "Phone" },
					],
					rows: asUnknownArray(data.company_contact_persons).flatMap(
						(row): UnknownRecord[] => {
							const person = asRecord(row);
							if (!person) return [];
							const contacts = asRecord(person.contacts);
							return [
								{
									name: person.name,
									emails: asUnknownArray(contacts?.email).join(", "),
									phones: asUnknownArray(contacts?.phone).join(", "),
								},
							];
						},
					),
				},
				{
					key: "filings",
					title: "Filings",
					columns: [
						{ key: "date", label: "Date", format: "date" },
						{ key: "name", label: "Name" },
						{ key: "type", label: "Type" },
						{ key: "status", label: "Status", format: "title" },
					],
					rows: recordRows(data.filings),
				},
				{
					key: "affiliates",
					title: "Affiliates",
					columns: [
						{ key: "name", label: "Name" },
						{ key: "company_number", label: "Company Number" },
						{ key: "country", label: "Country" },
					],
					rows: recordRows(data.affiliates),
				},
				{
					key: "legal_entity_identifier_register",
					title: "Legal Entity Identifiers",
					columns: [
						{ key: "legal_name", label: "Legal Name" },
						{ key: "legal_entity_identifier_code", label: "LEI Code" },
						{ key: "entity_status", label: "Status", format: "title" },
						{ key: "legal_jurisdiction", label: "Jurisdiction" },
					],
					rows: recordRows(data.legal_entity_identifier_register),
				},
				{
					key: "central_index_key_register",
					title: "Central Index Key Register",
					columns: [
						{ key: "name", label: "Name" },
						{ key: "cik", label: "CIK" },
						{ key: "ein", label: "EIN" },
						{ key: "sic_description", label: "Industry" },
						{ key: "state_of_incorporation", label: "Incorporated In" },
					],
					rows: recordRows(data.central_index_key_register),
				},
			];
			break;
		}

		case "ng_passport_verification": {
			sections.personal = [
				...nameFields(data),
				field(data, "gender", "Gender", { format: "title" }),
				field(data, "date_of_birth", "Date of Birth", { format: "date" }),
			];
			sections.images = registryImages(data);
			sections.document = [
				...documentBase(
					data,
					verificationType,
					"Nigerian International Passport",
					"Passport Number",
				),
				field(data, "issued_date", "Issued Date", { format: "date" }),
				field(data, "expired_date", "Expiry Date", { format: "date" }),
				field(data, "issued_at", "Place of Issue", { format: "title" }),
				...referenceFields(data),
			];
			sections.contact = [field(data, "phone_number", "Phone Number")];
			sections.additional = [requestedByField(data)];
			break;
		}

		case "ke_passport_lookup":
		case "ke_national_id_lookup": {
			const isPassport = verificationType === "ke_passport_lookup";
			sections.personal = [
				...nameFields(data, { withFullName: true }),
				field(data, "gender", "Gender", { format: "title" }),
				field(data, "date_of_birth", "Date of Birth", { format: "date" }),
				field(data, "nationality", "Nationality", { format: "title" }),
			];
			sections.images = registryImages(data);
			sections.document = [
				...documentBase(
					data,
					verificationType,
					isPassport ? "Kenyan Passport" : "Kenyan National ID",
					isPassport ? "Passport Number" : "National ID Number",
				),
				...(isPassport
					? []
					: [field(data, "type", "ID Category", { format: "title" })]),
				...referenceFields(data),
			];
			sections.additional = [requestedByField(data)];
			break;
		}

		case "ke_tax_pin_verification": {
			sections.personalTitle = "Taxpayer Information";
			sections.personal = [
				field(data, "taxpayer_name", "Taxpayer Name", { wide: true }),
				field(data, "obligation_name", "Tax Obligation", { wide: true }),
			];
			sections.document = [
				...documentBase(data, verificationType, "KRA Tax PIN", "Tax PIN"),
				field(data, "pin_status", "PIN Status", { format: "title" }),
				field(data, "pin_current_status", "Registration Status", {
					format: "title",
				}),
				field(data, "itax_status", "iTax Status"),
				field(data, "effective_from_date", "Effective From", {
					format: "date",
				}),
				field(data, "effective_to_date", "Effective To", { format: "date" }),
				...referenceFields(data),
			];
			sections.additional = [requestedByField(data)];
			break;
		}

		case "ke_phone_number_lookup": {
			sections.personal = [
				...nameFields(data, { withFullName: true }),
				field(data, "gender", "Gender", { format: "title" }),
				field(data, "date_of_birth", "Date of Birth", { format: "date" }),
				field(data, "marital_status", "Marital Status", { format: "title" }),
			];
			sections.document = [
				...documentBase(
					data,
					verificationType,
					"Phone Number Lookup",
					"Phone Number Searched",
				),
				field(data, "identity_type", "Linked Identity Type", {
					format: "title",
				}),
				...referenceFields(data),
			];
			sections.contact = [
				field(data, "mobile_telephone_number", "Mobile Number"),
				field(data, "home_telephone_number", "Home Telephone"),
				field(data, "work_telephone_number", "Work Telephone"),
				field(data, "email", "Email"),
			];
			sections.additional = [requestedByField(data)];
			break;
		}

		case "gh_ssnit_lookup": {
			sections.personal = [
				...nameFields(data, { withFullName: true }),
				field(data, "gender", "Gender", { format: "title" }),
				field(data, "date_of_birth", "Date of Birth", { format: "date" }),
				field(data, "nationality", "Nationality", { format: "title" }),
			];
			sections.images = registryImages(data);
			sections.document = [
				...documentBase(data, verificationType, "SSNIT", "SSNIT Number"),
				field(data, "fss_no", "FSS Number", { mono: true }),
				field(data, "card_serial", "Card Serial Number", { mono: true }),
				...referenceFields(data),
			];
			sections.additional = [requestedByField(data)];
			break;
		}

		case "gh_drivers_license_lookup": {
			sections.personal = [
				...nameFields(data, { withFullName: true }),
				field(data, "date_of_birth", "Date of Birth", { format: "date" }),
				field(data, "nationality", "Nationality", { format: "title" }),
			];
			sections.images = registryImages(data);
			sections.document = [
				...documentBase(
					data,
					verificationType,
					"Ghanaian Driver's License",
					"License Number",
				),
				field(data, "pin", "License PIN", { mono: true }),
				field(data, "class_of_license", "License Class"),
				field(data, "issued_date", "Issued Date", { format: "date" }),
				field(data, "expired_date", "Expiry Date", { format: "date" }),
				field(data, "certificate_date", "Certificate Date", { format: "date" }),
				field(data, "certificate_of_competence", "Certificate of Competence", {
					mono: true,
				}),
				field(data, "processing_center", "Processing Center"),
				...referenceFields(data),
			];
			sections.additional = [requestedByField(data)];
			break;
		}

		case "gh_passport_lookup": {
			sections.personal = [
				...nameFields(data, { withFullName: true }),
				field(data, "gender", "Gender", { format: "title" }),
				field(data, "date_of_birth", "Date of Birth", { format: "date" }),
				field(data, "place_of_birth", "Place of Birth", { format: "title" }),
				field(data, "nationality", "Nationality", { format: "title" }),
			];
			sections.images = registryImages(data);
			sections.document = [
				...documentBase(
					data,
					verificationType,
					"Ghanaian Passport",
					"Passport Number",
				),
				field(data, "issued_date", "Issued Date", { format: "date" }),
				field(data, "expired_date", "Expiry Date", { format: "date" }),
				field(data, "issued_at", "Place of Issue", { format: "title" }),
				...referenceFields(data),
			];
			sections.additional = [requestedByField(data)];
			break;
		}

		case "gh_voter_card_lookup": {
			sections.personal = [
				...nameFields(data, { withFullName: true }),
				field(data, "gender", "Gender", { format: "title" }),
				field(data, "date_of_birth", "Date of Birth", { format: "date" }),
				field(data, "age", "Age"),
				field(data, "nationality", "Nationality", { format: "title" }),
			];
			sections.images = registryImages(data);
			sections.document = [
				...documentBase(
					data,
					verificationType,
					"Ghanaian Voter's Card",
					"Voter ID",
				),
				field(data, "voter_type", "Card Type", { format: "title" }),
				field(data, "polling_station", "Polling Station", { mono: true }),
				...referenceFields(data),
			];
			sections.additional = [requestedByField(data)];
			break;
		}

		default: {
			// Côte d'Ivoire, US SSN and any future registry type until it gets its own mapping.
			sections.personal = [
				...nameFields(data, { withFullName: true }),
				field(data, "gender", "Gender", { format: "title" }),
				field(data, "date_of_birth", "Date of Birth", { format: "date" }),
				field(data, "nationality", "Nationality", { format: "title" }),
			];
			sections.images = registryImages(data);
			sections.document = [
				computed("document_type", "Document Type", data.id_type, {
					format: "title",
				}),
				field(data, "id", "ID Number", { mono: true }),
				countryField(verificationType),
				...referenceFields(data),
			];
			sections.contact = [
				field(data, "phone_number", "Phone Number"),
				field(data, "email", "Email"),
				computed("address", "Address", formatAddress(data.address), {
					wide: true,
				}),
			];
			sections.additional = [requestedByField(data)];
			break;
		}
	}

	return sections;
}

const SEARCHED_ID_INPUT_KEYS: Record<string, string> = {
	za_said_verification: "id_number",
	ng_bvn_verification: "bvn",
	ng_nin_verification: "nin",
	ng_virtual_nin_verification: "virtual_nin",
	ng_phone_number_lookup: "phone_number",
	ng_advanced_phone_number_verification: "phone_number",
	ng_cac_lookup: "cac_number",
	ng_passport_verification: "passport_id",
	gh_passport_lookup: "passport_number",
	gh_voter_card_lookup: "voter_id",
	gh_ssnit_lookup: "ssnit_number",
	gh_drivers_license_lookup: "license_number",
	ke_passport_lookup: "passport_number",
	ke_national_id_lookup: "national_id",
	ke_phone_number_lookup: "phone_number",
	ke_tax_pin_verification: "tax_pin",
};

function withoutEmpty(fields: RegistryField[]) {
	return fields.filter((entry) => !isEmptyRegistryValue(entry.value));
}

export function buildRegistrySections(
	verificationType: string,
	responseData: UnknownRecord,
	{
		inputData,
		failureMessage,
	}: { inputData?: UnknownRecord | null; failureMessage?: string } = {},
): RegistrySections {
	const searchedIdKey = SEARCHED_ID_INPUT_KEYS[verificationType];
	// Failed lookups return an empty `data` object, so fall back to the submitted identifier.
	const data =
		isEmptyRegistryValue(responseData.id) && searchedIdKey && inputData
			? { ...responseData, id: inputData[searchedIdKey] }
			: responseData;

	const sections = buildTypeSections(verificationType, data);
	const { dataMatches, faceMatch, submittedSelfie } = parseValidation(data);
	const document = failureMessage
		? [
				...sections.document,
				computed("registry_message", "Registry Response", failureMessage, {
					wide: true,
				}),
			]
		: sections.document;

	return {
		...sections,
		personal: withoutEmpty(sections.personal),
		images: submittedSelfie
			? [...sections.images, submittedSelfie]
			: sections.images,
		document: withoutEmpty(document),
		contact: withoutEmpty(sections.contact),
		additional: withoutEmpty(sections.additional),
		tables: sections.tables.filter((table) => table.rows.length > 0),
		dataMatches,
		faceMatch,
	};
}
