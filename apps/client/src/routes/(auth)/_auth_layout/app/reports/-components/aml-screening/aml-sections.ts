import {
	asNonEmptyString,
	asRecord,
	asUnknownArray,
	formatHumanLabel,
	getResponsePayload,
	type UnknownRecord,
} from "../../-utils";
import {
	asStringArray,
	buildProviderOutcome,
	computed,
	formatCountry,
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

export type AmlRiskCategory =
	| "sanction"
	| "pep"
	| "adverse_media"
	| "warning"
	| "fitness_probity"
	| "special_interest"
	| "other";

export type AmlSource = {
	key: string;
	name: string;
	url?: string;
	description?: string;
	types: string[];
	countries: string[];
	listedAt?: string;
	updatedAt?: string;
};

export type AmlMediaArticle = {
	key: string;
	title: string;
	url?: string;
	snippet?: string;
	keywords: string[];
	date?: string;
};

export type AmlAssociate = { key: string; name: string; association?: string };

export type AmlRole = {
	key: string;
	designation: string;
	institution?: string;
	tenure?: string;
};

export type AmlLink = { key: string; label: string; url: string };

export type AmlHit = {
	key: string;
	name: string;
	originalName?: string;
	entityType?: string;
	score?: number;
	types: string[];
	categories: AmlRiskCategory[];
	matchTypes: string[];
	countries: string[];
	alternativeNames: string[];
	associates: AmlAssociate[];
	profile: ReportField[];
	roles: AmlRole[];
	notes: string[];
	flagSummaries: string[];
	sources: AmlSource[];
	media: AmlMediaArticle[];
	links: AmlLink[];
	imageUrl?: string;
};

export type AmlCategoryCount = {
	category: AmlRiskCategory;
	label: string;
	count: number;
};

export type AmlSubject = "individual" | "business";

export type AmlScreeningSections = {
	subject: AmlSubject;
	submitted: ReportField[];
	outcome: ProviderOutcome;
	checks: ReportCheck[];
	summary: ReportField[];
	categoryCounts: AmlCategoryCount[];
	hits: AmlHit[];
	proofs: SubmittedProof[];
	additional: ReportField[];
};

export const AML_CATEGORY_LABELS: Record<AmlRiskCategory, string> = {
	sanction: "Sanctions",
	pep: "Politically Exposed",
	adverse_media: "Adverse Media",
	warning: "Warnings",
	fitness_probity: "Fitness & Probity",
	special_interest: "Special Interest",
	other: "Other",
};

const CATEGORY_ORDER: AmlRiskCategory[] = [
	"sanction",
	"pep",
	"adverse_media",
	"warning",
	"fitness_probity",
	"special_interest",
	"other",
];

const TYPE_LABELS: Record<string, string> = {
	sanction: "Sanctions",
	warning: "Warnings",
	"fitness-probity": "Fitness & Probity",
	pep: "PEP",
	"pep-class-1": "PEP Class 1",
	"pep-class-2": "PEP Class 2",
	"pep-class-3": "PEP Class 3",
	"pep-class-4": "PEP Class 4",
	"adverse-media": "Adverse Media",
	"adverse-media-financial-crime": "Adverse Media · Financial Crime",
	"adverse-media-violent-crime": "Adverse Media · Violent Crime",
	"adverse-media-sexual-crime": "Adverse Media · Sexual Crime",
	"adverse-media-terrorism": "Adverse Media · Terrorism",
	"adverse-media-fraud": "Adverse Media · Fraud",
	"adverse-media-narcotics": "Adverse Media · Narcotics",
	"adverse-media-general": "Adverse Media · General",
	sip: "Special Interest Person",
	sie: "Special Interest Entity",
};

const MATCH_TYPE_LABELS: Record<string, string> = {
	exact_match: "Exact Name Match",
	potential_match: "Potential Match",
	profile_name: "Profile Name",
	name_exact: "Exact Name",
	name_fuzzy: "Fuzzy Name",
	aka_exact: "Exact Alias",
	aka_fuzzy: "Fuzzy Alias",
	alias: "Alias",
	rca_name: "Relative / Close Associate Name",
	birth_incorporation_date: "Date of Birth / Incorporation",
	year_of_birth: "Year of Birth",
	category: "Category",
	entity_type: "Entity Type",
	country: "Country",
};

/** Free-text profile fields shown as notes rather than in the profile grid. */
const NOTE_FIELDS = new Set([
	"notes",
	"description",
	"summary",
	"profile summary",
	"biography",
]);

/** Name parts are already covered by the hit name and alternative names. */
const SKIPPED_FIELDS = new Set([
	"first name",
	"last name",
	"middle name",
	"second name",
	"father name",
	"english name",
	"weak alias",
	"entity types",
	"entity type",
	"categories",
	"category",
	"image url",
	"wikipedia url",
	"website",
	"keywords",
]);

const DATE_FIELDS = new Set([
	"date of birth",
	"date of incorporation",
	"incorporation date",
	"date of death",
]);

const COUNTRY_CODE_FIELDS = new Set([
	"birth country",
	"citizenship",
	"country",
	"countries",
	"nationality",
]);

const PLACEHOLDER_VALUE = /^[\p{P}\s]*$/u;

const PROFILE_FIELD_ORDER = [
	"date of birth",
	"date of incorporation",
	"incorporation date",
	"place of birth",
	"country of birth",
	"birth country",
	"gender",
	"nationality",
	"citizenship",
	"country",
	"countries",
	"position",
	"designation",
	"position occupancies",
	"role",
	"occupation",
	"profession",
	"title",
	"political",
	"education",
	"address",
	"registration number",
	"tax number",
	"inn code",
	"passport number",
	"unique entity id",
	"program id",
];

const MAX_VALUES_PER_FIELD = 4;

const NON_LATIN_PATTERN = /[^\p{Script=Latin}\p{N}\p{P}\p{Zs}]/u;

function records(value: unknown): UnknownRecord[] {
	return asUnknownArray(value).flatMap((item) => {
		const record = asRecord(item);
		return record ? [record] : [];
	});
}

function uniqueStrings(values: string[]) {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const value of values) {
		const trimmed = value.trim();
		const key = trimmed.toLowerCase();
		if (!trimmed || seen.has(key)) continue;
		seen.add(key);
		result.push(trimmed);
	}
	return result;
}

function httpUrl(value: unknown) {
	const raw = asNonEmptyString(value);
	if (!raw) return undefined;
	try {
		const url = new URL(raw);
		return url.protocol === "http:" || url.protocol === "https:"
			? url.toString()
			: undefined;
	} catch {
		return undefined;
	}
}

export function formatAmlType(value: string) {
	return TYPE_LABELS[value.toLowerCase()] ?? formatHumanLabel(value);
}

export function formatMatchType(value: string) {
	return MATCH_TYPE_LABELS[value.toLowerCase()] ?? formatHumanLabel(value);
}

function categoryOf(type: string): AmlRiskCategory {
	const lower = type.toLowerCase();
	if (lower.startsWith("sanction")) return "sanction";
	if (lower.startsWith("pep")) return "pep";
	if (lower.startsWith("adverse-media")) return "adverse_media";
	if (lower === "warning") return "warning";
	if (lower === "fitness-probity") return "fitness_probity";
	if (lower === "sip" || lower === "sie") return "special_interest";
	return "other";
}

function normaliseDate(value: string) {
	const dayFirst = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
	return dayFirst ? `${dayFirst[3]}-${dayFirst[2]}-${dayFirst[1]}` : value;
}

/** Providers join variant spellings with " - "; split, normalise and de-duplicate them. */
function fieldValues(label: string, entries: UnknownRecord[]) {
	const lower = label.toLowerCase();
	const values = entries.flatMap((entry) => {
		const raw = asNonEmptyString(entry.value);
		return raw ? raw.split(" - ") : [];
	});
	const normalised = values.map((value) => {
		const trimmed = value.trim();
		if (DATE_FIELDS.has(lower)) return normaliseDate(trimmed);
		if (COUNTRY_CODE_FIELDS.has(lower) && /^[a-z]{2}$/i.test(trimmed)) {
			return formatCountry(trimmed) ?? trimmed;
		}
		return trimmed;
	});
	return uniqueStrings(normalised).filter(
		(value) => !PLACEHOLDER_VALUE.test(value),
	);
}

function profileFields(
	hitKey: string,
	fields: UnknownRecord,
): { profile: ReportField[]; notes: string[]; links: AmlLink[] } {
	const notes: string[] = [];
	const links: AmlLink[] = [];
	const profile: Array<ReportField & { order: number }> = [];

	for (const [label, rawEntries] of Object.entries(fields)) {
		const entries = records(rawEntries);
		const lower = label.toLowerCase();
		const values = fieldValues(label, entries);
		if (values.length === 0) continue;

		if (NOTE_FIELDS.has(lower)) {
			notes.push(...values);
			continue;
		}
		if (lower === "wikipedia url" || lower === "website") {
			for (const value of values) {
				const url = httpUrl(value);
				if (url) {
					links.push({
						key: `${lower}-${url}`,
						label: lower === "website" ? "Website" : "Wikipedia",
						url,
					});
				}
			}
			continue;
		}
		if (SKIPPED_FIELDS.has(lower)) continue;

		const shown = values.slice(0, MAX_VALUES_PER_FIELD);
		const remaining = values.length - shown.length;
		const order = PROFILE_FIELD_ORDER.indexOf(lower);
		const isDate = DATE_FIELDS.has(lower);
		profile.push({
			...computed(
				`${hitKey}.${lower}`,
				formatHumanLabel(label),
				shown.length === 1 && remaining === 0
					? shown[0]
					: [
							...shown,
							...(remaining > 0 ? [`and ${remaining} more`] : []),
						].join("\n"),
				{
					format: isDate && shown.length === 1 ? "date" : "text",
					multiline: shown.length > 1,
					wide: shown.length > 1 || shown[0].length > 60,
				},
			),
			order: order === -1 ? PROFILE_FIELD_ORDER.length : order,
		});
	}

	profile.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
	return {
		profile: profile.map(({ order: _order, ...field }) => field),
		notes: uniqueStrings(notes),
		links,
	};
}

function sourcesFor(hit: UnknownRecord): AmlSource[] {
	const details = records(hit.source_details);
	const detailByName = new Map<string, UnknownRecord>();
	for (const detail of details) {
		const publisher = asNonEmptyString(detail.publisher);
		if (publisher && !detailByName.has(publisher.toLowerCase())) {
			detailByName.set(publisher.toLowerCase(), detail);
		}
	}

	const sources: AmlSource[] = [];
	const seen = new Set<string>();
	const notes = asRecord(hit.source_notes) ?? {};
	for (const [noteKey, rawNote] of Object.entries(notes)) {
		const note = asRecord(rawNote) ?? {};
		const name = asNonEmptyString(note.name) ?? formatHumanLabel(noteKey);
		const detail = detailByName.get(name.toLowerCase());
		seen.add(name.toLowerCase());
		sources.push({
			key: noteKey,
			name,
			url: httpUrl(note.url) ?? httpUrl(detail?.url),
			description: asNonEmptyString(note.description),
			types: asStringArray(note.aml_types),
			countries: uniqueStrings([
				...asStringArray(note.country_codes).map(
					(code) => formatCountry(code) ?? code,
				),
				...asStringArray(detail?.countries),
			]),
			listedAt: asNonEmptyString(detail?.created_at),
			updatedAt: asNonEmptyString(detail?.updated_at),
		});
	}

	for (const name of asStringArray(hit.sources)) {
		if (seen.has(name.toLowerCase())) continue;
		seen.add(name.toLowerCase());
		const detail = detailByName.get(name.toLowerCase());
		sources.push({
			key: `source-${name}`,
			name,
			url: httpUrl(detail?.url),
			types: [],
			countries: asStringArray(detail?.countries),
			listedAt: asNonEmptyString(detail?.created_at),
			updatedAt: asNonEmptyString(detail?.updated_at),
		});
	}

	return sources;
}

function rolesFor(hit: UnknownRecord): AmlRole[] {
	const roles: AmlRole[] = [];
	const seen = new Set<string>();
	for (const detail of records(hit.source_details)) {
		for (const role of records(asRecord(detail.data)?.role)) {
			const designation = asStringArray(role.designation)[0];
			if (!designation) continue;
			const institution = asStringArray(role.institution_name)[0];
			const tenure = asStringArray(role.tenure)[0];
			const key =
				`${designation}|${institution ?? ""}|${tenure ?? ""}`.toLowerCase();
			if (seen.has(key)) continue;
			seen.add(key);
			roles.push({ key, designation, institution, tenure });
		}
	}
	return roles;
}

function flagSummariesFor(hit: UnknownRecord) {
	return uniqueStrings(
		records(hit.source_details).flatMap((detail) =>
			asStringArray(
				asRecord(asRecord(detail.data)?.additional_information)?.flag_summary,
			),
		),
	);
}

function countriesFor(hit: UnknownRecord, fields: UnknownRecord) {
	const fromFields = ["Country", "Countries"].flatMap((label) =>
		fieldValues(label, records(fields[label])),
	);
	const fromSources = records(hit.source_details).flatMap((detail) =>
		asStringArray(detail.countries),
	);
	return uniqueStrings([...fromSources, ...fromFields]).slice(0, 6);
}

function mediaFor(hit: UnknownRecord): AmlMediaArticle[] {
	return records(hit.media).flatMap((item, index) => {
		const title =
			asNonEmptyString(item.title) ?? asNonEmptyString(item.url) ?? undefined;
		if (!title) return [];
		return [
			{
				key: `media-${index}`,
				title,
				url: httpUrl(item.url),
				snippet: asNonEmptyString(item.snippet),
				keywords: uniqueStrings(
					(asNonEmptyString(item.adverse_keywords) ?? "").split(","),
				),
				date: asNonEmptyString(item.date) ?? asNonEmptyString(item.pdf_date),
			},
		];
	});
}

function parseHit(hit: UnknownRecord, index: number): AmlHit {
	const key = `aml-hit-${index}`;
	const rawName = asNonEmptyString(hit.name) ?? `Match ${index + 1}`;
	const alternativeNames = uniqueStrings(
		asStringArray(hit.alternative_names),
	).filter((name) => name.toLowerCase() !== rawName.toLowerCase());
	const latinName = NON_LATIN_PATTERN.test(rawName)
		? alternativeNames.find((name) => !NON_LATIN_PATTERN.test(name))
		: undefined;
	const fields = asRecord(hit.fields) ?? {};
	const { profile, notes, links } = profileFields(key, fields);
	const types = asStringArray(hit.types);
	const score = Number(hit.score);
	const imageUrl = httpUrl(
		asNonEmptyString(records(fields["Image Url"])[0]?.value),
	);

	return {
		key,
		name: latinName ?? rawName,
		originalName: latinName ? rawName : undefined,
		entityType: asNonEmptyString(hit.entity_type),
		score: Number.isFinite(score) ? score : undefined,
		types,
		categories: CATEGORY_ORDER.filter((category) =>
			types.some((type) => categoryOf(type) === category),
		),
		matchTypes: asStringArray(hit.match_types),
		countries: countriesFor(hit, fields),
		alternativeNames: alternativeNames.filter((name) => name !== latinName),
		associates: records(hit.associates).flatMap((associate, associateIndex) => {
			const name = asNonEmptyString(associate.name);
			return name
				? [
						{
							key: `${associateIndex}-${name}`,
							name,
							association: asNonEmptyString(associate.association),
						},
					]
				: [];
		}),
		profile,
		roles: rolesFor(hit),
		notes,
		flagSummaries: flagSummariesFor(hit),
		sources: sourcesFor(hit),
		media: mediaFor(hit),
		links,
		imageUrl,
	};
}

export function formatScore(score: number | undefined) {
	if (score === undefined) return undefined;
	const percent = score <= 1 ? score * 100 : score;
	return `${Math.round(percent)}%`;
}

function formatMatchScoreSetting(value: unknown) {
	const score = Number(value);
	return Number.isFinite(score) && score > 0 ? `${score}%` : undefined;
}

const KNOWN_INPUT_KEYS = new Set([
	"email",
	"country",
	"language",
	"mode",
	"ttl",
	"send_email",
	"allow_file_upload",
	"method_type",
	"collect",
	"filters",
	"dob",
	"background_checks",
	"aml_for_businesses",
	"reference",
	"callback_url",
	"redirect_url",
]);

const KNOWN_SECTION_KEYS = new Set([
	"name",
	"dob",
	"business_name",
	"business_incorporation_date",
	"countries",
	"filters",
	"match_score",
	"rca_search",
	"alias_search",
	"biometric_search_image",
	"individual_face",
	"context",
]);

const KNOWN_CHECKED_KEYS = new Set([
	"name",
	"dob",
	"business_name",
	"business_incorporation_date",
	"aml_data",
	"filters",
	"countries",
	"match_score",
]);

function formatPersonName(value: unknown) {
	const name = asRecord(value);
	if (!name) return asNonEmptyString(value);
	return (
		asNonEmptyString(name.full_name) ??
		([name.first_name, name.middle_name, name.last_name]
			.map((part) => asNonEmptyString(part))
			.filter(Boolean)
			.join(" ") ||
			undefined)
	);
}

export function buildAmlScreeningSections({
	inputData,
	responseData,
	subject,
}: {
	inputData: unknown;
	responseData: unknown;
	subject: AmlSubject;
}): AmlScreeningSections {
	const sectionKey =
		subject === "business" ? "aml_for_businesses" : "background_checks";
	const input = asRecord(inputData) ?? {};
	const inputSection = asRecord(input[sectionKey]) ?? {};
	const inputFilters = asRecord(input.filters) ?? {};
	const collect = asRecord(input.collect) ?? {};
	const response = getResponsePayload(responseData);
	const checked =
		asRecord(asRecord(response.verification_data)?.[sectionKey]) ??
		asRecord(response[sectionKey]) ??
		{};
	const amlData = asRecord(checked.aml_data) ?? {};
	const results = asRecord(response.verification_result) ?? {};

	const hits = records(amlData.hits)
		.map(parseHit)
		.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

	const filters = uniqueStrings(
		asStringArray(
			inputSection.filters ?? inputFilters.filters ?? amlData.filters,
		),
	);
	const screenedName =
		subject === "business"
			? (asNonEmptyString(inputSection.business_name) ??
				asNonEmptyString(checked.business_name))
			: (formatPersonName(inputSection.name) ?? formatPersonName(checked.name));
	const dob =
		subject === "business"
			? (inputSection.business_incorporation_date ??
				checked.business_incorporation_date)
			: (inputSection.dob ?? input.dob ?? checked.dob);

	const submitted = [
		computed(
			"name",
			subject === "business" ? "Business Name" : "Full Name",
			screenedName,
			{ wide: true },
		),
		computed(
			"dob",
			subject === "business" ? "Incorporation Date" : "Date of Birth",
			dob,
			{ format: "date" },
		),
		computed(
			"countries",
			"Countries Screened",
			asStringArray(inputSection.countries).map(
				(code) => formatCountry(code) ?? code,
			),
		),
		...sharedRequestFields(input),
		computed(
			"match_score",
			"Minimum Match Score",
			formatMatchScoreSetting(
				inputSection.match_score ?? inputFilters.match_score,
			),
		),
		computed(
			"rca_search",
			"Relatives & Close Associates Search",
			inputSection.rca_search ?? inputFilters.rca_search,
			{ format: "yesNo" },
		),
		computed(
			"alias_search",
			"Alias Search",
			inputSection.alias_search ?? inputFilters.alias_search,
			{ format: "yesNo" },
		),
		computed("filters", "Lists Screened", filters.map(formatAmlType), {
			wide: true,
		}),
		computed("context", "Context", inputSection.context, { wide: true }),
	];

	const categoryCounts = CATEGORY_ORDER.flatMap((category) => {
		const count = hits.filter((hit) =>
			hit.categories.includes(category),
		).length;
		return count > 0
			? [{ category, label: AML_CATEGORY_LABELS[category], count }]
			: [];
	});

	const topScore = hits[0]?.score;
	const summary = [
		computed("hits", "Potential Matches", hits.length),
		computed("top_score", "Highest Match Score", formatScore(topScore)),
		computed(
			"sources",
			"Distinct Sources",
			new Set(hits.flatMap((hit) => hit.sources.map((source) => source.name)))
				.size || undefined,
		),
		computed(
			"media",
			"Adverse Media Articles",
			hits.reduce((total, hit) => total + hit.media.length, 0) || undefined,
		),
	];

	const outcome = buildProviderOutcome(response);
	const additional = [
		...linkSettingsFields(input),
		computed(
			"dob_locked",
			"Date of Birth Locked for Customer",
			collect.dob_locked,
			{ format: "yesNo" },
		),
		computed(
			"incorporation_date_locked",
			"Incorporation Date Locked for Customer",
			collect.incorporation_date_locked,
			{ format: "yesNo" },
		),
		computed(
			"country_locked",
			"Country Locked for Customer",
			collect.country_locked,
			{ format: "yesNo" },
		),
		computed(
			"provider_customer_id",
			"Provider Customer ID",
			outcome.providerCustomerId,
			{ mono: true },
		),
		...leftoverFields(input, KNOWN_INPUT_KEYS, "input"),
		...leftoverFields(inputSection, KNOWN_SECTION_KEYS, `input.${sectionKey}`),
		...leftoverFields(checked, KNOWN_CHECKED_KEYS, "verification_data"),
		...leftoverFields(response, new Set(SHARED_RESPONSE_KEYS), "response"),
	];

	return {
		subject,
		submitted: withoutEmpty(submitted),
		outcome,
		checks: [
			{
				key: sectionKey,
				label:
					subject === "business" ? "Business Screening" : "Background Check",
				value: results[sectionKey],
			},
		],
		summary: withoutEmpty(summary),
		categoryCounts,
		hits,
		proofs: [
			...submittedProof(
				"biometric_search_image",
				"Biometric Search Image",
				inputSection.biometric_search_image,
			),
			...submittedProof(
				"individual_face",
				"Individual Face",
				inputSection.individual_face,
			),
		],
		additional: withoutEmpty(additional),
	};
}
