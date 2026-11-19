import { z } from "zod";

import type { V2AxiosError } from "../../shared";

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const TM_FEATURE_GROUPS = ["aml", "card", "lending", "crypto"] as const;
export type TmFeatureGroup = (typeof TM_FEATURE_GROUPS)[number];

export const TM_EVENTS = [
	"transfer",
	"payout",
	"wallet_funding",
	"checkout",
	"login",
	"registration",
] as const;
export type TmEvent = (typeof TM_EVENTS)[number];

export const TM_MONITOR_STATUSES = ["active", "disabled"] as const;
export type TmMonitorStatus = (typeof TM_MONITOR_STATUSES)[number];

export const TM_VERDICTS = ["allow", "review", "block"] as const;
export type TmVerdict = (typeof TM_VERDICTS)[number];

export const TM_OUTCOMES = ["fraud", "chargeback", "legit"] as const;
export type TmOutcome = (typeof TM_OUTCOMES)[number];

export const TM_CASE_STATUSES = [
	"open",
	"investigating",
	"escalated",
	"closed",
	"sar_filed",
] as const;
export type TmCaseStatus = (typeof TM_CASE_STATUSES)[number];

export const TM_CASE_PRIORITIES = [
	"low",
	"medium",
	"high",
	"critical",
] as const;
export type TmCasePriority = (typeof TM_CASE_PRIORITIES)[number];

export const TM_REPORT_TYPES = ["CTR", "STR", "SAR", "NIL", "PEP"] as const;
export type TmReportType = (typeof TM_REPORT_TYPES)[number];

export const TM_REPORT_STATUSES = ["draft", "ready", "filed"] as const;
export type TmReportStatus = (typeof TM_REPORT_STATUSES)[number];

/* -------------------------------------------------------------------------- */
/* Catalog                                                                    */
/* -------------------------------------------------------------------------- */

export interface TmFeature {
	key: string;
	label: string;
	description: string;
	group: TmFeatureGroup | (string & {});
	/** 0–1 */
	default_weight: number;
	required_fields: string[];
	omniguard_template_id: string | null;
}

export interface TmFeatureCatalogData {
	count: number;
	features: TmFeature[];
}

/** A feature selection as sent to / returned from the API. `weight` is 0–1. */
export interface TmFeatureSelection {
	key: string;
	weight: number;
}

export const TM_APPS = ["web", "mobile", "api"] as const;
export type TmApp = (typeof TM_APPS)[number];

export interface TmTemplate {
	/** Slug, e.g. `tmpl_banking_mobile_transfer`. This is what `template_id` expects. */
	id: string;
	/** DB uuid; only present for DB-backed platform templates. */
	template_id?: string;
	slug?: string;
	name: string;
	description?: string;
	event: string | null;
	region: string;
	industry: string;
	/** Human label for `industry` (e.g. "Fintech / PSP"). */
	industry_label?: string;
	/** Channel the Autogon function is created for. */
	app?: TmApp | (string & {});
	/** Autogon rule packs the template is built from (e.g. `core`, `aml`, `fintech`). */
	packs?: string[];
	/** Rules the template really seeds (the union of its packs). */
	rule_count?: number;
	/** The "N rules" figure the Autogon console shows on its card. */
	console_rule_count?: number;
	features: TmFeatureSelection[];
	sort_order?: number;
	/** Present on admin responses (and DB templates). */
	is_active?: boolean;
	is_platform?: boolean;
	created_at?: string;
	updated_at?: string;
}

export interface TmTemplateListData {
	count: number;
	templates: TmTemplate[];
}

export interface TmTemplateListQuery {
	event?: string;
}

export interface TmFeatureListQuery {
	group?: string;
}

/* -------------------------------------------------------------------------- */
/* Monitors                                                                   */
/* -------------------------------------------------------------------------- */

export interface TmMonitorFeature extends TmFeatureSelection {
	active: boolean;
}

export interface TmMonitorSummary {
	monitor_id: string;
	display_name: string;
	event: string;
	region: string;
	feature_count: number;
	status: TmMonitorStatus;
	is_default: boolean;
	created_at: string;
}

export interface TmMonitorListData {
	count: number;
	monitors: TmMonitorSummary[];
}

export interface TmMonitor {
	monitor_id: string;
	display_name: string;
	monitor_name: string;
	omniguard_function_name: string;
	omniguard_function_id: string | null;
	template_id: string | null;
	event: string;
	region: string;
	industry: string;
	auto_case_threshold: number | null;
	alert_threshold: number | null;
	alert_email: string | null;
	features: TmMonitorFeature[];
	data_contract: string[];
	status: TmMonitorStatus;
	is_default: boolean;
	created_at: string;
	updated_at: string;
}

export interface TmMonitorListQuery {
	status?: TmMonitorStatus;
}

export interface TmCreateMonitorPayload {
	name: string;
	template_id?: string;
	features?: Array<TmFeatureSelection & { active?: boolean }>;
	event?: string;
	region?: string;
	industry?: string;
	auto_case_threshold?: number | null;
	alert_threshold?: number | null;
	alert_email?: string;
	is_default?: boolean;
}

export interface TmUpdateMonitorPayload {
	display_name?: string;
	features?: Array<TmFeatureSelection & { active?: boolean }>;
	auto_case_threshold?: number | null;
	alert_threshold?: number | null;
	alert_email?: string;
	status?: TmMonitorStatus;
	is_default?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Scoring                                                                    */
/* -------------------------------------------------------------------------- */

export interface TmScoreReason {
	signal: string;
	contribution: number;
}

export interface TmScoreResult {
	transaction_id: string;
	monitor_id: string;
	verdict: TmVerdict;
	rule_score: number | null;
	ai_score: number | null;
	overall_score: number | null;
	reasons: TmScoreReason[];
	block: boolean;
	ctr: {
		reportable?: boolean;
		threshold?: number;
		currency?: string;
	};
	outcome: TmOutcome | null;
	scored_at: string;
	missing_optional_fields?: string[];
}

export interface TmScorePayload {
	monitor_id?: string;
	amount: number;
	currency: string;
	/** Any other fields from the monitor's data contract. */
	[field: string]: unknown;
}

export interface TmOutcomePayload {
	transaction_id: string;
	outcome: TmOutcome;
}

export interface TmOutcomeResult {
	ok: boolean;
	transaction_id: string;
	outcome: TmOutcome;
	recorded_at: string;
}

/* -------------------------------------------------------------------------- */
/* Cases & reports                                                            */
/* -------------------------------------------------------------------------- */

export interface TmCase {
	case_id: string;
	title: string;
	status: TmCaseStatus;
	priority: TmCasePriority;
	suspect_ref: string | null;
	amount_at_risk: number | null;
	monitor_id: string | null;
	transaction_ids: string[];
	assignee: string | null;
	summary: string | null;
	sla_due: string | null;
	allowed_next_statuses: TmCaseStatus[];
	created_at: string;
	updated_at: string;
}

export interface TmCaseListData {
	count: number;
	cases: TmCase[];
}

export interface TmCaseListQuery {
	status?: TmCaseStatus;
	priority?: TmCasePriority;
}

export interface TmUpdateCasePayload {
	status?: TmCaseStatus;
	priority?: TmCasePriority;
	assignee?: string;
	summary?: string;
	add_transaction_ids?: string[];
}

export interface TmReport {
	report_id: string;
	type: TmReportType;
	status: TmReportStatus;
	regulator: string | null;
	subject: string | null;
	case_id: string | null;
	transaction_id: string | null;
	narrative: string | null;
	goaml: Record<string, unknown>;
	created_at: string;
}

export interface TmCreateReportPayload {
	case_id?: string;
	transaction_id?: string;
	subject?: string;
	type?: TmReportType;
}

/* -------------------------------------------------------------------------- */
/* Admin platform templates                                                   */
/* -------------------------------------------------------------------------- */

export interface TmAdminTemplateListQuery {
	event?: string;
	/** Backend default is true for admin. */
	include_inactive?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

export const TmFeatureSelectionSchema = z.object({
	key: z.string().min(1),
	weight: z.number().min(0).max(1),
});

export type TransactionMonitoringApiErrorResponse = V2AxiosError;
