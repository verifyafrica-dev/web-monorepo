import type {
	MixedVerificationSession,
	VerificationLink,
	VerificationRequest,
} from "../http/v2/verifications/verifications.types";
import {
	buildHostedVerificationUrl as buildHostedVerificationUrlFromDomains,
	buildNewVerifyUrl as buildNewVerifyUrlFromDomains,
} from "@verifyafrica/config/domains";

export type HostedLinkResult = {
	verificationUrl: string;
	customerEmail: string;
	expirationTime?: string;
	hostedLink: VerificationLink | null;
};

export function buildHostedVerificationPath(linkToken: string) {
	return `/verify/${linkToken}`;
}

export function buildNewVerifyPath(linkToken: string) {
	return `/new-verify/${linkToken}`;
}

export function buildHostedVerificationUrl(linkToken: string) {
	return buildHostedVerificationUrlFromDomains(linkToken);
}

export function buildNewVerifyUrl(linkToken: string) {
	return buildNewVerifyUrlFromDomains(linkToken);
}

export function extractHostedVerificationUrl(
	verification: VerificationRequest | null | undefined,
) {
	const linkToken = verification?.link?.link;
	if (linkToken) {
		if (verification?.link?.link_type === "verify_link") {
			return buildNewVerifyUrl(linkToken);
		}

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

export function buildMixedSessionLinkResult(
	session: MixedVerificationSession | null | undefined,
	customerEmail: string,
): HostedLinkResult {
	const linkToken = session?.link ?? null;
	const verificationUrl =
		session?.verification_url ||
		(linkToken ? buildNewVerifyUrl(linkToken) : "");

	return {
		verificationUrl,
		customerEmail,
		hostedLink: linkToken
			? {
					id: session?.session_id ?? "",
					link: linkToken,
					link_type: "verify_link",
					verification_id: session?.session_id ?? "",
					inner_link: "",
					verification_reference: session?.reference ?? "",
					provider: "sf",
					ttl_minutes: null,
					expires_at: null,
					used_at: null,
					created_at: session?.created_at ?? "",
				}
			: null,
	};
}
