import { z } from "zod";

import {
	VerificationTypeSchema,
	type VerificationStatus,
	type VerificationType,
} from "../../v1/verifications/verifications.types";

export const VerificationRequestCreateSchema = z.object({
	verification_type: VerificationTypeSchema,
	input_data: z.record(z.string(), z.unknown()),
	method_type: z.string().optional(),
	notification_email: z.string().email().optional(),
});

export type VerificationRequestCreatePayload = z.infer<
	typeof VerificationRequestCreateSchema
>;

export interface VerificationLink {
	id: string;
	link: string;
	inner_link: string;
	created_at: string;
	verification_id: string;
	verification_reference: string;
	provider: string;
	link_type?: "shufti" | "new_link" | string;
	ttl_minutes?: number | null;
	expires_at?: string | null;
	used_at?: string | null;
}

export interface VerificationRequest {
	id: string;
	verification_type: VerificationType | string;
	status: VerificationStatus | string;
	input_data: Record<string, unknown>;
	response_data: Record<string, unknown>;
	cost_charged: string;
	currency: string;
	created_at: string;
	batch_id: string | null;
	reference?: string;
	source?: string;
	link?: VerificationLink | null;
	email_sent_at?: string | null;
	submitted_at?: string | null;
}

export const VERIFICATION_TYPES_BY_PRODUCT = {
	"Government Registry Checks": [
		"za_said_verification",
		"ng_bvn_verification",
		"ng_nin_verification",
		"ng_virtual_nin_verification",
		"ng_advanced_phone_number_verification",
		"ng_phone_number_lookup",
		"ng_cac_lookup",
		"ng_passport_verification",
		"gh_passport_lookup",
		"gh_voter_card_lookup",
		"gh_ssnit_lookup",
		"gh_drivers_license_lookup",
		"ke_passport_lookup",
		"ke_national_id_lookup",
		"ke_phone_number_lookup",
		"ke_tax_pin_verification",
	],
	"Document Verification": ["id_document"],
	"Facial Screening": ["face_match"],
	"Address Verification": ["address_verification"],
	"AML Screening": ["aml_screening"],
	"Business AML Screening": ["business_aml_screening"],
	"Crypto Wallet Screening": ["crypto_wallet_screening"],
	"KYB Screening": ["kyb_screening"],
	"Risk Assessment": ["risk_assessment"],
	"Age Verification": ["age_verification"],
	"2FA Verification": ["two_fa_verification"],
	"Mixed Verification": ["mixed_verification"],
} as const satisfies Record<string, readonly VerificationType[]>;
