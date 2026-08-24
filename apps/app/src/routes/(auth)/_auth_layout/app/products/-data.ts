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

export const PRODUCT_ICON_WEIGHT = "duotone" as const satisfies IconWeight;

export type ProductSlug =
	| "mixed-verifications"
	| "document-verification"
	| "address-verification"
	| "facial-screening"
	| "aml-screening"
	| "business-aml-screening"
	| "kyb"
	| "government-registry-checks"
	| "risk-assessment"
	| "crypto-wallet-screening";

export type Product = {
	slug: ProductSlug;
	title: string;
	description: string;
	icon: ComponentType<{ className?: string; weight?: IconWeight }>;
	iconWeight: typeof PRODUCT_ICON_WEIGHT;
};

export const PRODUCTS: Product[] = [
	{
		slug: "mixed-verifications",
		title: "Mixed Verifications",
		description:
			"Launch predefined verification journeys that bundle multiple checks into a single hosted verification flow.",
		icon: StackIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: "document-verification",
		title: "Document Verification",
		description:
			"Verify government-issued identity documents such as passports, national IDs, and driver's licenses across African countries.",
		icon: FileTextIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: "address-verification",
		title: "Address Verification",
		description:
			"Confirm the physical address of individuals or businesses using utility bills, bank statements, and other proof-of-address documents.",
		icon: MapPinIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: "facial-screening",
		title: "Facial Screening",
		description:
			"Verify user identity through facial analysis and biometric comparison workflows for stronger fraud prevention.",
		icon: UserFocusIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: "aml-screening",
		title: "AML Screening",
		description:
			"Screen individuals and entities against global sanctions lists, PEP databases, and adverse media sources.",
		icon: ShieldCheckIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: "business-aml-screening",
		title: "Business AML Screening",
		description:
			"Screen businesses against sanctions, PEP, fitness and probity, and adverse media datasets using configurable match thresholds.",
		icon: FileMagnifyingGlassIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: "kyb",
		title: "KYB - Know Your Business",
		description:
			"Verify business registration details, directors, shareholders, and ultimate beneficial owners across jurisdictions.",
		icon: BuildingsIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: "government-registry-checks",
		title: "Government Registry Checks",
		description:
			"Validate individuals and entities against government registries to confirm legal status and official records.",
		icon: BankIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: "risk-assessment",
		title: "Risk Assessment",
		description:
			"Run an onsite risk assessment flow using a phone number and optional risk reference.",
		icon: ChartBarIcon,
		iconWeight: PRODUCT_ICON_WEIGHT,
	},
	{
		slug: "crypto-wallet-screening",
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
