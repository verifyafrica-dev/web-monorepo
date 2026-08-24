import type { VerificationLink, VerificationRequest } from "#/api/http/v2/verifications/verifications.types";

export type HostedLinkResult = {
	verificationUrl: string;
	customerEmail: string;
	expirationTime?: string;
	hostedLink: VerificationLink | null;
};

export function buildHostedVerificationPath(linkToken: string) {
	return `/verify/${linkToken}`;
}

export function buildHostedVerificationUrl(linkToken: string) {
	return `${window.location.origin}${buildHostedVerificationPath(linkToken)}`;
}

export function extractHostedVerificationUrl(
	verification: VerificationRequest | null | undefined,
) {
	const linkToken = verification?.link?.link;
	if (linkToken) {
		return buildHostedVerificationUrl(linkToken);
	}

	const responseData = verification?.response_data as
		| { verification_url?: string }
		| undefined;

	return responseData?.verification_url ?? "";
}

export function buildLinkResult(
	verification: VerificationRequest | null | undefined,
	customerEmail: string,
	ttlMinutes?: number,
): HostedLinkResult {
	return {
		verificationUrl: extractHostedVerificationUrl(verification),
		customerEmail,
		expirationTime:
			typeof ttlMinutes === "number"
				? new Date(Date.now() + ttlMinutes * 60 * 1000).toLocaleString(
						"en-GB",
						{
							dateStyle: "medium",
							timeStyle: "short",
						},
					)
				: undefined,
		hostedLink: verification?.link ?? null,
	};
}
