import type { WebhookEventsListQuery } from "#/api/http/v2/webhooks/webhooks.types";
import type { WebhookEvent } from "#/api/http/v2/webhooks/webhooks.types";
import { env } from "#/config/env";
import { formatTenantDate } from "../tenants/-data";

export const WEBHOOK_EVENTS_PAGE_SIZE = 20;

export type WebhookEventsListFilters = {
	page: number;
	perPage: number;
	search: string;
	dateFrom: string;
	dateTo: string;
};

export function getWebhookEndpointUrls() {
	const apiBaseUrl = env.apiBaseUrl.replace(/\/$/, "");
	return {
		stripe: `${apiBaseUrl}/v2/webhook/stripe/`,
		shufti: `${apiBaseUrl}/v2/webhook/shufti/`,
	};
}

export function buildWebhookEventsListQuery({
	page,
	perPage,
	search,
	dateFrom,
	dateTo,
}: WebhookEventsListFilters): WebhookEventsListQuery {
	return {
		page,
		per_page: perPage,
		...(search.trim() ? { search: search.trim() } : {}),
		...(dateFrom ? { created_from: dateFrom } : {}),
		...(dateTo ? { created_to: dateTo } : {}),
	};
}

export function hasActiveWebhookFilters(filters: {
	search: string;
	dateFrom: string;
	dateTo: string;
}) {
	return (
		filters.search.trim().length > 0 ||
		Boolean(filters.dateFrom) ||
		Boolean(filters.dateTo)
	);
}

export function formatWebhookEventDate(value: string) {
	return formatTenantDate(value);
}

export function parseWebhookEventData(
	eventData: WebhookEvent["event_data"],
): unknown {
	if (typeof eventData === "string") {
		try {
			return JSON.parse(eventData);
		} catch {
			return eventData;
		}
	}

	return eventData;
}

export function formatWebhookEventData(event: WebhookEvent) {
	return JSON.stringify(parseWebhookEventData(event.event_data), null, 2);
}

export function getWebhookSourceBadgeClass(source: string) {
	const normalizedSource = source.toLowerCase();

	if (normalizedSource.includes("stripe")) {
		return "border-violet-200 bg-violet-50 text-violet-700";
	}

	if (normalizedSource.includes("shufti")) {
		return "border-blue-200 bg-blue-50 text-blue-700";
	}

	if (normalizedSource.includes("korapay")) {
		return "border-emerald-200 bg-emerald-50 text-emerald-700";
	}

	return "border-muted bg-muted text-foreground";
}
