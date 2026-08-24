import { z } from "zod";

import type { PaginatedResponse } from "../tenants/tenants.types";

export const WalletPaginationQuerySchema = z.object({
	offset: z.number().int().nonnegative().optional(),
	page_size: z.number().int().positive().optional(),
	format: z.enum(["json", "json-html"]).optional(),
});

export type WalletPaginationQuery = z.infer<typeof WalletPaginationQuerySchema>;

export const WalletTransactionsQuerySchema =
	WalletPaginationQuerySchema.extend({
		from_date: z.string().optional(),
		to_date: z.string().optional(),
		tenant_id: z.string().optional(),
	});

export type WalletTransactionsQuery = z.infer<
	typeof WalletTransactionsQuerySchema
>;

export const WalletTenantQuerySchema = z.object({
	tenant_id: z.string(),
});

export type WalletTenantQuery = z.infer<typeof WalletTenantQuerySchema>;

export interface Wallet {
	balance: string;
	currency?: string;
	tenant?: string;
	[key: string]: unknown;
}

export interface WalletTransaction {
	id: string;
	type: "CREDIT" | "DEBIT" | string;
	amount: string;
	reference: string;
	reason: string;
	balance_before: string;
	balance_after: string;
	created_at: string;
	updated_at?: string;
	[key: string]: unknown;
}

export interface WalletFundingRequest {
	id: string;
	amount: string;
	currency?: string;
	status?: string;
	reason?: string;
	tenant?: string;
	created_at: string;
	updated_at?: string;
	[key: string]: unknown;
}

export interface WalletTopUpCreateSessionPayload {
	amount: number;
	currency?: string;
	success_url?: string;
	cancel_url?: string;
	metadata?: Record<string, unknown>;
}

export interface WalletTopUpCreateSessionResponse {
	session_id?: string;
	client_secret?: string;
	url?: string;
	[key: string]: unknown;
}

export interface WalletTopUpVerifyResponse {
	detail?: string;
	[key: string]: unknown;
}

export interface WalletAdminCreditsPayload {
	amount: number;
	reason: string;
	metadata?: Record<string, unknown>;
}

export interface WalletAdminCreditsResponse {
	detail?: string;
	wallet?: Wallet;
	[key: string]: unknown;
}

export type WalletTransactionsListResponse =
	PaginatedResponse<WalletTransaction>;
export type WalletFundingRequestsListResponse =
	PaginatedResponse<WalletFundingRequest>;
