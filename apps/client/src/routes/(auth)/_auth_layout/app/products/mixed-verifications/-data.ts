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
import {
	AML_SCREENING_FILTERS,
	DEFAULT_AML_SCREENING_FILTERS,
	DEFAULT_MATCH_SCORE,
	getSelectedAmlFilters,
	type AmlScreeningFilterKey,
} from "../aml-screening/-data";
import {
	DEFAULT_FACE_VERIFICATION_MODE,
	FACE_AGE_MIN_YEARS,
	type FaceVerificationMode,
} from "../facial-screening/-data";
import {
	getRegistryVerificationType,
	REGISTRY_COUNTRY_CODES,
	type RegistryCountryCode,
} from "../government-registry-checks/-data";

export const MIXED_VERIFICATIONS_LIST_PARAMS = {
	per_page: 100,
} as const;

/** Top-level (non-GRC) types shown in the Add menu. */
export const CUSTOM_MIXED_BASE_TYPE_OPTIONS = [
	"id_document",
	"face_match",
	"address_verification",
	"aml_screening",
	"business_aml_screening",
	"crypto_wallet_screening",
	"kyb_screening",
] as const;

export type CustomMixedBaseType =
	(typeof CUSTOM_MIXED_BASE_TYPE_OPTIONS)[number];

const GRC_TYPE_DEFS = [
	VERIFICATION_TYPES.ZA_SAID_VERIFICATION,
	VERIFICATION_TYPES.NG_BVN_VERIFICATION,
	VERIFICATION_TYPES.NG_NIN_VERIFICATION,
	VERIFICATION_TYPES.NG_VIRTUAL_NIN_VERIFICATION,
	VERIFICATION_TYPES.NG_ADVANCED_PHONE_NUMBER_VERIFICATION,
	VERIFICATION_TYPES.NG_PHONE_NUMBER_LOOKUP,
	VERIFICATION_TYPES.NG_CAC_LOOKUP,
	VERIFICATION_TYPES.NG_PASSPORT_VERIFICATION,
	VERIFICATION_TYPES.GH_PASSPORT_LOOKUP,
	VERIFICATION_TYPES.GH_VOTER_CARD_LOOKUP,
	VERIFICATION_TYPES.GH_SSNIT_LOOKUP,
	VERIFICATION_TYPES.GH_DRIVERS_LICENSE_LOOKUP,
	VERIFICATION_TYPES.KE_PASSPORT_LOOKUP,
	VERIFICATION_TYPES.KE_NATIONAL_ID_LOOKUP,
	VERIFICATION_TYPES.KE_PHONE_NUMBER_LOOKUP,
	VERIFICATION_TYPES.KE_TAX_PIN_VERIFICATION,
	VERIFICATION_TYPES.CI_NATIONAL_ID_LOOKUP,
	VERIFICATION_TYPES.CI_RESIDENCE_CARD_LOOKUP,
	VERIFICATION_TYPES.US_SSN_VERIFICATION,
] as const;

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

export const CUSTOM_MIXED_VERIFICATION_TYPE_OPTIONS = [
	...CUSTOM_MIXED_BASE_TYPE_OPTIONS,
	...MIXED_GRC_TYPE_OPTIONS,
] as const;

export type CustomMixedVerificationType =
	| CustomMixedBaseType
	| MixedGrcType;

const REGISTRY_COUNTRY_LABELS: Record<RegistryCountryCode, string> = {
	ci: "Côte d'Ivoire",
	gh: "Ghana",
	ke: "Kenya",
	ng: "Nigeria",
	za: "South Africa",
	us: "United States",
};

/** GRC menu: country → leaf types (for DropdownMenu submenus). */
export const MIXED_GRC_MENU_GROUPS = REGISTRY_COUNTRY_CODES.map(
	(countryCode) => ({
		countryCode,
		countryLabel: REGISTRY_COUNTRY_LABELS[countryCode],
		types: GRC_TYPE_DEFS.filter((item) => {
			const meta = getRegistryVerificationType(item.value);
			return meta?.countryCode === countryCode;
		}).map((item) => ({
			value: item.value as MixedGrcType,
			label: item.label,
		})),
	}),
).filter((group) => group.types.length > 0);

const AML_FILTER_KEYS = AML_SCREENING_FILTERS.map(
	(filter) => filter.key,
) as unknown as [
	AmlScreeningFilterKey,
	...AmlScreeningFilterKey[],
];

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
	/** ID document: overrides tenant product setting when starting a session. */
	allowFileUpload: z.boolean(),
});

export type MixedStepConfig = z.infer<typeof MixedStepConfigSchema>;

export const MixedStepSchema = z.object({
	id: z.string().uuid(),
	type: z
		.string()
		.refine(
			(value): value is CustomMixedVerificationType =>
				(CUSTOM_MIXED_VERIFICATION_TYPE_OPTIONS as readonly string[]).includes(
					value,
				),
			"Unsupported verification type",
		),
	config: MixedStepConfigSchema,
});

export type MixedStepFormValue = z.infer<typeof MixedStepSchema>;

export const CustomVerificationFormSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	description: z.string(),
	steps: z.array(MixedStepSchema).min(1, "Add at least one verification step"),
	is_active: z.boolean(),
});

export type CustomVerificationFormValues = z.infer<
	typeof CustomVerificationFormSchema
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
	faceVerificationMode: DEFAULT_FACE_VERIFICATION_MODE,
	checkForDuplicates: false,
	faceAgeMin: String(FACE_AGE_MIN_YEARS),
	faceAgeMax: "",
	requireSelfie: false,
	allowFileUpload: true,
});

export function createMixedStep(
	type: CustomMixedVerificationType,
): MixedStepFormValue {
	return {
		id: crypto.randomUUID(),
		type,
		config: emptyMixedStepConfig(),
	};
}

export const emptyCustomVerificationFormValues: CustomVerificationFormValues = {
	name: "",
	description: "",
	steps: [],
	is_active: true,
};

export function isCustomMixedVerificationType(
	value: string,
): value is CustomMixedVerificationType {
	return (CUSTOM_MIXED_VERIFICATION_TYPE_OPTIONS as readonly string[]).includes(
		value,
	);
}

export function isAmlMixedStepType(type: string) {
	return type === "aml_screening" || type === "business_aml_screening";
}

export function isGrcMixedStepType(type: string): type is MixedGrcType {
	return (MIXED_GRC_TYPE_OPTIONS as readonly string[]).includes(type);
}

export function grcStepSupportsSelfie(type: string) {
	const meta = getRegistryVerificationType(type);
	return Boolean(meta?.validationParameters.includes("selfie"));
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
	type: string,
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
	if (typeof config.allow_file_upload === "boolean") {
		base.allowFileUpload = config.allow_file_upload;
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

	void type;
	return base;
}

export function getCustomVerificationFormValues(
	template?: MixedVerification | null,
): CustomVerificationFormValues {
	if (!template) {
		return emptyCustomVerificationFormValues;
	}

	const stepsPayload = template.steps as MixedVerificationSteps | undefined;
	const stepsMap = stepsPayload?.steps;
	let steps: MixedStepFormValue[] = [];

	if (stepsMap && typeof stepsMap === "object") {
		steps = Object.entries(stepsMap)
			.map(([id, step]) => {
				const type = step.type;
				if (!isCustomMixedVerificationType(type)) {
					return null;
				}
				return {
					id,
					type,
					config: configFromStepRecord(
						type,
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
			.filter(isCustomMixedVerificationType)
			.map((type) => createMixedStep(type));
	}

	return {
		name: template.name,
		description: template.description ?? "",
		steps,
		is_active: template.is_active,
	};
}

function buildStepConfigPayload(
	type: CustomMixedVerificationType,
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
		payload.allow_file_upload = config.allowFileUpload;
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

export function buildCustomVerificationPayload(
	values: CustomVerificationFormValues,
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
		is_active: values.is_active,
	};
}

export function formatVerificationTypeLabel(value: string) {
	const grc = GRC_TYPE_DEFS.find((item) => item.value === value);
	if (grc) {
		return grc.label;
	}
	return value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export function mixedVerificationRequiresAddress(template: MixedVerification) {
	if (Array.isArray(template.verifications)) {
		return template.verifications.includes("address_verification");
	}

	const stepsMap = (template.steps as MixedVerificationSteps | undefined)?.steps;
	if (!stepsMap || typeof stepsMap !== "object") {
		return false;
	}

	return Object.values(stepsMap).some(
		(step) => step.type === "address_verification",
	);
}

export function groupMixedVerifications(items: MixedVerification[]) {
	const platform: MixedVerification[] = [];
	const custom: MixedVerification[] = [];

	for (const item of items) {
		if (item.is_custom) {
			custom.push(item);
		} else {
			platform.push(item);
		}
	}

	return { platform, custom };
}

export {
	AML_SCREENING_FILTERS,
	type AmlScreeningFilterKey,
	type FaceVerificationMode,
};
