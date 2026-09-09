import { unwrapV2Paginated } from "@verifyafrica/api-client/http/shared";
import $http from "../../xhr";
import type {
	PaginatedWebhookEventListResult,
	WebhookEvent,
	WebhookEventsListQuery,
} from "@verifyafrica/api-client/http/v2/webhooks/webhooks.types";

const WEBHOOKS_V2_ENDPOINTS = {
	events: "/v2/webhook/events/",
} as const;

export const WEBHOOKS_V2_API = {
	ALL_LIST: async (
		params?: WebhookEventsListQuery,
	): Promise<PaginatedWebhookEventListResult> =>
		await $http
			.get(WEBHOOKS_V2_ENDPOINTS.events, { params })
			.then((res) => unwrapV2Paginated<WebhookEvent>(res)),
};
