export const TENANT_DETAIL_TABS = {
	OVERVIEW: "overview",
	USERS: "users",
	VERIFICATION_CONFIGS: "verification_configs",
	ENABLED_COUNTRIES: "enabled_countries",
	COMPLIANCE: "compliance",
	INVOICES: "invoices",
	TRANSACTIONS: "transactions",
	ACTIVITY_LOGS: "activity_logs",
	ADVANCED: "advanced",
} as const;

export type TenantDetailTab =
	(typeof TENANT_DETAIL_TABS)[keyof typeof TENANT_DETAIL_TABS];

export const TENANT_DETAIL_TAB_VALUES = Object.values(TENANT_DETAIL_TABS);

export const COMPLIANCE_SUB_TABS = {
	REVIEW: "review",
	COMPANY_OVERVIEW: "company_overview",
	PEOPLE_OWNERSHIP: "people_ownership",
	BUSINESS_DETAILS: "business_details",
	DOCUMENTS: "documents",
	COMPLIANCE_DECLARATIONS: "compliance_declarations",
} as const;

export type ComplianceSubTab =
	(typeof COMPLIANCE_SUB_TABS)[keyof typeof COMPLIANCE_SUB_TABS];

export const COMPLIANCE_SUB_TAB_VALUES = Object.values(COMPLIANCE_SUB_TABS);

export const VERIFICATION_PROVIDER_TABS = {
	SHUFTI: "shufti",
	KORAPAY: "korapay",
} as const;

export type VerificationProviderTab =
	(typeof VERIFICATION_PROVIDER_TABS)[keyof typeof VERIFICATION_PROVIDER_TABS];

export const DELETE_CONFIRM_ITEMS = [
	"All tenant information",
	"All associated users",
	"All transactions and invoices",
	"All compliance data",
	"All wallet data",
] as const;
