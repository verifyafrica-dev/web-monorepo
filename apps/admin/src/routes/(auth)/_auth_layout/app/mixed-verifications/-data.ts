import { z } from "zod";
import type {
	MixedVerification,
	MixedVerificationUpsertPayload,
} from "#/api/http/v2/verifications/verifications.types";
import { SHUFTI_VERIFICATION_TYPES } from "#/lib/constants";

export const MIXED_VERIFICATION_TYPE_OPTIONS = Object.values(
	SHUFTI_VERIFICATION_TYPES,
);

export const MixedVerificationFormSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	description: z.string(),
	verifications: z
		.array(z.string())
		.min(1, "Select at least one verification type"),
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

export const EMPTY_MIXED_VERIFICATION_FORM: MixedVerificationFormValues = {
	name: "",
	description: "",
	verifications: [],
	journey_id: "",
	price: "",
	is_active: true,
	is_custom: false,
};

export function formatMixedVerificationType(value: string) {
	return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
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
	return {
		name: template.name,
		description: template.description,
		verifications: template.verifications,
		journey_id: template.journey_id ?? "",
		price: template.price ?? "",
		is_active: template.is_active,
		is_custom: template.is_custom,
	};
}

export function buildMixedVerificationPayload(
	values: MixedVerificationFormValues,
): MixedVerificationUpsertPayload {
	return {
		name: values.name.trim(),
		description: values.description.trim(),
		verifications: values.verifications,
		journey_id: values.journey_id.trim(),
		price: values.price.trim(),
		is_active: values.is_active,
		is_custom: false,
	};
}
