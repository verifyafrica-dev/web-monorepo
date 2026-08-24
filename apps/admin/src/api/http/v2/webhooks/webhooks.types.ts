import { z } from "zod";

import type {
	V2AxiosError,
	V2PaginatedSuccessResponse,
} from "#/api/http/shared";

export const WebhookEventsListQuerySchema = z.object({
	page: z.number().int().positive().optional(),
	per_page: z.number().int().positive().optional(),
	total_in_page: z.number().int().positive().optional(),
	search: z.string().optional(),
	created_from: z.string().optional(),
	created_to: z.string().optional(),
});

export type WebhookEventsListQuery = z.infer<typeof WebhookEventsListQuerySchema>;

export interface WebhookEvent {
	id: string;
	source: string;
	event_data: Record<string, unknown> | string;
	created_at: string;
	updated_at: string;
}

export type WebhookEventListResponse = V2PaginatedSuccessResponse<WebhookEvent>;

export interface PaginatedWebhookEventListResult {
	items: WebhookEvent[];
	meta: NonNullable<WebhookEventListResponse["meta"]>;
	message: string;
}

export type WebhooksApiErrorResponse = V2AxiosError;
