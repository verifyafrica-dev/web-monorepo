export const KYC_CONTACT_POSITIONS = [
	"Chief Executive Officer (CEO)",
	"Chief Financial Officer (CFO)",
	"Chief Operating Officer (COO)",
	"Managing Director",
	"Director",
	"Company Secretary",
	"Other",
] as const;

export const KYC_TARGET_CLIENTS = [
	"Individuals",
	"SMEs (Small and Medium Enterprises)",
	"Corporates",
	"High-risk Sectors",
] as const;

export const KYC_VERIFICATION_VOLUMES = [
	"0 - 1,000",
	"1,001 - 10,000",
	"10,001 - 50,000",
	"50,001 - 100,000",
	"100,000+",
] as const;

export const KYC_CLIENT_GEOGRAPHIES = [
	"Nigeria",
	"West Africa",
	"Sub-Saharan Africa",
	"Africa",
	"Global",
] as const;

export const KYC_SIGNATURE_METHODS = [
	{ value: "type", label: "Type Signature" },
	{ value: "upload", label: "Upload Signature" },
] as const;

export type KycSignatureMethod =
	(typeof KYC_SIGNATURE_METHODS)[number]["value"];

export const KYC_DECLARATIONS = [
	{
		key: "not_engaged_in_prohibited_activities" as const,
		label:
			"We are not engaged in any prohibited activities as defined by applicable laws and regulations",
	},
	{
		key: "no_directors_ubos_on_sanctions_lists" as const,
		label:
			"None of our directors, officers, or UBOs are listed on any sanctions lists",
	},
	{
		key: "information_true_and_complete" as const,
		label:
			"All information provided is true, complete, and accurate to the best of our knowledge",
	},
	{
		key: "agree_to_provide_supporting_documents" as const,
		label:
			"We agree to provide all supporting documents as requested during the onboarding process",
	},
] as const;

export const KYC_DOCUMENT_CATEGORIES = [
	{
		key: "directors_identification" as const,
		title: "Directors Identification",
		description: "Passports and nationally approved IDs for all directors",
	},
	{
		key: "proof_of_business_address" as const,
		title: "Proof of Business Address",
		description:
			"Utility bill, lease agreement, or official government document",
	},
	{
		key: "proof_of_directors_address" as const,
		title: "Proof of Directors Address",
		description: "Utility bills or official documents for each director",
	},
	{
		key: "proof_of_website_domain_ownership" as const,
		title: "Proof of Website/Domain Ownership",
		description: "Screenshot from domain registrar showing ownership",
	},
	{
		key: "legal_company_license" as const,
		title: "Legal Company License",
		description: "Business registration certificate or operating license",
	},
] as const;
