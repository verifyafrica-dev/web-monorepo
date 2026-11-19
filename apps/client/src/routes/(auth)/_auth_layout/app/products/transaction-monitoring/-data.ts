import type {
	TmCasePriority,
	TmCaseStatus,
	TmCreateMonitorPayload,
	TmFeature,
	TmMonitorStatus,
	TmVerdict,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Tabs / search params                                                       */
/* -------------------------------------------------------------------------- */

export const TM_TABS = [
	"overview",
	"templates",
	"monitors",
	"cases",
	"playground",
] as const;
export type TmTab = (typeof TM_TABS)[number];

export const tmSearchSchema = z.object({
	tab: z.enum(TM_TABS).optional(),
});

export type TmSearchParams = z.infer<typeof tmSearchSchema>;

export function mergeTmSearchParams(
	current: TmSearchParams,
	patch: Partial<TmSearchParams>,
): TmSearchParams {
	const nextTab = patch.tab ?? current.tab ?? "overview";
	return nextTab === "overview" ? {} : { tab: nextTab };
}

/* -------------------------------------------------------------------------- */
/* Labels                                                                     */
/* -------------------------------------------------------------------------- */

export const TM_EVENT_OPTIONS = [
	{ value: "transfer", label: "Transfer" },
	{ value: "payout", label: "Payout" },
	{ value: "wallet_funding", label: "Wallet funding" },
	{ value: "checkout", label: "Checkout" },
	{ value: "login", label: "Login" },
	{ value: "registration", label: "Registration" },
] as const;

/** Industry slugs Autogon (and the backend) use for the hardcoded templates. */
export const TM_INDUSTRY_OPTIONS = [
	{ value: "banking", label: "Banking" },
	{ value: "fintech", label: "Fintech / PSP" },
	{ value: "igaming", label: "Sports betting / iGaming" },
	{ value: "marketplace", label: "E-commerce / Marketplace" },
	{ value: "crypto", label: "Crypto / Digital assets" },
	{ value: "lending", label: "Lending / BNPL" },
	{ value: "insurance", label: "Insurance" },
	{ value: "ecommerce", label: "E-commerce" },
	{ value: "card", label: "Card / Payments" },
	{ value: "health", label: "Healthcare" },
	{ value: "energy", label: "Energy / Utilities" },
	{ value: "education", label: "Education / EdTech" },
	{ value: "general", label: "General / other" },
] as const;

export const TM_APP_LABELS: Record<string, string> = {
	web: "Web",
	mobile: "Mobile",
	api: "API",
};

export function formatAppLabel(app: string | null | undefined) {
	if (!app) return "—";
	return TM_APP_LABELS[app] ?? titleCase(app);
}

export const TM_FEATURE_GROUP_META: Record<
	string,
	{ label: string; description: string }
> = {
	aml: {
		label: "AML & fraud",
		description:
			"Structuring, layering, mule networks, sanctions and geo checks.",
	},
	card: {
		label: "Card & e-commerce",
		description:
			"Card testing, shared cards, chargebacks and card/IP mismatches.",
	},
	lending: {
		label: "Lending",
		description: "Loan stacking and bust-out rings.",
	},
	crypto: {
		label: "Crypto",
		description: "Risky counterparties, mixers, drainers and ramp layering.",
	},
	identity: {
		label: "Identity",
		description: "Credential dumps and synthetic-identity signals.",
	},
};

export function getFeatureGroupLabel(group: string) {
	return TM_FEATURE_GROUP_META[group]?.label ?? titleCase(group);
}

export function titleCase(value: string) {
	return value
		.replace(/[_-]+/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatEventLabel(event: string | null | undefined) {
	if (!event) return "Any event";
	return (
		TM_EVENT_OPTIONS.find((option) => option.value === event)?.label ??
		titleCase(event)
	);
}

export function formatIndustryLabel(industry: string | null | undefined) {
	if (!industry) return "—";
	return (
		TM_INDUSTRY_OPTIONS.find((option) => option.value === industry)?.label ??
		titleCase(industry)
	);
}

/** Field keys in the data contract are snake_case (`customer_ref`). */
export function formatFieldLabel(field: string) {
	return titleCase(field);
}

export function formatWeight(weight: number) {
	return weight.toFixed(2);
}

export function formatDateTime(value: string | null | undefined) {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatAmount(amount: number | null | undefined) {
	if (amount === null || amount === undefined) return "—";
	return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/* -------------------------------------------------------------------------- */
/* Badge styling                                                              */
/* -------------------------------------------------------------------------- */

export const VERDICT_BADGE_CLASS: Record<TmVerdict, string> = {
	allow: "border-emerald-200 bg-emerald-50 text-emerald-700",
	review: "border-amber-300 bg-amber-50 text-amber-800",
	block: "border-red-200 bg-red-50 text-red-700",
};

export const MONITOR_STATUS_BADGE_CLASS: Record<TmMonitorStatus, string> = {
	active: "border-emerald-200 bg-emerald-50 text-emerald-700",
	disabled: "border-border bg-muted text-muted-foreground",
};

export const CASE_STATUS_BADGE_CLASS: Record<TmCaseStatus, string> = {
	open: "border-blue-200 bg-blue-50 text-blue-700",
	investigating: "border-amber-300 bg-amber-50 text-amber-800",
	escalated: "border-red-200 bg-red-50 text-red-700",
	closed: "border-border bg-muted text-muted-foreground",
	sar_filed: "border-violet-200 bg-violet-50 text-violet-700",
};

export const CASE_PRIORITY_BADGE_CLASS: Record<TmCasePriority, string> = {
	low: "border-border bg-muted text-muted-foreground",
	medium: "border-blue-200 bg-blue-50 text-blue-700",
	high: "border-amber-300 bg-amber-50 text-amber-800",
	critical: "border-red-200 bg-red-50 text-red-700",
};

export function formatCaseStatus(status: string) {
	return status === "sar_filed" ? "SAR filed" : titleCase(status);
}

/* -------------------------------------------------------------------------- */
/* Monitor builder                                                            */
/* -------------------------------------------------------------------------- */

/** key → weight (0–1). A key being present means the feature is selected. */
export type FeatureSelection = Record<string, number>;

export const MAX_MONITOR_NAME_LENGTH = 255;

/** Mirrors the backend slug used inside the Omniguard function name. */
export function slugifyMonitorName(name: string) {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 64)
		.replace(/-+$/g, "");
}

export interface MonitorFormState {
	name: string;
	event: string;
	region: string;
	industry: string;
	autoCaseEnabled: boolean;
	autoCaseThreshold: number;
	alertEnabled: boolean;
	alertThreshold: number;
	alertEmail: string;
	isDefault: boolean;
}

export const DEFAULT_AUTO_CASE_THRESHOLD = 70;
export const DEFAULT_ALERT_THRESHOLD = 50;

export const EMPTY_MONITOR_FORM: MonitorFormState = {
	name: "",
	event: "transfer",
	region: "NG",
	industry: "fintech",
	autoCaseEnabled: true,
	autoCaseThreshold: DEFAULT_AUTO_CASE_THRESHOLD,
	alertEnabled: false,
	alertThreshold: DEFAULT_ALERT_THRESHOLD,
	alertEmail: "",
	isDefault: false,
};

export const MonitorFormSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, "Give your monitor a name")
			.max(MAX_MONITOR_NAME_LENGTH, "Name is too long"),
		event: z.string().min(1, "Choose an event"),
		region: z
			.string()
			.trim()
			.min(2, "Enter a region code, e.g. NG")
			.max(16, "Region code is too long"),
		industry: z.string().min(1, "Choose an industry"),
		autoCaseEnabled: z.boolean(),
		autoCaseThreshold: z.number().int().min(0).max(100),
		alertEnabled: z.boolean(),
		alertThreshold: z.number().int().min(0).max(100),
		alertEmail: z.union([z.literal(""), z.email("Enter a valid email")]),
		isDefault: z.boolean(),
	})
	.refine((value) => slugifyMonitorName(value.name).length > 0, {
		path: ["name"],
		message: "Use letters or numbers in the name",
	});

export function validateFeatureSelection(selection: FeatureSelection) {
	return Object.keys(selection).length > 0
		? null
		: "Select at least one feature";
}

/** Same rule the backend applies: amount + currency always, plus each feature's fields. */
export function getDataContract(
	catalog: TmFeature[],
	selection: FeatureSelection,
): string[] {
	const fields = new Set<string>(["amount", "currency"]);
	for (const feature of catalog) {
		if (feature.key in selection) {
			for (const field of feature.required_fields) {
				fields.add(field);
			}
		}
	}
	return [...fields].sort();
}

export function buildCreateMonitorPayload({
	form,
	selection,
	templateId,
}: {
	form: MonitorFormState;
	selection: FeatureSelection;
	templateId: string | null;
}): TmCreateMonitorPayload {
	const alertEmail = form.alertEmail.trim();

	return {
		name: form.name.trim(),
		// Explicit `features` always win server-side; `template_id` is kept for provenance.
		...(templateId ? { template_id: templateId } : {}),
		features: Object.entries(selection).map(([key, weight]) => ({
			key,
			weight: roundWeight(weight),
			active: true,
		})),
		event: form.event,
		region: form.region.trim().toUpperCase(),
		industry: form.industry,
		auto_case_threshold: form.autoCaseEnabled ? form.autoCaseThreshold : null,
		alert_threshold: form.alertEnabled ? form.alertThreshold : null,
		...(form.alertEnabled && alertEmail ? { alert_email: alertEmail } : {}),
		is_default: form.isDefault,
	};
}

export function roundWeight(weight: number) {
	return Math.round(weight * 100) / 100;
}

export function groupFeatures(features: TmFeature[]) {
	const groups = new Map<string, TmFeature[]>();
	for (const feature of features) {
		const list = groups.get(feature.group) ?? [];
		list.push(feature);
		groups.set(feature.group, list);
	}
	return [...groups.entries()].map(([group, items]) => ({ group, items }));
}

/** Rough risk reading of a 0–1 weight for the slider caption. */
export function describeWeight(weight: number) {
	if (weight >= 0.85) return "Critical";
	if (weight >= 0.65) return "High";
	if (weight >= 0.4) return "Medium";
	return "Low";
}

/* -------------------------------------------------------------------------- */
/* Playground                                                                 */
/* -------------------------------------------------------------------------- */

export const PLAYGROUND_FIELD_TYPES: Record<string, "number" | "text"> = {
	amount: "number",
	account_age_days: "number",
};

export const PLAYGROUND_PLACEHOLDERS: Record<string, string> = {
	amount: "900000",
	currency: "NGN",
	channel: "transfer",
	country: "NG",
	card_country: "NG",
	ip: "102.89.10.4",
	ip_country: "NG",
	device_id: "device-abc",
	customer_ref: "cust-001",
	beneficiary_ref: "ben-009",
	account_number: "acct-001",
	account_age_days: "400",
	sender_name: "Adeola Bakare",
	beneficiary_name: "Chinedu Okoro",
};
