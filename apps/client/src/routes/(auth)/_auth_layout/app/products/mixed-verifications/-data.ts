import { z } from "zod";
import type { MixedVerification } from "#/api/http/v2/verifications/verifications.types";

export const MIXED_VERIFICATIONS_LIST_PARAMS = {
	per_page: 100,
} as const;

export const CUSTOM_MIXED_VERIFICATION_TYPE_OPTIONS = [
	"id_document",
	"face_match",
	"address_verification",
	"aml_screening",
	"business_aml_screening",
	"crypto_wallet_screening",
	"kyb_screening",
	"risk_assessment",
] as const;

export type CustomMixedVerificationType =
	(typeof CUSTOM_MIXED_VERIFICATION_TYPE_OPTIONS)[number];

export const CustomVerificationFormSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	description: z.string(),
	verifications: z
		.array(z.enum(CUSTOM_MIXED_VERIFICATION_TYPE_OPTIONS))
		.min(1, "Select at least one verification type"),
	is_active: z.boolean(),
});

export type CustomVerificationFormValues = z.infer<
	typeof CustomVerificationFormSchema
>;

export const emptyCustomVerificationFormValues: CustomVerificationFormValues = {
	name: "",
	description: "",
	verifications: [],
	is_active: true,
};

export function getCustomVerificationFormValues(
	template?: MixedVerification | null,
): CustomVerificationFormValues {
	if (!template) {
		return emptyCustomVerificationFormValues;
	}

	return {
		name: template.name,
		description: template.description ?? "",
		verifications: template.verifications.filter(
			(type): type is CustomMixedVerificationType =>
				CUSTOM_MIXED_VERIFICATION_TYPE_OPTIONS.includes(
					type as CustomMixedVerificationType,
				),
		),
		is_active: template.is_active,
	};
}

export function buildCustomVerificationPayload(
	values: CustomVerificationFormValues,
) {
	return {
		name: values.name.trim(),
		description: values.description.trim(),
		verifications: values.verifications,
		is_active: values.is_active,
	};
}

export function formatVerificationTypeLabel(value: string) {
	return value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export function groupMixedVerifications(items: MixedVerification[]) {
	const sortByName = (left: MixedVerification, right: MixedVerification) =>
		left.name.localeCompare(right.name, undefined, { sensitivity: "base" });

	return {
		platform: items.filter((item) => !item.is_custom).sort(sortByName),
		custom: items.filter((item) => item.is_custom).sort(sortByName),
	};
}

export function mixedVerificationRequiresAddress(template: MixedVerification) {
	return template.verifications.includes("address_verification");
}
