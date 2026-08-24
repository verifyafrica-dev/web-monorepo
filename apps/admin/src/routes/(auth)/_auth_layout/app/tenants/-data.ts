import $http from "#/api/http/xhr";
import type { BillingPlan } from "#/api/http/v2/billing/billing.types";
import type { PlatformAnalyticsPayload } from "#/api/http/v2/analytics/analytics.types";
import type {
	KycStatus,
	TenantAllListItem,
} from "#/api/http/v2/tenants/tenants.types";

export type BillingPlanFilter = "all" | BillingPlan;
export type KycStatusFilter = "all" | "verified" | "pending" | "not_started";

export type TenantStats = {
	totalTenants: number;
	kycVerified: number;
	pendingKyc: number;
	newThisMonth: number;
};

const tenantDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "long",
	day: "numeric",
	year: "numeric",
	hour: "numeric",
	minute: "2-digit",
});

const AVATAR_COLORS = [
	{ bg: "bg-blue-100", text: "text-blue-700" },
	{ bg: "bg-emerald-100", text: "text-emerald-700" },
	{ bg: "bg-violet-100", text: "text-violet-700" },
	{ bg: "bg-amber-100", text: "text-amber-700" },
	{ bg: "bg-rose-100", text: "text-rose-700" },
	{ bg: "bg-cyan-100", text: "text-cyan-700" },
] as const;

export function formatTenantDate(value: string) {
	return tenantDateFormatter.format(new Date(value));
}

export function getTenantAvatarColor(name: string) {
	const hash = name
		.split("")
		.reduce((total, character) => total + character.charCodeAt(0), 0);

	return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function getBillingPlanLabel(plan?: BillingPlan) {
	if (plan === "enterprise") {
		return "Enterprise";
	}

	return "PAYG";
}

export function getKycDisplayStatus(tenant: TenantAllListItem) {
	if (tenant.kyc_verified || tenant.kyc_status === "verified") {
		return "verified" as const;
	}

	if (tenant.kyc_status === "submitted") {
		return "pending" as const;
	}

	return "not_started" as const;
}

export function buildTenantAllListQuery({
	page,
	perPage,
	search,
	billingPlanFilter,
	kycStatusFilter,
}: {
	page: number;
	perPage: number;
	search: string;
	billingPlanFilter: BillingPlanFilter;
	kycStatusFilter: KycStatusFilter;
}) {
	const trimmedSearch = search.trim();

	return {
		page,
		per_page: perPage,
		...(trimmedSearch ? { search: trimmedSearch } : {}),
		...(billingPlanFilter !== "all"
			? { billing_plan: billingPlanFilter }
			: {}),
		...(kycStatusFilter !== "all" ? { kyc_status: kycStatusFilter } : {}),
	};
}

export function mapPlatformAnalyticsToTenantStats(
	response: PlatformAnalyticsPayload | undefined,
): TenantStats {
	if (!response) {
		return {
			totalTenants: 0,
			kycVerified: 0,
			pendingKyc: 0,
			newThisMonth: 0,
		};
	}

	const { summary, tenants } = response.analytics;
	const complianceStatus = tenants.compliance_status ?? {};
	const now = new Date();
	const currentMonth = now.getMonth();
	const currentYear = now.getFullYear();

	const newThisMonth = tenants.tenant_growth.reduce((total, point) => {
		const date = new Date(point.date);

		if (
			date.getMonth() === currentMonth &&
			date.getFullYear() === currentYear
		) {
			return total + point.new_tenants;
		}

		return total;
	}, 0);

	return {
		totalTenants: summary.total_tenants,
		kycVerified: complianceStatus.verified ?? 0,
		pendingKyc: complianceStatus.pending ?? 0,
		newThisMonth,
	};
}

export async function downloadTenantStatements(
	filename = "statements.xlsx",
) {
	const response = await $http.get("/analytics/statements/", {
		responseType: "blob",
	});
	const url = window.URL.createObjectURL(new Blob([response.data]));
	const link = document.createElement("a");

	link.href = url;
	link.setAttribute("download", filename);
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(url);
}

export const BILLING_PLAN_FILTER_OPTIONS: {
	value: BillingPlanFilter;
	label: string;
}[] = [
	{ value: "all", label: "All Plans" },
	{ value: "payg", label: "Pay As You Go (PAYG)" },
	{ value: "enterprise", label: "Enterprise" },
];

export const KYC_STATUS_FILTER_OPTIONS: {
	value: KycStatusFilter;
	label: string;
}[] = [
	{ value: "all", label: "All Statuses" },
	{ value: "verified", label: "Verified" },
	{ value: "pending", label: "Pending" },
	{ value: "not_started", label: "Not Started" },
];

export type KycDisplayStatus = ReturnType<typeof getKycDisplayStatus>;

export type { KycStatus };
