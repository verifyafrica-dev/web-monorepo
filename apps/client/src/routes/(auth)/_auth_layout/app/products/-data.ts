import {
	BankIcon,
	BuildingsIcon,
	ChartBarIcon,
	FileMagnifyingGlassIcon,
	FileTextIcon,
	MapPinIcon,
	ShieldCheckIcon,
	StackIcon,
	UserFocusIcon,
	WalletIcon,
	type IconWeight,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

import { VERIFICATION_TYPES_BY_PRODUCT } from "#/api/http/v2/verifications/verifications.types";

export const PRODUCT_ICON_WEIGHT = "duotone" as const satisfies IconWeight;

export const PRODUCT_SLUG = {
	MIXED_VERIFICATIONS: "mixed-verifications",
	DOCUMENT_VERIFICATION: "document-verification",
	ADDRESS_VERIFICATION: "address-verification",
	FACIAL_SCREENING: "facial-screening",
	AML_SCREENING: "aml-screening",
	BUSINESS_AML_SCREENING: "business-aml-screening",
	KYB: "kyb",
	GOVERNMENT_REGISTRY_CHECKS: "government-registry-checks",
	RISK_ASSESSMENT: "risk-assessment",
	CRYPTO_WALLET_SCREENING: "crypto-wallet-screening",
} as const;

export type ProductSlug = (typeof PRODUCT_SLUG)[keyof typeof PRODUCT_SLUG];

export type Product = {
	slug: ProductSlug;
	title: string;
	description: string;
	icon: ComponentType<{ className?: string; weight?: IconWeight }>;
	iconWeight: typeof PRODUCT_ICON_WEIGHT;
};

export const PRODUCTS: Product[] = [
	{
		slug: PRODUCT_SLUG.MIXED_VERIFICATIONS,
		title: "Mixed Verifications",
		description:
			"Launch predefined verification journeys that bundle multiple checks into a single hosted verification flow.",
		icon: StackIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: PRODUCT_SLUG.DOCUMENT_VERIFICATION,
		title: "Document Verification",
		description:
			"Verify government-issued identity documents such as passports, national IDs, and driver's licenses across African countries.",
		icon: FileTextIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: PRODUCT_SLUG.ADDRESS_VERIFICATION,
		title: "Address Verification",
		description:
			"Confirm the physical address of individuals or businesses using utility bills, bank statements, and other proof-of-address documents.",
		icon: MapPinIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: PRODUCT_SLUG.FACIAL_SCREENING,
		title: "Facial Screening",
		description:
			"Verify user identity through facial analysis and biometric comparison workflows for stronger fraud prevention.",
		icon: UserFocusIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: PRODUCT_SLUG.AML_SCREENING,
		title: "AML Screening",
		description:
			"Screen individuals and entities against global sanctions lists, PEP databases, and adverse media sources.",
		icon: ShieldCheckIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: PRODUCT_SLUG.BUSINESS_AML_SCREENING,
		title: "Business AML Screening",
		description:
			"Screen businesses against sanctions, PEP, fitness and probity, and adverse media datasets using configurable match thresholds.",
		icon: FileMagnifyingGlassIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: PRODUCT_SLUG.KYB,
		title: "KYB - Know Your Business",
		description:
			"Verify business registration details, directors, shareholders, and ultimate beneficial owners across jurisdictions.",
		icon: BuildingsIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: PRODUCT_SLUG.GOVERNMENT_REGISTRY_CHECKS,
		title: "Government Registry Checks",
		description:
			"Validate individuals and entities against government registries to confirm legal status and official records.",
		icon: BankIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: PRODUCT_SLUG.RISK_ASSESSMENT,
		title: "Risk Assessment",
		description:
			"Run an onsite risk assessment flow using a phone number and optional risk reference.",
		icon: ChartBarIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: PRODUCT_SLUG.CRYPTO_WALLET_SCREENING,
		title: "Crypto Wallet Screening",
		description:
			"Analyse blockchain wallet addresses for exposure to illicit activity, mixing services, and sanctioned entities.",
		icon: WalletIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
];

export function getProduct(slug: ProductSlug) {
	return PRODUCTS.find((product) => product.slug === slug);
}

const PRODUCT_SLUG_BY_LABEL = {
	"Government Registry Checks": PRODUCT_SLUG.GOVERNMENT_REGISTRY_CHECKS,
	"Document Verification": PRODUCT_SLUG.DOCUMENT_VERIFICATION,
	"Facial Screening": PRODUCT_SLUG.FACIAL_SCREENING,
	"Address Verification": PRODUCT_SLUG.ADDRESS_VERIFICATION,
	"AML Screening": PRODUCT_SLUG.AML_SCREENING,
	"Business AML Screening": PRODUCT_SLUG.BUSINESS_AML_SCREENING,
	"Crypto Wallet Screening": PRODUCT_SLUG.CRYPTO_WALLET_SCREENING,
	"KYB Screening": PRODUCT_SLUG.KYB,
	"Risk Assessment": PRODUCT_SLUG.RISK_ASSESSMENT,
	"Mixed Verification": PRODUCT_SLUG.MIXED_VERIFICATIONS,
	"Age Verification": null,
	"2FA Verification": null,
} as const satisfies Record<
	keyof typeof VERIFICATION_TYPES_BY_PRODUCT,
	ProductSlug | null
>;

const VERIFICATION_TYPE_PRODUCT_ALIASES = {
	document_verification: PRODUCT_SLUG.DOCUMENT_VERIFICATION,
	facial_screening: PRODUCT_SLUG.FACIAL_SCREENING,
	kyb: PRODUCT_SLUG.KYB,
	government_registry_checks: PRODUCT_SLUG.GOVERNMENT_REGISTRY_CHECKS,
	"government-registry-checks": PRODUCT_SLUG.GOVERNMENT_REGISTRY_CHECKS,
	"risk-assessment": PRODUCT_SLUG.RISK_ASSESSMENT,
} as const satisfies Record<string, ProductSlug>;

export function getProductSlugForVerificationType(
	verificationType: string,
): ProductSlug | null {
	if (verificationType in VERIFICATION_TYPE_PRODUCT_ALIASES) {
		return VERIFICATION_TYPE_PRODUCT_ALIASES[
			verificationType as keyof typeof VERIFICATION_TYPE_PRODUCT_ALIASES
		];
	}

	for (const label of Object.keys(PRODUCT_SLUG_BY_LABEL) as Array<
		keyof typeof PRODUCT_SLUG_BY_LABEL
	>) {
		const types = VERIFICATION_TYPES_BY_PRODUCT[label];
		if (!types.includes(verificationType)) {
			continue;
		}

		return PRODUCT_SLUG_BY_LABEL[label];
	}

	return null;
}
