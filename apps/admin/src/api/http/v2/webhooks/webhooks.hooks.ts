import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { WEBHOOKS_V2_API } from "./webhooks.api";
import type {
	PaginatedWebhookEventListResult,
	WebhookEvent,
	WebhookEventsListQuery,
} from "./webhooks.types";

const WEBHOOKS_V2_STALE_TIME = 60_000;

export const WEBHOOKS_V2_QUERY_KEYS = {
	all: ["webhooks-v2"] as const,
	allList: (params?: WebhookEventsListQuery) =>
		["webhooks-v2", "events", params ?? {}] as const,
} as const;

export const useAllWebhookEventsV2Query = (
	params?: WebhookEventsListQuery,
	enabled = true,
): UseQueryResult<PaginatedWebhookEventListResult> =>
	useQuery<PaginatedWebhookEventListResult>({
		queryKey: WEBHOOKS_V2_QUERY_KEYS.allList(params),
		queryFn: () => WEBHOOKS_V2_API.ALL_LIST(params),
		enabled,
		staleTime: WEBHOOKS_V2_STALE_TIME,
	});

export type { PaginatedWebhookEventListResult, WebhookEvent };
