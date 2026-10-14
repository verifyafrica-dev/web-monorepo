import { getCountryName } from "@verifyafrica/ui/lib/country-state-city";
import { isValid, parse } from "date-fns";

import {
	asNonEmptyString,
	asRecord,
	asUnknownArray,
	formatHumanLabel,
	formatLanguageName,
	getResponsePayload,
	type UnknownRecord,
} from "../../-utils";
import { isEmptyReportValue, type ReportField } from "../report-sections";

export type KybRegistry = {
	name: string;
	official: boolean | undefined;
};

export type KybCompanySummary = {
	key: string;
	name: string;
	registrationNumber?: string;
	jurisdiction?: string;
	registrationDate?: string;
	dissolutionDate?: string;
	status?: string;
	registries: KybRegistry[];
	raw: UnknownRecord;
};

export type KybTableColumn = { key: string; label: string };

export type KybTable = {
	key: string;
	title: string;
	columns: KybTableColumn[];
	rows: UnknownRecord[];
};

export type KybContact = {
	key: string;
	label: string;
	value: string;
	href?: string;
};

export type KybOrgChartPerson = { name: string; designation?: string };

export type KybAnnouncement = {
	key: string;
	date?: string;
	title?: string;
	description?: string;
	color?: string;
};

export type KybCompanyDetail = {
	description?: string;
	overview: ReportField[];
	addresses: ReportField[];
	contacts: KybContact[];
	officers: KybTable | null;
	orgChart: KybOrgChartPerson[][];
	owners: KybTable | null;
	financials: KybTable[];
	announcements: KybAnnouncement[];
	additional: ReportField[];
};

export type KybOutcome = {
	kybResult: unknown;
	declinedReason?: string;
	declinedCodes: string[];
	companiesFound: number;
	registries: KybRegistry[];
	providerCustomerId?: string;
};

const KYB_BASE_LABELS: Record<string, string> = {
	search: "Search",
	document: "Document",
	document_purchase: "Document Purchase",
};

const KYB_SEARCH_TYPE_LABELS: Record<string, string> = {
	fuzzy: "Fuzzy",
	contains: "Contains",
	start_with: "Starts With",
};

const KYB_IDENTIFIER_LABELS: Record<string, string> = {
	company_name: "Company Name",
	registration_number: "Company Registration Number",
	vat_number: "VAT Number",
	freelance_number: "Freelance Number",
	tax_identification_number: "Tax Identification Number",
	commercial_registration_number: "Commercial Registration Number",
	cnpj_number: "CNPJ Number",
	trn_number: "TRN Number",
	iban_number: "IBAN Number",
	license_number: "License Number",
	vat_certificate_number: "VAT Certificate Number",
};

const UPPERCASE_WORDS = new Set([
	"PLC",
	"LTD",
	"LLC",
	"LLP",
	"INC",
	"RC",
	"NG",
	"USA",
	"UK",
]);

const CONTACT_LABELS: Record<string, string> = {
	telephone_number: "Phone",
	phone_number: "Phone",
	mobile_number: "Mobile",
	fax_number: "Fax",
	email: "Email",
	email_address: "Email",
	website_link: "Website",
	domain: "Domain",
};

const FINANCIAL_TABLE_TITLES: Record<string, string> = {
	sale_per_business_information: "Sales by Business Segment",
	sale_per_region: "Sales by Region",
	shares_information: "Share Structure",
};

const FINANCIAL_NAME_LABELS: Record<string, string> = {
	sale_per_business_information: "Segment",
	sale_per_region: "Region",
};

const FINANCIAL_COLUMN_LABELS: Record<string, string> = {
	year: "Year",
	delta: "Change",
	weight: "Share of Total",
	"USD in Million": "USD (Millions)",
	stock_type: "Stock Type",
	vote: "Votes per Share",
};

const OFFICER_COLUMNS: KybTableColumn[] = [
	{ key: "name", label: "Name" },
	{ key: "designation", label: "Designation" },
	{ key: "position", label: "Position" },
	{ key: "employment_status", label: "Status" },
	{ key: "appointment_date", label: "Appointed" },
	{ key: "appointment_period", label: "Tenure" },
	{ key: "age", label: "Age" },
];

const OWNER_COLUMNS: KybTableColumn[] = [
	{ key: "name", label: "Name" },
	{ key: "designation", label: "Role" },
	{ key: "total_percentage_of_shares", label: "Ownership" },
	{ key: "ownership_max_shares", label: "Shares Held" },
	{ key: "total_valuation", label: "Valuation" },
];

const KNOWN_COMPANY_KEYS = new Set([
	"name",
	"company_name",
	"description",
	"country_name",
	"jurisdiction_code",
	"company_jurisdiction_code",
	"registration_number",
	"company_number",
	"native_company_number",
	"registration_date",
	"company_registration_date",
	"company_incorporation_date",
	"company_registration_period",
	"dissolution_date",
	"years_since_dissolution",
	"company_type",
	"type",
	"company_status",
	"company_current_status",
	"status",
	"company_registered_address",
	"company_registered_address_in_full",
	"contacts_detail",
	"company_officers",
	"company_officers_detail_graph",
	"company_ultimate_beneficial_owners",
	"additional_detail",
	"annoucements_detail",
	"announcements_detail",
	"additional_data",
]);

const KNOWN_COMPANY_ADDITIONAL_DATA_KEYS = new Set([
	"registries_detail",
	"company_fetched_data_status",
]);

function computed(
	key: string,
	label: string,
	value: unknown,
	options: Omit<ReportField, "key" | "label" | "value"> = {},
): ReportField {
	return { key, label, value, ...options };
}

function withoutEmpty(fields: ReportField[]) {
	return fields.filter((entry) => !isEmptyReportValue(entry.value));
}

function records(value: unknown): UnknownRecord[] {
	return asUnknownArray(value).flatMap((item) => {
		const record = asRecord(item);
		return record ? [record] : [];
	});
}

function firstString(...values: unknown[]) {
	for (const value of values) {
		const text =
			typeof value === "number" ? String(value) : asNonEmptyString(value);
		if (text) return text;
	}
	return undefined;
}

function labelFrom(map: Record<string, string>, value: unknown) {
	const raw = asNonEmptyString(value);
	if (!raw) return undefined;
	return map[raw] ?? formatHumanLabel(raw);
}

function formatCountry(value: unknown) {
	const raw = asNonEmptyString(value);
	if (!raw) return undefined;
	return getCountryName(raw) || formatHumanLabel(raw);
}

/** Registries often return names in all caps; keep mixed-case names untouched. */
export function formatCompanyName(value: unknown) {
	const raw = asNonEmptyString(value);
	if (!raw) return undefined;
	if (raw !== raw.toUpperCase()) return raw;
	return raw
		.toLowerCase()
		.replace(/[a-z0-9']+/g, (word) =>
			UPPERCASE_WORDS.has(word.toUpperCase())
				? word.toUpperCase()
				: word.charAt(0).toUpperCase() + word.slice(1),
		);
}

function httpHref(value: string) {
	const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
	try {
		const url = new URL(withScheme);
		return url.protocol === "http:" || url.protocol === "https:"
			? url.toString()
			: undefined;
	} catch {
		return undefined;
	}
}

function contactHref(type: string, value: string) {
	if (type.includes("email")) return `mailto:${value}`;
	if (type.includes("phone") || type.includes("telephone")) {
		return `tel:${value.replace(/[^\d+]/g, "")}`;
	}
	if (type === "website_link" || type === "domain") return httpHref(value);
	return undefined;
}

function parseRegistries(company: UnknownRecord): KybRegistry[] {
	const additionalData = asRecord(company.additional_data) ?? {};
	return records(additionalData.registries_detail).flatMap((registry) => {
		const name = asNonEmptyString(registry.name);
		if (!name) return [];
		const sourceType = asNonEmptyString(registry.source_type)?.toLowerCase();
		return [
			{
				name,
				official:
					sourceType === "official"
						? true
						: sourceType === "unofficial"
							? false
							: undefined,
			},
		];
	});
}

function uniqueRegistries(registries: KybRegistry[]) {
	const byName = new Map<string, KybRegistry>();
	for (const registry of registries) {
		if (!byName.has(registry.name)) byName.set(registry.name, registry);
	}
	return [...byName.values()];
}

function tableFromRows(
	key: string,
	title: string,
	columns: KybTableColumn[],
	rows: UnknownRecord[],
): KybTable | null {
	const visibleColumns = columns.filter((column) =>
		rows.some((row) => !isEmptyReportValue(row[column.key])),
	);
	return rows.length > 0 && visibleColumns.length > 0
		? { key, title, columns: visibleColumns, rows }
		: null;
}

function financialTables(company: UnknownRecord): KybTable[] {
	return records(company.additional_detail).flatMap((detail, index) => {
		const type = asNonEmptyString(detail.type) ?? `detail_${index}`;
		const rows = records(detail.data);
		const columnKeys: string[] = [];
		for (const row of rows) {
			for (const columnKey of Object.keys(row)) {
				if (!columnKeys.includes(columnKey)) columnKeys.push(columnKey);
			}
		}
		const columns = columnKeys.map((columnKey) => ({
			key: columnKey,
			label:
				columnKey === "name"
					? (FINANCIAL_NAME_LABELS[type] ?? "Name")
					: (FINANCIAL_COLUMN_LABELS[columnKey] ?? columnKey),
		}));
		const table = tableFromRows(
			`${type}-${index}`,
			FINANCIAL_TABLE_TITLES[type] ?? formatHumanLabel(type),
			columns,
			rows,
		);
		return table ? [table] : [];
	});
}

const ANNOUNCEMENT_DATE_FORMATS = ["yyyy-MMM-dd", "dd-MMM-yy", "MMM dd, yyyy"];

function announcementTime(date: string | undefined) {
	if (!date) return Number.NEGATIVE_INFINITY;
	for (const pattern of ANNOUNCEMENT_DATE_FORMATS) {
		const parsed = parse(date, pattern, new Date());
		if (isValid(parsed)) return parsed.getTime();
	}
	return Number.NEGATIVE_INFINITY;
}

function announcements(company: UnknownRecord): KybAnnouncement[] {
	return records(company.annoucements_detail ?? company.announcements_detail)
		.map((item, index) => {
			const color = asNonEmptyString(item.color);
			return {
				key: `${index}`,
				date: asNonEmptyString(item.date),
				title: asNonEmptyString(item.title),
				description: asNonEmptyString(item.description),
				color: color && /^#[0-9a-f]{6}$/i.test(color) ? color : undefined,
			};
		})
		.filter((item) => item.title || item.description)
		.sort((a, b) => announcementTime(b.date) - announcementTime(a.date));
}

function orgChart(company: UnknownRecord): KybOrgChartPerson[][] {
	return asUnknownArray(company.company_officers_detail_graph)
		.map((level) =>
			records(level).flatMap((person) => {
				const name = asNonEmptyString(person.name);
				return name
					? [{ name, designation: asNonEmptyString(person.designation) }]
					: [];
			}),
		)
		.filter((level) => level.length > 0);
}

function contacts(company: UnknownRecord): KybContact[] {
	return records(company.contacts_detail).flatMap((contact, index) => {
		const value = asNonEmptyString(contact.value);
		if (!value) return [];
		const type = asNonEmptyString(contact.type)?.toLowerCase() ?? "";
		return [
			{
				key: `${type}-${index}`,
				label: CONTACT_LABELS[type] ?? formatHumanLabel(type || "contact"),
				value,
				href: contactHref(type, value),
			},
		];
	});
}

function addresses(company: UnknownRecord): ReportField[] {
	if (typeof company.company_registered_address === "string") {
		return withoutEmpty([
			computed(
				"registered_address",
				"Registered Address",
				company.company_registered_address,
				{ wide: true },
			),
		]);
	}

	const fromList = records(company.company_registered_address).map(
		(address, index) =>
			computed(
				`address-${index}`,
				asNonEmptyString(address.description) ??
					formatHumanLabel(asNonEmptyString(address.type) ?? "address"),
				address.address,
				{ wide: true },
			),
	);

	return withoutEmpty([
		...fromList,
		computed(
			"registered_address_in_full",
			"Registered Address",
			fromList.length === 0
				? company.company_registered_address_in_full
				: undefined,
			{ wide: true },
		),
	]);
}

function isPrimitive(value: unknown) {
	return (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	);
}

function leftoverFields(
	source: UnknownRecord,
	knownKeys: Set<string>,
	keyPrefix: string,
): ReportField[] {
	return Object.entries(source).flatMap(([key, value]): ReportField[] => {
		if (knownKeys.has(key) || isEmptyReportValue(value)) return [];
		const label = formatHumanLabel(key);
		if (isPrimitive(value)) {
			return [
				computed(`${keyPrefix}.${key}`, label, value, {
					format: typeof value === "boolean" ? "yesNo" : "text",
				}),
			];
		}
		if (Array.isArray(value) && value.every(isPrimitive)) {
			return [computed(`${keyPrefix}.${key}`, label, value)];
		}
		return [];
	});
}

export function buildKybInputFields(inputData: unknown): ReportField[] {
	const input = asRecord(inputData) ?? {};
	const kyb = asRecord(input.kyb) ?? {};
	const collect = asRecord(input.collect) ?? {};
	const ttl = Number(input.ttl);

	return withoutEmpty([
		computed("email", "Email", input.email),
		computed("language", "Language", formatLanguageName(input.language)),
		computed("base", "KYB Base", labelFrom(KYB_BASE_LABELS, kyb.base)),
		computed(
			"jurisdiction",
			"Business Jurisdiction",
			formatCountry(
				kyb.company_jurisdiction_code ?? kyb.jurisdiction_code ?? input.country,
			),
		),
		computed("company_name", "Company Name", kyb.company_name),
		computed("company_names", "Company Names", kyb.company_names),
		computed(
			"company_registration_number",
			"Company Registration Number",
			kyb.company_registration_number ??
				kyb.registration_number ??
				input.rc_number,
			{ mono: true },
		),
		computed(
			"search_type",
			"Search Type",
			labelFrom(KYB_SEARCH_TYPE_LABELS, kyb.search_type),
		),
		computed(
			"search_by",
			"Search Identifier",
			labelFrom(KYB_IDENTIFIER_LABELS, kyb.search_by),
		),
		computed("search_word", "Other Identifier Value", kyb.search_word),
		computed("advanced_search", "Advanced Search", kyb.advanced_search, {
			format: "yesNo",
		}),
		computed(
			"ai_business_insights",
			"AI Business Insights",
			kyb.ai_business_insights,
			{ format: "yesNo" },
		),
		computed("validate_document", "Validate Document", kyb.validate_document, {
			format: "yesNo",
		}),
		computed(
			"required_documents",
			"Required Documents",
			asUnknownArray(kyb.required_documents).map((item) =>
				formatHumanLabel(String(item)),
			),
			{ wide: true },
		),
		computed(
			"additional_proof_labels",
			"Additional Proof Labels",
			asUnknownArray(kyb.additional_proof_labels).map((item) =>
				formatHumanLabel(String(item)),
			),
			{ wide: true },
		),
		computed(
			"ttl",
			"Link Expiry",
			Number.isFinite(ttl) && ttl > 0 ? `${ttl} minutes` : undefined,
		),
		computed("send_email", "Link Emailed to Customer", input.send_email, {
			format: "yesNo",
		}),
		computed(
			"jurisdiction_locked",
			"Jurisdiction Locked for Customer",
			collect.jurisdiction_locked,
			{ format: "yesNo" },
		),
		computed(
			"search_by_locked",
			"Search Identifier Locked for Customer",
			collect.search_by_locked,
			{ format: "yesNo" },
		),
	]);
}

export function getKybCompanies(responseData: unknown): KybCompanySummary[] {
	const payload = getResponsePayload(responseData);
	const kyb = asRecord(payload.verification_data)?.kyb;
	const companies = Array.isArray(kyb) ? records(kyb) : records([kyb]);

	return companies.map((company, index) => {
		const dissolutionDate = asNonEmptyString(company.dissolution_date);
		return {
			key: `company-${index}`,
			name:
				formatCompanyName(firstString(company.company_name, company.name)) ??
				`Company ${index + 1}`,
			registrationNumber: firstString(
				company.registration_number,
				company.company_number,
				company.native_company_number,
			),
			jurisdiction: formatCountry(
				firstString(
					company.jurisdiction_code,
					company.company_jurisdiction_code,
					company.country_name,
				),
			),
			registrationDate: firstString(
				company.registration_date,
				company.company_registration_date,
				company.company_incorporation_date,
			),
			dissolutionDate,
			status: dissolutionDate
				? "Dissolved"
				: labelFrom(
						{},
						firstString(
							company.company_current_status,
							company.company_status,
							company.status,
						),
					),
			registries: parseRegistries(company),
			raw: company,
		};
	});
}

export function buildKybOutcome(
	responseData: unknown,
	companies: KybCompanySummary[],
): KybOutcome {
	const payload = getResponsePayload(responseData);
	const result = asRecord(payload.verification_result) ?? {};
	return {
		kybResult: result.kyb_service ?? result.kyb,
		declinedReason: asNonEmptyString(payload.declined_reason),
		declinedCodes: asUnknownArray(payload.declined_codes)
			.map((code) => String(code ?? "").trim())
			.filter(Boolean),
		companiesFound: companies.length,
		registries: uniqueRegistries(
			companies.flatMap((company) => company.registries),
		),
		providerCustomerId: asNonEmptyString(payload.customer_unique_id),
	};
}

export function buildKybCompanyDetail(
	company: KybCompanySummary,
): KybCompanyDetail {
	const raw = company.raw;
	const additionalData = asRecord(raw.additional_data) ?? {};

	const overview = withoutEmpty([
		computed("name", "Company Name", company.name, { wide: true }),
		computed(
			"registration_number",
			"Registration Number",
			company.registrationNumber,
			{
				mono: true,
			},
		),
		computed("jurisdiction", "Jurisdiction", company.jurisdiction),
		computed(
			"company_type",
			"Company Type",
			firstString(raw.company_type, raw.type),
			{
				format: "title",
			},
		),
		computed("status", "Status", company.status),
		computed(
			"registration_date",
			"Registration Date",
			company.registrationDate,
		),
		computed(
			"company_registration_period",
			"Registered For",
			raw.company_registration_period,
		),
		computed("dissolution_date", "Dissolution Date", company.dissolutionDate),
		computed(
			"years_since_dissolution",
			"Dissolved For",
			raw.years_since_dissolution,
		),
		computed(
			"data_sources",
			"Data Sources",
			company.registries.map(
				(registry) =>
					`${registry.name}${
						registry.official === undefined
							? ""
							: registry.official
								? " (Official)"
								: " (Unofficial)"
					}`,
			),
			{ wide: true },
		),
	]);

	const officerRows = records(raw.company_officers).map((officer) => ({
		...officer,
		employment_status: labelFrom({}, officer.employment_status),
	}));

	const ownerRows = records(raw.company_ultimate_beneficial_owners).map(
		(owner) => ({
			...owner,
			name: formatCompanyName(owner.name) ?? owner.name,
			ownership_max_shares: asRecord(owner.shares_detail)?.ownership_max_shares,
		}),
	);

	return {
		description: asNonEmptyString(raw.description),
		overview,
		addresses: addresses(raw),
		contacts: contacts(raw),
		officers: tableFromRows(
			"officers",
			"Officers",
			OFFICER_COLUMNS,
			officerRows,
		),
		orgChart: orgChart(raw),
		owners: tableFromRows(
			"owners",
			"Ultimate Beneficial Owners",
			OWNER_COLUMNS,
			ownerRows,
		),
		financials: financialTables(raw),
		announcements: announcements(raw),
		additional: withoutEmpty([
			computed(
				"company_fetched_data_status",
				"Data Retrieval Status",
				additionalData.company_fetched_data_status,
				{ format: "title" },
			),
			...leftoverFields(raw, KNOWN_COMPANY_KEYS, "company"),
			...leftoverFields(
				additionalData,
				KNOWN_COMPANY_ADDITIONAL_DATA_KEYS,
				"company.additional_data",
			),
		]),
	};
}
