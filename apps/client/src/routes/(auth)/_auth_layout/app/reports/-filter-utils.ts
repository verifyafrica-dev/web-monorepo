import { z } from "zod";

import {
	VerificationStatusSchema,
	VerificationTypeSchema,
} from "#/api/http/v1/verifications/verifications.types";
import type {
	VerificationBatchListQuery,
	VerificationListQuery,
} from "#/api/http/v2/verifications/verifications.types";

export const reportsSearchSchema = z.object({
	tab: z.enum(["individual", "batch"]).optional(),
	search: z.string().optional(),
	batch_search: z.string().optional(),
	status: z.string().optional(),
	verification_type: z.string().optional(),
	country: z.string().optional(),
	page: z.coerce.number().int().positive().optional(),
	batch_page: z.coerce.number().int().positive().optional(),
});

export type ReportsSearchParams = z.infer<typeof reportsSearchSchema>;

export type ReportsFiltersFormValues = {
	search: string;
	verificationType: string;
	status: string;
	country: string;
};

export type ReportsListFilterScope = "requests" | "batches";

type BuildReportsListQueryOptions = {
	page: number;
	perPage: number;
	scope: ReportsListFilterScope;
};

function appendOptionalString(
	query: Record<string, unknown>,
	key: string,
	value: string,
	allValue = "all",
) {
	const trimmedValue = value.trim();
	if (trimmedValue && trimmedValue !== allValue) {
		query[key] = trimmedValue;
	}
}

function omitEmptySearchParams(
	params: ReportsSearchParams,
): ReportsSearchParams {
	const next: ReportsSearchParams = {};

	if (params.tab) {
		next.tab = params.tab;
	}

	if (params.search?.trim()) {
		next.search = params.search.trim();
	}

	if (params.batch_search?.trim()) {
		next.batch_search = params.batch_search.trim();
	}

	if (params.status && params.status !== "all") {
		next.status = params.status;
	}

	if (params.verification_type && params.verification_type !== "all") {
		next.verification_type = params.verification_type;
	}

	if (params.country && params.country !== "all") {
		next.country = params.country;
	}

	if (params.page && params.page > 1) {
		next.page = params.page;
	}

	if (params.batch_page && params.batch_page > 1) {
		next.batch_page = params.batch_page;
	}

	return next;
}

export function mergeReportsSearchParams(
	current: ReportsSearchParams,
	patch: Partial<ReportsSearchParams>,
): ReportsSearchParams {
	return omitEmptySearchParams({ ...current, ...patch });
}

export function getIndividualFiltersFromSearch(
	search: ReportsSearchParams,
	searchDraft: string,
): ReportsFiltersFormValues {
	return {
		search: searchDraft,
		verificationType: search.verification_type ?? "all",
		status: search.status ?? "all",
		country: search.country ?? "all",
	};
}

export function getBatchFiltersFromSearch(
	search: ReportsSearchParams,
	searchDraft: string,
): ReportsFiltersFormValues {
	return {
		search: searchDraft,
		verificationType: "all",
		status: search.status ?? "all",
		country: "all",
	};
}

export function buildReportsListQuery(
	filters: ReportsFiltersFormValues,
	options: BuildReportsListQueryOptions,
): VerificationListQuery | VerificationBatchListQuery {
	const query: Record<string, unknown> = {
		page: options.page,
		per_page: options.perPage,
	};

	appendOptionalString(query, "search", filters.search);

	if (options.scope === "batches") {
		appendOptionalString(query, "status", filters.status);
		return query as VerificationBatchListQuery;
	}

	query.has_batch = false;
	appendOptionalString(query, "status", filters.status);
	appendOptionalString(query, "verification_type", filters.verificationType);
	appendOptionalString(query, "country", filters.country);

	return query as VerificationListQuery;
}

export const REPORTS_VERIFICATION_TYPES = VerificationTypeSchema.options;
export const REPORTS_VERIFICATION_STATUSES = VerificationStatusSchema.options;

export function formatVerificationTypeLabel(type: string) {
	return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
