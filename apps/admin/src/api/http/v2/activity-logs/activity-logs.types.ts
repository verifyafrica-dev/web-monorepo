import { z } from "zod";

import type {
	V2AxiosError,
	V2PaginatedSuccessResponse,
} from "#/api/http/shared";

export const ActivityLogsListQuerySchema = z.object({
	page: z.number().int().positive().optional(),
	per_page: z.number().int().positive().optional(),
	total_in_page: z.number().int().positive().optional(),
	user: z.string().uuid().optional(),
});

export type ActivityLogsListQuery = z.infer<typeof ActivityLogsListQuerySchema>;

export interface ActivityLog {
	id: string;
	action: string;
	description: string;
	metadata?: Record<string, unknown>;
	ip_address?: string | null;
	user_agent?: string;
	user?: string | null;
	user_name?: string | null;
	tenant?: string | null;
	tenant_name?: string | null;
	created_at: string;
}

export type ActivityLogListResponse = V2PaginatedSuccessResponse<ActivityLog>;

export interface PaginatedActivityLogListResult {
	items: ActivityLog[];
	meta: NonNullable<ActivityLogListResponse["meta"]>;
	message: string;
}

export type ActivityLogsApiErrorResponse = V2AxiosError;
