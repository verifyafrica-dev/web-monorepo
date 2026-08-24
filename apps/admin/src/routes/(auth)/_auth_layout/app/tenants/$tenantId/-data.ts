import type {
	KycSummary,
	SupportedCountry,
	TenantDetail,
	TenantVerificationConfigRow,
} from "#/api/http/v2/tenants/tenants.types";
import type { KycDisplayStatus } from "../-data";
import { formatAdminNumber } from "../../-data";
import { formatTenantDate } from "../-data";
import type { VerificationProviderTab } from "./-constants";

export function formatTenantCurrency(amount: number, currency = "USD") {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(amount);
}

export function formatTenantMoney(
	amount: string | number | null | undefined,
	currency = "USD",
) {
	const numericAmount =
		typeof amount === "number"
			? amount
			: Number.parseFloat(amount ?? "0");

	return formatTenantCurrency(
		Number.isFinite(numericAmount) ? numericAmount : 0,
		currency,
	);
}

export function getInvoiceTotalAmount(invoice: {
	total_amount?: string | null;
	paid_amount?: string | null;
	items?: Array<{ total_price?: string | null }>;
}) {
	if (invoice.total_amount) {
		return invoice.total_amount;
	}

	if (invoice.paid_amount) {
		return invoice.paid_amount;
	}

	const itemTotal = (invoice.items ?? []).reduce((sum, item) => {
		const value = Number.parseFloat(item.total_price ?? "0");
		return sum + (Number.isFinite(value) ? value : 0);
	}, 0);

	return itemTotal > 0 ? String(itemTotal) : "0";
}

export function getPaymentStatusBadgeClass(status?: string | null) {
	switch ((status ?? "").toUpperCase()) {
		case "SUCCESS":
			return "border-emerald-200 bg-emerald-50 text-emerald-700";
		case "PENDING":
			return "border-amber-200 bg-amber-50 text-amber-700";
		case "DUE":
			return "border-orange-200 bg-orange-50 text-orange-700";
		case "FAILED":
			return "border-red-200 bg-red-50 text-red-700";
		default:
			return "border-muted bg-muted text-muted-foreground";
	}
}

export function getTransactionTypeBadgeClass(type?: string | null) {
	return (type ?? "").toUpperCase() === "CREDIT"
		? "border-emerald-200 bg-emerald-50 text-emerald-700"
		: "border-red-200 bg-red-50 text-red-700";
}

export function matchesInvoiceSearch(
	invoice: {
		invoice_id?: string;
		id: string;
		description?: string;
	},
	query: string,
) {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return true;
	}

	return [
		invoice.invoice_id,
		invoice.id,
		invoice.description,
	]
		.filter(Boolean)
		.some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

export function matchesTransactionSearch(
	transaction: {
		reference: string;
		reason: string;
	},
	query: string,
) {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return true;
	}

	return [transaction.reference, transaction.reason].some((value) =>
		value.toLowerCase().includes(normalizedQuery),
	);
}

export function matchesActivityLogSearch(
	log: {
		action?: string;
		description?: string;
		user_name?: string | null;
		ip_address?: string | null;
	},
	query: string,
) {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return true;
	}

	return [
		log.action,
		log.description,
		log.user_name,
		log.ip_address,
	]
		.filter(Boolean)
		.some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

export function downloadCsv(filename: string, rows: string[][]) {
	const csvContent = rows
		.map((row) =>
			row
				.map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
				.join(","),
		)
		.join("\n");

	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");
	const url = URL.createObjectURL(blob);

	link.href = url;
	link.download = filename;
	link.style.visibility = "hidden";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function getKycDisplayStatusFromKyc(kyc: KycSummary): KycDisplayStatus {
	if (kyc.kyc_verified || kyc.kyc_status === "verified") {
		return "verified";
	}

	if (kyc.kyc_status === "submitted") {
		return "pending";
	}

	return "not_started";
}

export function getTenantKycLabel(tenant: TenantDetail) {
	if (tenant.kyc.kyc_verified || tenant.kyc.kyc_status === "verified") {
		return "Verified";
	}

	if (tenant.kyc.kyc_status === "submitted") {
		return "Pending";
	}

	return "Not Started";
}

export function normalizeEnabledCountryCodes(
	enabledCountries: TenantDetail["enabled_countries"],
): string[] {
	if (Array.isArray(enabledCountries)) {
		return enabledCountries;
	}

	return [];
}

export function sanitizeEnabledCountryCodes(
	countryCodes: string[],
	supportedCountryCodes: Set<string>,
) {
	if (supportedCountryCodes.size === 0) {
		return countryCodes;
	}

	return countryCodes.filter((code) => supportedCountryCodes.has(code));
}

export function groupCountriesByRegion(countries: SupportedCountry[]) {
	const grouped = countries.reduce<Record<string, SupportedCountry[]>>(
		(acc, country) => {
			const region = country.region || "Other";

			if (!acc[region]) {
				acc[region] = [];
			}

			acc[region].push(country);
			return acc;
		},
		{},
	);

	return Object.entries(grouped)
		.map(([region, regionCountries]) => [
			region,
			[...regionCountries].sort((a, b) => a.name.localeCompare(b.name)),
		] as const)
		.sort(([regionA], [regionB]) => regionA.localeCompare(regionB));
}

export function normalizeVerificationProvider(source: string): VerificationProviderTab | null {
	const normalized = source.trim().toLowerCase();

	if (normalized.startsWith("korapay")) {
		return "korapay";
	}

	if (normalized.startsWith("shufti")) {
		return "shufti";
	}

	return null;
}

export function formatVerificationLabel(value: string) {
	return value
		.replace(/_/g, " ")
		.replace(/\b\w/g, (character) => character.toUpperCase());
}

export type VerificationConfigDraft = {
	isEnabled: boolean;
	price: string;
};

export function buildVerificationConfigDrafts(
	configs: TenantVerificationConfigRow[],
) {
	return configs.reduce<Record<string, VerificationConfigDraft>>((acc, row) => {
		acc[row.verification_type] = {
			isEnabled: row.has_override
				? Boolean(row.override_is_enabled)
				: row.global_is_active,
			price: row.override_price ?? row.global_price ?? "",
		};
		return acc;
	}, {});
}

export function buildVerificationConfigUpdates(
	configs: TenantVerificationConfigRow[],
	drafts: Record<string, VerificationConfigDraft>,
) {
	return configs.flatMap((row) => {
		const draft = drafts[row.verification_type];
		if (!draft) {
			return [];
		}

		const matchesGlobal =
			draft.isEnabled === row.global_is_active &&
			(draft.isEnabled ? draft.price === (row.global_price ?? "") : true);

		if (matchesGlobal) {
			return [];
		}

		return [
			{
				verification_type: row.verification_type,
				is_enabled: draft.isEnabled,
				price: draft.isEnabled ? draft.price : null,
			},
		];
	});
}

export function validateVerificationConfigDrafts(
	configs: TenantVerificationConfigRow[],
	drafts: Record<string, VerificationConfigDraft>,
) {
	for (const row of configs) {
		const draft = drafts[row.verification_type];
		if (!draft?.isEnabled) {
			continue;
		}

		const price = draft.price.trim();
		if (!price || !/^\d*\.?\d+$/.test(price) || Number.parseFloat(price) <= 0) {
			return `Enter a valid override price for ${formatVerificationLabel(row.verification_type)}.`;
		}
	}

	return null;
}

export function formatComplianceAddress(value: unknown) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return "Not provided";
	}

	const address = value as Record<string, unknown>;
	const parts = [address.address, address.postal_code, address.country].filter(
		(part) => part !== null && part !== undefined && String(part).trim() !== "",
	);

	return parts.length > 0 ? parts.map(String).join(", ") : "Not provided";
}

export function formatComplianceListValue(value: unknown): string {
	if (value === null || value === undefined) {
		return "Not provided";
	}

	if (Array.isArray(value)) {
		const items = value
			.map((item) => String(item).trim())
			.filter((item) => item !== "");

		return items.length > 0 ? items.join(", ") : "None";
	}

	if (typeof value === "string") {
		return value.trim() === "" ? "Not provided" : value.trim();
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}

	return "Not provided";
}

export function getComplianceFieldValue(
	data: Record<string, unknown> | undefined,
	key: string,
): string {
	const value = data?.[key];

	if (value === null || value === undefined) {
		return "Not provided";
	}

	if (typeof value === "string") {
		return value.trim() === "" ? "Not provided" : value.trim();
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}

	if (Array.isArray(value)) {
		return formatComplianceListValue(value);
	}

	if (typeof value === "object") {
		if ("address" in value || "postal_code" in value || "country" in value) {
			return formatComplianceAddress(value);
		}

		if ("name" in value || "email" in value) {
			const nested = value as Record<string, unknown>;
			const parts = [nested.name, nested.email]
				.filter(
					(part) =>
						part !== null && part !== undefined && String(part).trim() !== "",
				)
				.map(String);

			return parts.length > 0 ? parts.join(" · ") : "Not provided";
		}
	}

	return "Not provided";
}

export type ComplianceDirector = {
	name?: string;
	date_of_birth?: string;
	nationality?: string;
	id_number?: string;
	address?: unknown;
};

export type ComplianceUbo = {
	name?: string;
	ownership_percentage?: number;
	id_number?: string;
};

export type ComplianceDocument = {
	id?: string;
	file_name?: string;
	file_size?: number;
	file_type?: string;
	uploaded_at?: string;
	url?: string;
};

export const COMPLIANCE_DOCUMENT_CATEGORIES = [
	{
		key: "directors_identification",
		label: "Directors Identification",
		description: "Passports and nationally approved IDs for all directors",
	},
	{
		key: "proof_of_business_address",
		label: "Proof of Business Address",
		description:
			"Utility bill, lease agreement, or official government document",
	},
	{
		key: "proof_of_directors_address",
		label: "Proof of Directors Address",
		description: "Utility bills or official documents for each director",
	},
	{
		key: "proof_of_website_domain_ownership",
		label: "Proof of Website/Domain Ownership",
		description: "Screenshot from domain registrar showing ownership",
	},
	{
		key: "legal_company_license",
		label: "Legal Company License",
		description: "Business registration certificate or operating license",
	},
] as const;

export function getComplianceDirectors(
	complianceData: Record<string, unknown>,
): ComplianceDirector[] {
	const section = complianceData.directors_and_shareholders;

	if (!section || typeof section !== "object" || Array.isArray(section)) {
		return [];
	}

	const directors = (section as Record<string, unknown>).directors;

	return Array.isArray(directors) ? (directors as ComplianceDirector[]) : [];
}

export function getComplianceUbos(
	complianceData: Record<string, unknown>,
): ComplianceUbo[] {
	const section = complianceData.directors_and_shareholders;

	if (!section || typeof section !== "object" || Array.isArray(section)) {
		return [];
	}

	const ubos = (section as Record<string, unknown>).ubos;

	return Array.isArray(ubos) ? (ubos as ComplianceUbo[]) : [];
}

export function getComplianceDocumentsByCategory(
	complianceData: Record<string, unknown>,
	categoryKey: string,
): ComplianceDocument[] {
	const documentsUpload = complianceData.documents_upload;

	if (
		!documentsUpload ||
		typeof documentsUpload !== "object" ||
		Array.isArray(documentsUpload)
	) {
		return [];
	}

	const documents = (documentsUpload as Record<string, unknown>)[categoryKey];

	return Array.isArray(documents) ? (documents as ComplianceDocument[]) : [];
}

export function formatComplianceFileSize(bytes?: number) {
	if (bytes === undefined || Number.isNaN(bytes)) {
		return "Unknown size";
	}

	if (bytes === 0) {
		return "0 Bytes";
	}

	const units = ["Bytes", "KB", "MB", "GB"];
	const unitIndex = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1,
	);
	const size = bytes / 1024 ** unitIndex;

	return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
}

export const COMPLIANCE_DECLARATION_ITEMS = [
	{
		key: "not_engaged_in_prohibited_activities",
		label: "Not engaged in prohibited activities",
	},
	{
		key: "no_directors_ubos_on_sanctions_lists",
		label: "No directors/UBOs on sanctions lists",
	},
	{
		key: "information_true_and_complete",
		label: "Information true and complete",
	},
	{
		key: "agree_to_provide_supporting_documents",
		label: "Agreed to provide supporting documents",
	},
] as const;

export function getComplianceDeclarationValue(
	complianceData: Record<string, unknown>,
	key: (typeof COMPLIANCE_DECLARATION_ITEMS)[number]["key"],
) {
	const declarations = complianceData.compliance_declarations;

	if (declarations === true) {
		return true;
	}

	if (!declarations || typeof declarations !== "object") {
		return false;
	}

	return Boolean((declarations as Record<string, unknown>)[key]);
}

export function hasComplianceDeclarations(
	complianceData: Record<string, unknown>,
) {
	const declarations = complianceData.compliance_declarations;

	if (declarations === true) {
		return true;
	}

	if (!declarations || typeof declarations !== "object") {
		return false;
	}

	return COMPLIANCE_DECLARATION_ITEMS.some((item) =>
		Boolean((declarations as Record<string, unknown>)[item.key]),
	);
}

export function getAuthorizedSignature(
	complianceData: Record<string, unknown>,
) {
	const signature = complianceData.authorized_signature;

	if (!signature || typeof signature !== "object" || Array.isArray(signature)) {
		return null;
	}

	return signature as Record<string, unknown>;
}

export { formatAdminNumber, formatTenantDate };
