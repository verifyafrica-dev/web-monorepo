import { z } from "zod";

export type VerificationMode = "link" | "direct";

export const VERIFICATION_MODES = [
	{ value: "link" as const, label: "Link" },
	{ value: "direct" as const, label: "Direct" },
] satisfies Array<{ value: VerificationMode; label: string }>;

export const VERIFICATION_URL_LIMITS = [
	{ value: "15", label: "15 minutes" },
	{ value: "30", label: "30 minutes" },
	{ value: "60", label: "60 minutes" },
	{ value: "120", label: "120 minutes" },
	{ value: "240", label: "240 minutes" },
] as const;

export const DEFAULT_VERIFICATION_URL_LIMIT = "60";

export const verificationConsentSchema = z
	.boolean()
	.refine((value) => value, "You must confirm consent before submitting");
