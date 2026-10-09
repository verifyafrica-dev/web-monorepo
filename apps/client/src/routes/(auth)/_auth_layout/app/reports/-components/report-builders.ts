import { getCountryName } from "@verifyafrica/ui/lib/country-state-city";

import {
	asNonEmptyString,
	asRecord,
	asUnknownArray,
	formatHumanLabel,
	formatLanguageName,
	type UnknownRecord,
} from "../-utils";
import { isEmptyReportValue, type ReportField } from "./report-sections";

export type ProofKind = "image" | "pdf" | "video" | "file";

export type SubmittedProof = {
	key: string;
	label: string;
	src: string;
	kind: ProofKind;
};

export type ReportCheck = {
	key: string;
	label: string;
	value: unknown;
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
	passport: "Passport",
	id_card: "ID Card",
	driving_license: "Driving License",
	credit_or_debit_card: "Credit or Debit Card",
	cpr_smart_card_reader_copy: "CPR Smart Card Reader Copy",
};

const VERIFICATION_MODE_LABELS: Record<string, string> = {
	any: "Image or Video",
	image_only: "Image Only",
	video_only: "Video Only",
};

const PROOF_EXTENSION_KINDS: Record<string, ProofKind> = {
	jpg: "image",
	jpeg: "image",
	png: "image",
	webp: "image",
	gif: "image",
	heic: "image",
	pdf: "pdf",
	mp4: "video",
	mov: "video",
	webm: "video",
};

export function computed(
	key: string,
	label: string,
	value: unknown,
	options: Omit<ReportField, "key" | "label" | "value"> = {},
): ReportField {
	return { key, label, value, ...options };
}

export function withoutEmpty(fields: ReportField[]) {
	return fields.filter((entry) => !isEmptyReportValue(entry.value));
}

export function asStringArray(value: unknown): string[] {
	return asUnknownArray(value)
		.map((item) => String(item ?? "").trim())
		.filter((item) => item.length > 0);
}

export function formatCountry(value: unknown) {
	const raw = asNonEmptyString(value);
	if (!raw) return undefined;
	return getCountryName(raw) || formatHumanLabel(raw);
}

export function formatDocumentType(value: unknown): string | undefined {
	const raw = asNonEmptyString(value);
	if (!raw) return undefined;
	return DOCUMENT_TYPE_LABELS[raw.toLowerCase()] ?? formatHumanLabel(raw);
}

export function formatVerificationMode(value: unknown) {
	const raw = asNonEmptyString(value);
	if (!raw) return undefined;
	return VERIFICATION_MODE_LABELS[raw.toLowerCase()] ?? formatHumanLabel(raw);
}

/** Shufti check results are 1 / 0 / null; anything else is not a decided check. */
export function toCheckResult(value: unknown): boolean | undefined {
	if (value === 1 || value === "1" || value === true) return true;
	if (value === 0 || value === "0" || value === false) return false;
	return undefined;
}

export function proofKind(src: string): ProofKind {
	const lower = src.toLowerCase();
	if (lower.startsWith("data:")) {
		const mime = lower.slice(5, lower.search(/[;,]/));
		if (mime.startsWith("image/")) return "image";
		if (mime.startsWith("video/")) return "video";
		if (mime === "application/pdf") return "pdf";
		return "file";
	}

	try {
		const extension = new URL(src).pathname.split(".").pop() ?? "";
		return PROOF_EXTENSION_KINDS[extension.toLowerCase()] ?? "file";
	} catch {
		return "file";
	}
}

export function asProofSource(value: unknown) {
	const raw = asNonEmptyString(value);
	if (!raw) return undefined;
	const lower = raw.toLowerCase();
	return lower.startsWith("https://") ||
		lower.startsWith("http://") ||
		lower.startsWith("data:")
		? raw
		: undefined;
}

export function submittedProof(
	key: string,
	label: string,
	value: unknown,
): SubmittedProof[] {
	const src = asProofSource(value);
	return src ? [{ key, label, src, kind: proofKind(src) }] : [];
}

export function isPrimitive(value: unknown) {
	return (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	);
}

/** Surface fields we have no explicit mapping for, flattening one level of nesting. */
export function leftoverFields(
	source: UnknownRecord,
	knownKeys: Set<string>,
	keyPrefix: string,
	{
		labels = {},
		labelPrefix,
	}: { labels?: Record<string, string>; labelPrefix?: string } = {},
): ReportField[] {
	return Object.entries(source).flatMap(([key, value]): ReportField[] => {
		if (knownKeys.has(key) || isEmptyReportValue(value)) return [];
		const baseLabel = labels[key] ?? formatHumanLabel(key);
		const label = labelPrefix ? `${labelPrefix} · ${baseLabel}` : baseLabel;

		if (isPrimitive(value)) {
			return [
				computed(`${keyPrefix}.${key}`, label, value, {
					format: typeof value === "boolean" ? "yesNo" : "text",
				}),
			];
		}

		if (Array.isArray(value)) {
			const items = value.filter(isPrimitive);
			return items.length > 0
				? [computed(`${keyPrefix}.${key}`, label, items)]
				: [];
		}

		const nested = asRecord(value);
		if (!nested) return [];
		return Object.entries(nested).flatMap(([childKey, childValue]) =>
			isPrimitive(childValue) && !isEmptyReportValue(childValue)
				? [
						computed(
							`${keyPrefix}.${key}.${childKey}`,
							`${label} · ${formatHumanLabel(childKey)}`,
							childValue,
							{ format: typeof childValue === "boolean" ? "yesNo" : "text" },
						),
					]
				: [],
		);
	});
}

/** Fields every hosted/direct Shufti request shares. */
export function sharedRequestFields(input: UnknownRecord): ReportField[] {
	return [
		computed("email", "Email", input.email),
		computed("country", "Country", formatCountry(input.country)),
		computed("language", "Language", formatLanguageName(input.language)),
		computed(
			"mode",
			"Request Mode",
			input.mode === "direct"
				? "Direct (submitted by API)"
				: input.mode === "link"
					? "Hosted Link"
					: undefined,
		),
	];
}

/** Link-mode delivery settings that belong under "Additional Details". */
export function linkSettingsFields(
	input: UnknownRecord,
	section: UnknownRecord = {},
): ReportField[] {
	const ttl = Number(input.ttl);
	return [
		computed(
			"ttl",
			"Link Expiry",
			Number.isFinite(ttl) && ttl > 0 ? `${ttl} minutes` : undefined,
		),
		computed("send_email", "Link Emailed to Customer", input.send_email, {
			format: "yesNo",
		}),
		computed(
			"allow_file_upload",
			"File Upload Allowed",
			input.allow_file_upload ?? section.allow_offline,
			{ format: "yesNo" },
		),
		computed(
			"allow_online",
			"Live Camera Capture Allowed",
			section.allow_online,
			{ format: "yesNo" },
		),
	];
}

export type ProviderOutcome = {
	declinedReason?: string;
	declinedCodes: string[];
	errorMessage?: string;
	providerCustomerId?: string;
};

/** Unwraps messages the backend stored as a Python list repr, e.g. "['Message.']". */
function formatErrorMessage(value: unknown) {
	const message = asNonEmptyString(value);
	if (!message) return undefined;
	const items = [
		...message.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g),
	];
	const isListRepr = message.startsWith("[") && message.endsWith("]");
	return isListRepr && items.length > 0
		? items.map((item) => item[1] ?? item[2]).join(" ")
		: message;
}

export function buildProviderOutcome(response: UnknownRecord): ProviderOutcome {
	const error = asRecord(response.error);
	return {
		declinedReason: asNonEmptyString(response.declined_reason),
		declinedCodes: asStringArray(response.declined_codes),
		errorMessage:
			formatErrorMessage(error?.message) ??
			formatErrorMessage(response.internal_error_message) ??
			(response.status === "ERROR"
				? formatErrorMessage(response.message)
				: undefined),
		providerCustomerId: asNonEmptyString(response.customer_unique_id),
	};
}

/** Response keys rendered elsewhere on the page (overview card, info section, proofs). */
export const SHARED_RESPONSE_KEYS = [
	"event",
	"status",
	"reference",
	"email",
	"country",
	"info",
	"proofs",
	"declined_reason",
	"declined_codes",
	"services_declined_codes",
	"verification_result",
	"verification_data",
	"additional_data",
	"customer_unique_id",
	"error",
	"message",
	"internal_error_message",
	"internal_error_provider",
	"verification_url",
	"redirect_url",
];
