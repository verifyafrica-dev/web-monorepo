export const SECTION_NAMES = {
	BASIC_INFORMATION: "basic-information",
	PRIMARY_CONTACT: "primary-contact",
	DIRECTORS_AND_SHAREHOLDERS: "directors-and-shareholders",
	BUSINESS_ACTIVITY: "business-activity",
	ONBOARDING_QUESTIONNAIRE: "onboarding-questionnaire",
	DOCUMENTS_UPLOAD: "documents-upload",
	COMPLIANCE_DECLARATIONS: "compliance-declarations",
	AUTHORIZED_SIGNATURE: "authorized-signature",
} as const;

export const KYC_SECTION_PATHS = [
	SECTION_NAMES.BASIC_INFORMATION,
	SECTION_NAMES.PRIMARY_CONTACT,
	SECTION_NAMES.DIRECTORS_AND_SHAREHOLDERS,
	SECTION_NAMES.BUSINESS_ACTIVITY,
	SECTION_NAMES.ONBOARDING_QUESTIONNAIRE,
	SECTION_NAMES.DOCUMENTS_UPLOAD,
	SECTION_NAMES.COMPLIANCE_DECLARATIONS,
	SECTION_NAMES.AUTHORIZED_SIGNATURE,
] as const;

export type KycSectionPath = (typeof KYC_SECTION_PATHS)[number];

export type KycSection = {
	title: string;
	description: string;
	path: KycSectionPath;
};

export const sections: KycSection[] = [
	{
		title: "Basic Information",
		description: "Provide your basic information to get started.",
		path: SECTION_NAMES.BASIC_INFORMATION,
	},
	{
		title: "Primary Contact",
		description: "Provide your primary contact details.",
		path: SECTION_NAMES.PRIMARY_CONTACT,
	},
	{
		title: "Directors and Shareholders",
		description: "Provide your directors and shareholders details.",
		path: SECTION_NAMES.DIRECTORS_AND_SHAREHOLDERS,
	},
	{
		title: "Business Activity",
		description: "Provide your business activity details.",
		path: SECTION_NAMES.BUSINESS_ACTIVITY,
	},
	{
		title: "Onboarding Questionnaire",
		description: "Answer the onboarding questionnaire to get started.",
		path: SECTION_NAMES.ONBOARDING_QUESTIONNAIRE,
	},
	{
		title: "Documents Upload",
		description: "Upload required business and identification documents.",
		path: SECTION_NAMES.DOCUMENTS_UPLOAD,
	},
	{
		title: "Compliance Declarations",
		description:
			"Please confirm the following declarations by checking the boxes below:",
		path: SECTION_NAMES.COMPLIANCE_DECLARATIONS,
	},
	{
		title: "Authorized Signature",
		description: "Provide your authorized signature.",
		path: SECTION_NAMES.AUTHORIZED_SIGNATURE,
	},
];

export function getSectionByPath(path: string | undefined) {
	if (!path) {
		return undefined;
	}

	return sections.find((section) => section.path === path);
}
