import { z } from "zod";

export const VerificationStatusSchema = z.enum([
	"SUCCESS",
	"FAILED",
	"PENDING",
	"ABANDONED",
	"ERROR",
	"PARTIAL",
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const VerificationTypeSchema = z.enum([
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
	"id_document",
	"face_match",
	"address_verification",
	"aml_screening",
	"business_aml_screening",
	"crypto_wallet_screening",
	"kyb_screening",
	"risk_assessment",
	"age_verification",
	"two_fa_verification",
	"mixed_verification",
]);
export type VerificationType = z.infer<typeof VerificationTypeSchema>;
