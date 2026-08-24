import type { VerificationProofs } from "#/api/http/v2/verifications/verifications.types";
import { isPlainObject } from "#/lib/validators";

export type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown): UnknownRecord | null {
	return isPlainObject(value) ? (value as UnknownRecord) : null;
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
