import type {
	VerificationRequestCreatePayload,
	VerificationType,
} from "#/api/http/v2/verifications/verifications.types";

const CRYPTO_WALLET_SCREENING_TYPE =
	"crypto_wallet_screening" satisfies VerificationType;

const CRYPTO_WALLET_FILTERS = [
	"sanction",
	"warning",
	"fitness-probity",
	"SIP",
	"SIE",
	"Insolvency",
	"pep",
	"pep-class-1",
] as const;

type CryptoWalletFormValues = {
	email: string;
	walletAddress: string;
};

export function isValidWalletAddress(walletAddress: string | null | undefined) {
	const evmWalletPattern = /^0x[a-fA-F0-9]{40}$/;
	const bitcoinWalletPattern =
		/^(bc1[p-z0-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
	const tronWalletPattern = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
	const solanaWalletPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
	const value = (walletAddress ?? "").trim();

	return (
		evmWalletPattern.test(value) ||
		bitcoinWalletPattern.test(value) ||
		tronWalletPattern.test(value) ||
		solanaWalletPattern.test(value)
	);
}

export function buildCryptoWalletScreeningPayload(
	values: CryptoWalletFormValues,
): VerificationRequestCreatePayload {
	return {
		verification_type: CRYPTO_WALLET_SCREENING_TYPE,
		method_type: "onsite",
		input_data: {
			email: values.email.trim(),
			is_crypto_request: true,
			verification_mode: "any",
			background_checks: {
				name: {
					full_name: values.walletAddress.trim(),
					match_score: 100,
				},
				filters: [...CRYPTO_WALLET_FILTERS],
				legacy_version: "",
				ongoing: "",
			},
		},
	};
}
