import type { VerificationProofs } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { isPlainObject } from "@verifyafrica/ui/lib/validators";

export type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown): UnknownRecord | null {
	return isPlainObject(value) ? (value as UnknownRecord) : null;
}

export function asUnknownArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

export function getResponsePayload(responseData: unknown): UnknownRecord {
	const record = asRecord(responseData) ?? {};
	return asRecord(record.data) ?? record;
}

export function asNonEmptyString(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

export function displayValue(value: unknown): string {
	if (value === null || value === undefined || value === "") {
		return "N/A";
	}

	if (typeof value === "string" && value.trim().length === 0) {
		return "N/A";
	}

	return String(value);
}

/**
 * Prefer `response_data.event` (Shufti/Korapay prefixed). For Korapay identity
 * results that predate event synthesis, derive from terminal status.
 */
export function resolveVerificationEvent(verification: {
	source?: string | null;
	status?: string | null;
	response_data?: { event?: unknown } | null;
}): string | undefined {
	const stored = asNonEmptyString(verification.response_data?.event);
	if (stored) {
		return stored;
	}

	const source = (verification.source ?? "").toLowerCase();
	if (source !== "kr" && source !== "korapay") {
		return undefined;
	}

	switch (verification.status) {
		case "SUCCESS":
			return "kr.verification.completed";
		case "FAILED":
		case "ERROR":
			return "kr.verification.failed";
		case "PENDING":
			return "kr.verification.pending";
		default:
			return undefined;
	}
}

export function formatHumanLabel(value: string) {
	return value
		.replaceAll("_", " ")
		.replaceAll("-", " ")
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

export function formatYesNo(value: unknown): string | undefined {
	if (value === true || value === "1" || value === "true") {
		return "Yes";
	}

	if (value === false || value === "0" || value === "false") {
		return "No";
	}

	return undefined;
}

export function formatStringList(values?: string[]) {
	if (!values?.length) {
		return undefined;
	}

	return values.map(formatHumanLabel).join(", ");
}

export const PROOF_LABELS = {
	address: "Address Proof",
	document: "Document Proof",
	face: "Face Proof",
	verification_video: "Verification Video",
	verification_report: "Verification Report",
} as const;

export type ProofDisplayKey = keyof typeof PROOF_LABELS;

export const PROOF_KINDS = {
	address: "image",
	document: "image",
	face: "image",
	verification_video: "video",
	verification_report: "file",
} as const satisfies Record<ProofDisplayKey, "image" | "video" | "file">;

const HIDDEN_PROOF_KEYS = new Set<ProofDisplayKey>(["verification_report"]);

export function getProofUrl(
	key: ProofDisplayKey,
	proofs?: VerificationProofs,
): string {
	if (!proofs) {
		return "";
	}

	if (key === "address" || key === "document" || key === "face") {
		return proofs[key]?.proof ?? "";
	}

	const value = proofs[key];
	return typeof value === "string" ? value : "";
}

export function getVisibleProofEntries(proofs?: VerificationProofs) {
	if (!proofs?.access_token) {
		return [];
	}

	return (Object.keys(PROOF_KINDS) as ProofDisplayKey[])
		.filter((key) => !HIDDEN_PROOF_KEYS.has(key))
		.map((key) => [key, getProofUrl(key, proofs)] as const)
		.filter(([, url]) => Boolean(url));
}
