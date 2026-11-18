import type {
	TmCreatePlatformTemplatePayload,
	TmFeature,
	TmTemplate,
	TmUpdatePlatformTemplatePayload,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";
import { z } from "zod";

export const TM_EVENT_OPTIONS = [
	{ value: "transfer", label: "Transfer" },
	{ value: "payout", label: "Payout" },
	{ value: "wallet_funding", label: "Wallet funding" },
	{ value: "checkout", label: "Checkout" },
] as const;

/** Sentinel for "no event" — Radix Select can't hold an empty-string value. */
export const ANY_EVENT = "__any__";

export const GROUP_LABELS: Record<string, string> = {
	aml: "AML & fraud",
	card: "Card & e-commerce",
	lending: "Lending",
	crypto: "Crypto",
};

export function titleCase(value: string) {
	return value
		.replace(/[_-]+/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatEventLabel(event: string | null | undefined) {
	if (!event) return "Any event";
	return (
		TM_EVENT_OPTIONS.find((option) => option.value === event)?.label ??
		titleCase(event)
	);
}

export function roundWeight(weight: number) {
	return Math.round(weight * 100) / 100;
}

export type FeatureSelection = Record<string, number>;

export interface TemplateFormState {
	slug: string;
	name: string;
	description: string;
	event: string;
	region: string;
	industry: string;
	sortOrder: number;
	isActive: boolean;
}

export const EMPTY_TEMPLATE_FORM: TemplateFormState = {
	slug: "",
	name: "",
	description: "",
	event: ANY_EVENT,
	region: "NG",
	industry: "fintech",
	sortOrder: 0,
	isActive: true,
};

export function toTemplateFormState(template: TmTemplate): TemplateFormState {
	return {
		slug: template.id,
		name: template.name,
		description: template.description ?? "",
		event: template.event ?? ANY_EVENT,
		region: template.region,
		industry: template.industry,
		sortOrder: template.sort_order ?? 0,
		isActive: template.is_active ?? true,
	};
}

export function toSelection(
	template: TmTemplate | null,
	catalog: TmFeature[],
): FeatureSelection {
	if (!template) return {};
	const known = new Set(catalog.map((feature) => feature.key));
	const selection: FeatureSelection = {};
	for (const feature of template.features) {
		if (known.has(feature.key)) selection[feature.key] = feature.weight;
	}
	return selection;
}

export const TemplateFormSchema = z.object({
	slug: z
		.string()
		.trim()
		.min(1, "Enter a slug")
		.max(64, "Slug must be 64 characters or fewer")
		.regex(/^[-a-zA-Z0-9_]+$/, "Use letters, numbers, hyphens and underscores"),
	name: z.string().trim().min(1, "Enter a name").max(255, "Name is too long"),
	description: z.string(),
	event: z.string(),
	region: z
		.string()
		.trim()
		.min(2, "Enter a region")
		.max(16, "Region is too long"),
	industry: z.string().trim().min(1, "Enter an industry").max(64),
	sortOrder: z.number().int().min(0, "Sort order can't be negative"),
	isActive: z.boolean(),
});

function toFeatureList(selection: FeatureSelection) {
	return Object.entries(selection).map(([key, weight]) => ({
		key,
		weight: roundWeight(weight),
	}));
}

export function buildCreatePayload(
	form: TemplateFormState,
	selection: FeatureSelection,
): TmCreatePlatformTemplatePayload {
	return {
		slug: form.slug.trim(),
		name: form.name.trim(),
		description: form.description.trim(),
		event: form.event === ANY_EVENT ? "" : form.event,
		region: form.region.trim().toUpperCase(),
		industry: form.industry.trim(),
		features: toFeatureList(selection),
		is_active: form.isActive,
		sort_order: form.sortOrder,
	};
}

/** Slug is immutable server-side (not in the update serializer). */
export function buildUpdatePayload(
	form: TemplateFormState,
	selection: FeatureSelection,
): TmUpdatePlatformTemplatePayload {
	return {
		name: form.name.trim(),
		description: form.description.trim(),
		event: form.event === ANY_EVENT ? "" : form.event,
		region: form.region.trim().toUpperCase(),
		industry: form.industry.trim(),
		features: toFeatureList(selection),
		is_active: form.isActive,
		sort_order: form.sortOrder,
	};
}
