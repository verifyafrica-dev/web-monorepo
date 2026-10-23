import { z } from "zod";
import type {
	MixedVerification,
	MixedVerificationSteps,
	MixedVerificationUpsertPayload,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import {
	SHUFTI_ADDRESS_SUPPORTED_TYPES,
	SHUFTI_CHOICES,
	SHUFTI_DOCUMENT_SUPPORTED_TYPES,
	VERIFICATION_TYPES,
	type ShuftiAddressSupportedType,
	type ShuftiDocumentSupportedType,
} from "@verifyafrica/ui/lib/constants";

export const AML_SCREENING_FILTERS = [
	{ key: "sanction", label: "SANCTION" },
	{ key: "warning", label: "WARNING" },
	{ key: "fitness_probity", label: "FITNESS PROBITY" },
	{ key: "pep", label: "PEP" },
	{ key: "pep_class_1", label: "PEP CLASS 1" },
	{ key: "pep_class_2", label: "PEP CLASS 2" },
	{ key: "pep_class_3", label: "PEP CLASS 3" },
	{ key: "pep_class_4", label: "PEP CLASS 4" },
	{ key: "adverse_media", label: "ADVERSE MEDIA" },
] as const;

export type AmlScreeningFilterKey =
	(typeof AML_SCREENING_FILTERS)[number]["key"];

export const DEFAULT_AML_SCREENING_FILTERS = Object.fromEntries(
	AML_SCREENING_FILTERS.map((filter) => [filter.key, true]),
) as Record<AmlScreeningFilterKey, boolean>;

export const DEFAULT_MATCH_SCORE = 70;

export function getSelectedAmlFilters(
	filters: Record<AmlScreeningFilterKey, boolean>,
) {
	return AML_SCREENING_FILTERS.filter((filter) => filters[filter.key]).map(
		(filter) => filter.key.replace(/_/g, "-"),
	);
}

export type FaceVerificationMode = "image" | "video";

export const FACE_VERIFICATION_MODES = [
	{ value: "image" as const, label: "Image Only" },
	{ value: "video" as const, label: "Video Only" },
];

export const MIXED_VERIFICATION_BASE_TYPE_OPTIONS = [
	"id_document",
	"face_match",
	"address_verification",
	"aml_screening",
	"business_aml_screening",
	"crypto_wallet_screening",
	"kyb_screening",
] as const;

export type MixedVerificationBaseType =
	(typeof MIXED_VERIFICATION_BASE_TYPE_OPTIONS)[number];

export const MIXED_GRC_TYPE_OPTIONS = [
	VERIFICATION_TYPES.ZA_SAID_VERIFICATION.value,
	VERIFICATION_TYPES.NG_BVN_VERIFICATION.value,
	VERIFICATION_TYPES.NG_NIN_VERIFICATION.value,
	VERIFICATION_TYPES.NG_VIRTUAL_NIN_VERIFICATION.value,
	VERIFICATION_TYPES.NG_ADVANCED_PHONE_NUMBER_VERIFICATION.value,
	VERIFICATION_TYPES.NG_PHONE_NUMBER_LOOKUP.value,
	VERIFICATION_TYPES.NG_CAC_LOOKUP.value,
	VERIFICATION_TYPES.NG_PASSPORT_VERIFICATION.value,
	VERIFICATION_TYPES.GH_PASSPORT_LOOKUP.value,
	VERIFICATION_TYPES.GH_VOTER_CARD_LOOKUP.value,
	VERIFICATION_TYPES.GH_SSNIT_LOOKUP.value,
	VERIFICATION_TYPES.GH_DRIVERS_LICENSE_LOOKUP.value,
	VERIFICATION_TYPES.KE_PASSPORT_LOOKUP.value,
	VERIFICATION_TYPES.KE_NATIONAL_ID_LOOKUP.value,
	VERIFICATION_TYPES.KE_PHONE_NUMBER_LOOKUP.value,
	VERIFICATION_TYPES.KE_TAX_PIN_VERIFICATION.value,
	VERIFICATION_TYPES.CI_NATIONAL_ID_LOOKUP.value,
	VERIFICATION_TYPES.CI_RESIDENCE_CARD_LOOKUP.value,
	VERIFICATION_TYPES.US_SSN_VERIFICATION.value,
] as const;

export type MixedGrcType = (typeof MIXED_GRC_TYPE_OPTIONS)[number];

export const MIXED_VERIFICATION_TYPE_OPTIONS = [
	...MIXED_VERIFICATION_BASE_TYPE_OPTIONS,
	...MIXED_GRC_TYPE_OPTIONS,
] as const;

export type MixedVerificationTypeOption =
	| MixedVerificationBaseType
	| MixedGrcType;

const GRC_SELFIE_TYPES = new Set<string>([
	VERIFICATION_TYPES.NG_BVN_VERIFICATION.value,
	VERIFICATION_TYPES.NG_NIN_VERIFICATION.value,
	VERIFICATION_TYPES.NG_VIRTUAL_NIN_VERIFICATION.value,
	VERIFICATION_TYPES.NG_ADVANCED_PHONE_NUMBER_VERIFICATION.value,
	VERIFICATION_TYPES.GH_PASSPORT_LOOKUP.value,
	VERIFICATION_TYPES.GH_VOTER_CARD_LOOKUP.value,
	VERIFICATION_TYPES.GH_SSNIT_LOOKUP.value,
	VERIFICATION_TYPES.GH_DRIVERS_LICENSE_LOOKUP.value,
	VERIFICATION_TYPES.KE_PASSPORT_LOOKUP.value,
	VERIFICATION_TYPES.KE_NATIONAL_ID_LOOKUP.value,
	VERIFICATION_TYPES.CI_NATIONAL_ID_LOOKUP.value,
	VERIFICATION_TYPES.CI_RESIDENCE_CARD_LOOKUP.value,
]);

export const MIXED_GRC_MENU_GROUPS = [
	{
		countryCode: "za",
		countryLabel: "South Africa",
		types: [{ value: VERIFICATION_TYPES.ZA_SAID_VERIFICATION.value, label: VERIFICATION_TYPES.ZA_SAID_VERIFICATION.label }],
	},
	{
		countryCode: "ng",
		countryLabel: "Nigeria",
		types: [
			{ value: VERIFICATION_TYPES.NG_BVN_VERIFICATION.value, label: VERIFICATION_TYPES.NG_BVN_VERIFICATION.label },
			{ value: VERIFICATION_TYPES.NG_NIN_VERIFICATION.value, label: VERIFICATION_TYPES.NG_NIN_VERIFICATION.label },
			{ value: VERIFICATION_TYPES.NG_VIRTUAL_NIN_VERIFICATION.value, label: VERIFICATION_TYPES.NG_VIRTUAL_NIN_VERIFICATION.label },
			{ value: VERIFICATION_TYPES.NG_ADVANCED_PHONE_NUMBER_VERIFICATION.value, label: VERIFICATION_TYPES.NG_ADVANCED_PHONE_NUMBER_VERIFICATION.label },
			{ value: VERIFICATION_TYPES.NG_PHONE_NUMBER_LOOKUP.value, label: VERIFICATION_TYPES.NG_PHONE_NUMBER_LOOKUP.label },
			{ value: VERIFICATION_TYPES.NG_CAC_LOOKUP.value, label: VERIFICATION_TYPES.NG_CAC_LOOKUP.label },
			{ value: VERIFICATION_TYPES.NG_PASSPORT_VERIFICATION.value, label: VERIFICATION_TYPES.NG_PASSPORT_VERIFICATION.label },
		],
	},
	{
		countryCode: "gh",
		countryLabel: "Ghana",
		types: [
			{ value: VERIFICATION_TYPES.GH_PASSPORT_LOOKUP.value, label: VERIFICATION_TYPES.GH_PASSPORT_LOOKUP.label },
			{ value: VERIFICATION_TYPES.GH_VOTER_CARD_LOOKUP.value, label: VERIFICATION_TYPES.GH_VOTER_CARD_LOOKUP.label },
			{ value: VERIFICATION_TYPES.GH_SSNIT_LOOKUP.value, label: VERIFICATION_TYPES.GH_SSNIT_LOOKUP.label },
			{ value: VERIFICATION_TYPES.GH_DRIVERS_LICENSE_LOOKUP.value, label: VERIFICATION_TYPES.GH_DRIVERS_LICENSE_LOOKUP.label },
		],
	},
	{
		countryCode: "ke",
		countryLabel: "Kenya",
		types: [
			{ value: VERIFICATION_TYPES.KE_PASSPORT_LOOKUP.value, label: VERIFICATION_TYPES.KE_PASSPORT_LOOKUP.label },
			{ value: VERIFICATION_TYPES.KE_NATIONAL_ID_LOOKUP.value, label: VERIFICATION_TYPES.KE_NATIONAL_ID_LOOKUP.label },
			{ value: VERIFICATION_TYPES.KE_PHONE_NUMBER_LOOKUP.value, label: VERIFICATION_TYPES.KE_PHONE_NUMBER_LOOKUP.label },
			{ value: VERIFICATION_TYPES.KE_TAX_PIN_VERIFICATION.value, label: VERIFICATION_TYPES.KE_TAX_PIN_VERIFICATION.label },
		],
	},
	{
		countryCode: "ci",
		countryLabel: "Côte d'Ivoire",
		types: [
			{ value: VERIFICATION_TYPES.CI_NATIONAL_ID_LOOKUP.value, label: VERIFICATION_TYPES.CI_NATIONAL_ID_LOOKUP.label },
			{ value: VERIFICATION_TYPES.CI_RESIDENCE_CARD_LOOKUP.value, label: VERIFICATION_TYPES.CI_RESIDENCE_CARD_LOOKUP.label },
		],
	},
	{
		countryCode: "us",
		countryLabel: "United States",
		types: [
			{ value: VERIFICATION_TYPES.US_SSN_VERIFICATION.value, label: VERIFICATION_TYPES.US_SSN_VERIFICATION.label },
		],
	},
] as const;

const AML_FILTER_KEYS = AML_SCREENING_FILTERS.map(
	(filter) => filter.key,
) as unknown as [AmlScreeningFilterKey, ...AmlScreeningFilterKey[]];

const AmlFiltersSchema = z.record(z.enum(AML_FILTER_KEYS), z.boolean());

export const MixedStepConfigSchema = z.object({
	country: z.string(),
	documentTypes: z.array(z.enum(SHUFTI_DOCUMENT_SUPPORTED_TYPES)),
	addressDocumentTypes: z.array(z.enum(SHUFTI_ADDRESS_SUPPORTED_TYPES)),
	dob: z.boolean(),
	age: z.boolean(),
	gender: z.boolean(),
	backsideProofRequired: z.boolean(),
	verificationInstructions: z.string(),
	amlFilters: AmlFiltersSchema,
	matchScore: z.number().min(0).max(100),
	rcaSearch: z.boolean(),
	aliasSearch: z.boolean(),
	amlContext: z.string(),
	faceVerificationMode: z.enum(["image", "video"]),
	checkForDuplicates: z.boolean(),
	faceAgeMin: z.string(),
	faceAgeMax: z.string(),
	requireSelfie: z.boolean(),
});

export type MixedStepConfig = z.infer<typeof MixedStepConfigSchema>;

export const MixedStepSchema = z.object({
	id: z.string().uuid(),
	type: z
		.string()
		.refine(
			(value): value is MixedVerificationTypeOption =>
				(MIXED_VERIFICATION_TYPE_OPTIONS as readonly string[]).includes(value),
			"Unsupported verification type",
		),
	config: MixedStepConfigSchema,
});

export type MixedStepFormValue = z.infer<typeof MixedStepSchema>;

export const MixedVerificationFormSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	description: z.string(),
	steps: z.array(MixedStepSchema).min(1, "Add at least one verification step"),
	journey_id: z.string().trim().min(1, "Journey ID is required"),
	price: z
		.string()
		.trim()
		.min(1, "Price is required")
		.refine(
			(value) => /^\d*\.?\d+$/.test(value) && Number.parseFloat(value) > 0,
			"Enter a valid price",
		),
	is_active: z.boolean(),
	is_custom: z.boolean(),
});

export type MixedVerificationFormValues = z.infer<
	typeof MixedVerificationFormSchema
>;

export const emptyMixedStepConfig = (): MixedStepConfig => ({
	country: "",
	documentTypes: [],
	addressDocumentTypes: [],
	dob: false,
	age: false,
	gender: false,
	backsideProofRequired: false,
	verificationInstructions: "",
	amlFilters: { ...DEFAULT_AML_SCREENING_FILTERS },
	matchScore: DEFAULT_MATCH_SCORE,
	rcaSearch: true,
	aliasSearch: true,
	amlContext: "",
	faceVerificationMode: "image",
	checkForDuplicates: false,
	faceAgeMin: "16",
	faceAgeMax: "",
	requireSelfie: false,
});

export function createMixedStep(
	type: MixedVerificationTypeOption,
): MixedStepFormValue {
	return {
		id: crypto.randomUUID(),
		type,
		config: emptyMixedStepConfig(),
	};
}

export const EMPTY_MIXED_VERIFICATION_FORM: MixedVerificationFormValues = {
	name: "",
	description: "",
	steps: [],
	journey_id: "",
	price: "",
	is_active: true,
	is_custom: false,
};

export function isMixedVerificationTypeOption(
	value: string,
): value is MixedVerificationTypeOption {
	return (MIXED_VERIFICATION_TYPE_OPTIONS as readonly string[]).includes(value);
}

export function isAmlMixedStepType(type: string) {
	return type === "aml_screening" || type === "business_aml_screening";
}

export function isGrcMixedStepType(type: string): type is MixedGrcType {
	return (MIXED_GRC_TYPE_OPTIONS as readonly string[]).includes(type);
}

export function grcStepSupportsSelfie(type: string) {
	return GRC_SELFIE_TYPES.has(type);
}

function parseAmlFilters(
	raw: unknown,
): Record<AmlScreeningFilterKey, boolean> {
	const filters = { ...DEFAULT_AML_SCREENING_FILTERS };
	if (!raw || typeof raw !== "object") {
		return filters;
	}

	const record = raw as Record<string, unknown>;
	const selected = Array.isArray(record.filters)
		? record.filters
				.filter((item): item is string => typeof item === "string")
				.map((item) => item.replace(/-/g, "_"))
		: null;

	if (selected) {
		for (const key of Object.keys(filters) as AmlScreeningFilterKey[]) {
			filters[key] = selected.includes(key);
		}
		return filters;
	}

	for (const key of Object.keys(filters) as AmlScreeningFilterKey[]) {
		if (typeof record[key] === "boolean") {
			filters[key] = record[key];
		}
	}
	return filters;
}

function configFromStepRecord(
	config: Record<string, unknown> | undefined,
): MixedStepConfig {
	const base = emptyMixedStepConfig();
	if (!config) {
		return base;
	}

	if (typeof config.country === "string") {
		base.country = config.country.trim().toUpperCase();
	}

	const document =
		config.document && typeof config.document === "object"
			? (config.document as Record<string, unknown>)
			: null;
	if (document && Array.isArray(document.supported_types)) {
		base.documentTypes = document.supported_types.filter(
			(item): item is ShuftiDocumentSupportedType =>
				typeof item === "string" &&
				(SHUFTI_DOCUMENT_SUPPORTED_TYPES as readonly string[]).includes(item),
		);
	}

	const address =
		config.address && typeof config.address === "object"
			? (config.address as Record<string, unknown>)
			: null;
	if (address && Array.isArray(address.supported_types)) {
		base.addressDocumentTypes = address.supported_types.filter(
			(item): item is ShuftiAddressSupportedType =>
				typeof item === "string" &&
				(SHUFTI_ADDRESS_SUPPORTED_TYPES as readonly string[]).includes(item),
		);
	}

	const collect =
		config.collect && typeof config.collect === "object"
			? (config.collect as Record<string, unknown>)
			: null;
	if (collect) {
		base.dob = collect.dob === true;
		base.age = collect.age === true;
		base.gender = collect.gender === true;
		base.backsideProofRequired = collect.backside_proof_required === true;
		if (typeof collect.verification_instructions === "string") {
			base.verificationInstructions = collect.verification_instructions;
		}
	}

	const filtersBlock =
		config.filters && typeof config.filters === "object"
			? (config.filters as Record<string, unknown>)
			: null;
	if (filtersBlock) {
		base.amlFilters = parseAmlFilters(filtersBlock);
		if (typeof filtersBlock.match_score === "number") {
			base.matchScore = Math.min(100, Math.max(0, filtersBlock.match_score));
		} else if (typeof filtersBlock.match_score === "string") {
			const parsed = Number(filtersBlock.match_score);
			if (!Number.isNaN(parsed)) {
				base.matchScore = Math.min(100, Math.max(0, parsed));
			}
		}
		if (typeof filtersBlock.rca_search === "boolean") {
			base.rcaSearch = filtersBlock.rca_search;
		}
		if (typeof filtersBlock.alias_search === "boolean") {
			base.aliasSearch = filtersBlock.alias_search;
		}
	}

	const backgroundChecks =
		config.background_checks && typeof config.background_checks === "object"
			? (config.background_checks as Record<string, unknown>)
			: null;
	const businessAml =
		config.aml_for_businesses && typeof config.aml_for_businesses === "object"
			? (config.aml_for_businesses as Record<string, unknown>)
			: null;
	const contextSource = backgroundChecks ?? businessAml;
	if (contextSource && typeof contextSource.context === "string") {
		base.amlContext = contextSource.context;
	}

	const face =
		config.face && typeof config.face === "object"
			? (config.face as Record<string, unknown>)
			: null;
	if (face) {
		if (face.verification_mode === "video_only") {
			base.faceVerificationMode = "video";
		} else if (
			face.verification_mode === "image_only" ||
			face.verification_mode === "image"
		) {
			base.faceVerificationMode = "image";
		}
		base.checkForDuplicates =
			face.check_duplicate_request === true ||
			face.check_duplicate_request === SHUFTI_CHOICES.YES ||
			face.check_duplicate_request === "1";
		const age =
			face.age && typeof face.age === "object"
				? (face.age as Record<string, unknown>)
				: null;
		if (age) {
			if (age.min !== undefined && age.min !== null) {
				base.faceAgeMin = String(age.min);
			}
			if (age.max !== undefined && age.max !== null) {
				base.faceAgeMax = String(age.max);
			}
		}
	}

	if (typeof config.require_selfie === "boolean") {
		base.requireSelfie = config.require_selfie;
	}

	return base;
}

export function formatMixedVerificationType(value: string) {
	for (const group of MIXED_GRC_MENU_GROUPS) {
		const match = group.types.find((item) => item.value === value);
		if (match) {
			return match.label;
		}
	}
	return value
		.replace(/_/g, " ")
		.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatMixedVerificationPrice(price: string | null | undefined) {
	if (!price) {
		return "—";
	}

	return `USD ${price}`;
}

export function getMixedVerificationStatusBadgeClass(isActive: boolean) {
	return isActive
		? "border-emerald-200 bg-emerald-50 text-emerald-700"
		: "border-border bg-muted text-muted-foreground";
}

export function toMixedVerificationFormValues(
	template: MixedVerification,
): MixedVerificationFormValues {
	const stepsPayload = template.steps as MixedVerificationSteps | undefined;
	const stepsMap = stepsPayload?.steps;
	let steps: MixedStepFormValue[] = [];

	if (stepsMap && typeof stepsMap === "object") {
		steps = Object.entries(stepsMap)
			.map(([id, step]) => {
				const type = step.type;
				if (!isMixedVerificationTypeOption(type)) {
					return null;
				}
				return {
					id,
					type,
					config: configFromStepRecord(
						step.config as Record<string, unknown> | undefined,
					),
				} satisfies MixedStepFormValue;
			})
			.filter((step): step is MixedStepFormValue => step !== null)
			.sort((a, b) => {
				const orderA = stepsMap[a.id]?.order ?? 0;
				const orderB = stepsMap[b.id]?.order ?? 0;
				return orderA - orderB;
			});
	}

	if (steps.length === 0 && Array.isArray(template.verifications)) {
		steps = template.verifications
			.filter(isMixedVerificationTypeOption)
			.map((type) => createMixedStep(type));
	}

	return {
		name: template.name,
		description: template.description,
		steps,
		journey_id: template.journey_id ?? "",
		price: template.price ?? "",
		is_active: template.is_active,
		is_custom: template.is_custom,
	};
}

function buildStepConfigPayload(
	type: MixedVerificationTypeOption,
	config: MixedStepConfig,
): Record<string, unknown> | undefined {
	const payload: Record<string, unknown> = {};

	if (config.country.trim()) {
		payload.country = config.country.trim().toUpperCase();
	}

	if (type === "id_document") {
		const document: Record<string, unknown> = {};
		if (config.documentTypes.length > 0) {
			document.supported_types = config.documentTypes;
		}
		if (Object.keys(document).length > 0) {
			payload.document = document;
		}
		payload.collect = {
			dob: config.dob,
			age: config.age,
			gender: config.gender,
			backside_proof_required: config.backsideProofRequired,
			verification_instructions: config.verificationInstructions.trim(),
		};
	}

	if (type === "address_verification") {
		const address: Record<string, unknown> = {};
		if (config.addressDocumentTypes.length > 0) {
			address.supported_types = config.addressDocumentTypes;
		}
		if (Object.keys(address).length > 0) {
			payload.address = address;
		}
		if (config.verificationInstructions.trim()) {
			payload.collect = {
				verification_instructions: config.verificationInstructions.trim(),
			};
		}
	}

	if (type === "face_match") {
		const face: Record<string, unknown> = {
			verification_mode:
				config.faceVerificationMode === "video" ? "video_only" : "image_only",
			allow_offline: SHUFTI_CHOICES.NO,
			allow_online: SHUFTI_CHOICES.YES,
			check_duplicate_request: config.checkForDuplicates
				? SHUFTI_CHOICES.YES
				: SHUFTI_CHOICES.NO,
		};
		const ageMin = config.faceAgeMin.trim();
		const ageMax = config.faceAgeMax.trim();
		if (ageMin || ageMax) {
			face.age = {
				...(ageMin ? { min: ageMin } : {}),
				...(ageMax ? { max: ageMax } : {}),
			};
		}
		payload.face = face;
		if (config.verificationInstructions.trim()) {
			payload.collect = {
				verification_instructions: config.verificationInstructions.trim(),
			};
		}
	}

	if (isAmlMixedStepType(type)) {
		payload.filters = {
			filters: getSelectedAmlFilters(
				config.amlFilters as Record<AmlScreeningFilterKey, boolean>,
			),
			match_score: config.matchScore,
			rca_search: config.rcaSearch,
			alias_search: config.aliasSearch,
		};
		if (config.amlContext.trim()) {
			if (type === "business_aml_screening") {
				payload.aml_for_businesses = {
					context: config.amlContext.trim(),
				};
			} else {
				payload.background_checks = {
					context: config.amlContext.trim(),
				};
			}
		}
	}

	if (isGrcMixedStepType(type) && grcStepSupportsSelfie(type)) {
		payload.require_selfie = config.requireSelfie;
	}

	return Object.keys(payload).length > 0 ? payload : undefined;
}

export function buildMixedVerificationPayload(
	values: MixedVerificationFormValues,
): MixedVerificationUpsertPayload {
	const steps: MixedVerificationSteps["steps"] = {};
	values.steps.forEach((step, index) => {
		const config = buildStepConfigPayload(step.type, step.config);
		steps[step.id] = {
			type: step.type,
			order: index + 1,
			...(config ? { config } : {}),
		};
	});

	return {
		name: values.name.trim(),
		description: values.description.trim(),
		verifications: values.steps.map((step) => step.type),
		steps: { steps },
		journey_id: values.journey_id.trim(),
		price: values.price.trim(),
		is_active: values.is_active,
		is_custom: false,
	};
}
