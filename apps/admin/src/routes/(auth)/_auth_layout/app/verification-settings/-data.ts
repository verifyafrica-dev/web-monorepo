import type { VerificationPrice } from "#/api/http/v2/verifications/verifications.types";

const COUNTRY_NAMES: Record<string, string> = {
	ng: "Nigeria",
	ke: "Kenya",
	gh: "Ghana",
	za: "South Africa",
};

export type VerificationPriceDraft = {
	id: number;
	verification_type: string;
	plan: string;
	cost_price: string;
	selling_price: string;
	currency: string;
	is_active: boolean;
};

export type VerificationPriceGroup = {
	verificationType: string;
	payg: VerificationPrice;
	enterprise: VerificationPrice;
};

export function formatVerificationSettingsLabel(value: string) {
	const countryPrefix = value.trim().toLowerCase().slice(0, 2);
	const countryName = COUNTRY_NAMES[countryPrefix] ?? "";
	const readableName = value
		.replace(/^(ng|za|gh|ke)_/, "")
		.replace(/_/g, " ")
		.replace(/\bverification\b/gi, "")
		.trim()
		.replace(/\b\w/g, (character) => character.toUpperCase());

	return `${countryName} ${readableName}`.trim();
}

export function getVerificationPriceDraftKey(
	verificationType: string,
	plan: string,
) {
	return `${verificationType}-${plan}`;
}

export function groupVerificationPrices(
	prices: VerificationPrice[],
): VerificationPriceGroup[] {
	const grouped = prices.reduce<
		Record<string, Partial<Record<"payg" | "enterprise", VerificationPrice>>>
	>((acc, price) => {
		if (price.plan !== "payg" && price.plan !== "enterprise") {
			return acc;
		}

		if (!acc[price.verification_type]) {
			acc[price.verification_type] = {};
		}

		if (!acc[price.verification_type][price.plan]) {
			acc[price.verification_type][price.plan] = price;
		}

		return acc;
	}, {});

	return Object.entries(grouped)
		.flatMap(([verificationType, plans]) => {
			if (!plans.payg || !plans.enterprise) {
				return [];
			}

			return [
				{
					verificationType,
					payg: plans.payg,
					enterprise: plans.enterprise,
				},
			];
		})
		.sort((rowA, rowB) =>
			rowA.verificationType.localeCompare(rowB.verificationType),
		);
}

export function createVerificationPriceDraft(
	price: VerificationPrice,
): VerificationPriceDraft {
	return {
		id: price.id,
		verification_type: price.verification_type,
		plan: price.plan,
		cost_price: price.cost_price,
		selling_price: price.selling_price,
		currency: price.currency,
		is_active: price.is_active,
	};
}

export function getVerificationPriceDisplayValue(
	price: VerificationPrice,
	field: keyof VerificationPriceDraft,
	drafts: Record<string, VerificationPriceDraft>,
) {
	const draft =
		drafts[getVerificationPriceDraftKey(price.verification_type, price.plan)];

	return draft ? draft[field] : price[field];
}

export function buildVerificationPriceUpdates(
	drafts: Record<string, VerificationPriceDraft>,
) {
	return Object.values(drafts).map((draft) => ({
		id: draft.id,
		payload: {
			verification_type: draft.verification_type,
			plan: draft.plan,
			cost_price: draft.cost_price,
			selling_price: draft.selling_price,
			currency: draft.currency,
			is_active: draft.is_active,
		},
	}));
}

export function validateVerificationPriceDrafts(
	drafts: Record<string, VerificationPriceDraft>,
) {
	for (const draft of Object.values(drafts)) {
		const price = draft.selling_price.trim();

		if (!price || !/^\d*\.?\d+$/.test(price) || Number.parseFloat(price) < 0) {
			return `Enter a valid price for ${formatVerificationSettingsLabel(draft.verification_type)} (${draft.plan.toUpperCase()}).`;
		}
	}

	return null;
}

export function isValidPriceInput(value: string) {
	return value === "" || /^\d*\.?\d*$/.test(value);
}
