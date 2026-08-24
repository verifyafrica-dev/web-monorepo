import { z } from "zod";

import type {
	V2AxiosError,
	V2PaginatedSuccessResponse,
	V2SuccessResponse,
} from "#/api/http/shared";

export const WalletListQuerySchema = z.object({
	page: z.number().int().positive().optional(),
	per_page: z.number().int().positive().optional(),
	total_in_page: z.number().int().positive().optional(),
	format: z.enum(["json", "json-html"]).optional(),
});

export type WalletListQuery = z.infer<typeof WalletListQuerySchema>;

export const TransactionTypeSchema = z.enum(["DEBIT", "CREDIT"]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const WalletTransactionsQuerySchema = WalletListQuerySchema.extend({
	type: z.string().optional(),
	exclude_source: z.string().optional(),
});

export type WalletTransactionsQuery = z.infer<
	typeof WalletTransactionsQuerySchema
>;

export const TopUpVerifyQuerySchema = z.object({
	session_id: z.string().min(1, { message: "Session ID is required" }),
});

export type TopUpVerifyQuery = z.infer<typeof TopUpVerifyQuerySchema>;

export const TopUpRequestSchema = z.object({
	amount: z.number().int().positive(),
	currency: z.string().max(3).optional(),
});

export type TopUpRequestPayload = z.infer<typeof TopUpRequestSchema>;

export const AdminManualCreditRequestSchema = z.object({
	amount: z.string(),
	reason: z.string().max(100),
	custom_reason: z.string().max(255).optional(),
});

export type AdminManualCreditRequestPayload = z.infer<
	typeof AdminManualCreditRequestSchema
>;

export interface Wallet {
	balance: string;
	currency: string;
}

export interface WalletTransaction {
	id: string;
	tenant: string;
	tenant_name?: string;
	tenant_email?: string;
	tenant_slug?: string;
	tenant_stripe_customer_id?: string;
	tenant_kyc_verified?: boolean;
	amount: string;
	reference: string;
	balance_before: string;
	balance_after: string;
	type: TransactionType;
	reason: string;
	metadata?: Record<string, unknown>;
	created_at: string;
}

export interface WalletFundingRequest {
	id: string;
	tenant: string;
	amount: string;
	currency: string;
	is_successful: boolean;
	stripe_session_id: string;
	created_at: string;
	updated_at: string;
}

export interface TopUpSessionData {
	checkout_url: string | null;
	session_id: string;
	client_secret: string | null;
}

export interface TopUpVerifyData {
	status: string;
	message?: string;
	amount?: string | null;
}

export interface AdminManualCreditData {
	wallet: Wallet;
	transaction: WalletTransaction;
}

export type WalletBalanceResponse = V2SuccessResponse<Wallet>;
export type WalletBalanceListResponse = V2PaginatedSuccessResponse<Wallet>;
export type WalletTransactionListResponse =
	V2PaginatedSuccessResponse<WalletTransaction>;
export type WalletFundingRequestListResponse =
	V2PaginatedSuccessResponse<WalletFundingRequest>;
export type TopUpSessionResponse = V2SuccessResponse<TopUpSessionData>;
export type TopUpVerifyResponse = V2SuccessResponse<TopUpVerifyData>;
export type AdminManualCreditResponse = V2SuccessResponse<AdminManualCreditData>;

export interface PaginatedWalletBalanceListResult {
	items: Wallet[];
	meta: NonNullable<WalletBalanceListResponse["meta"]>;
	message: string;
}

export interface PaginatedWalletTransactionListResult {
	items: WalletTransaction[];
	meta: NonNullable<WalletTransactionListResponse["meta"]>;
	message: string;
}

export interface PaginatedWalletFundingRequestListResult {
	items: WalletFundingRequest[];
	meta: NonNullable<WalletFundingRequestListResponse["meta"]>;
	message: string;
}

export type WalletApiErrorResponse = V2AxiosError;
