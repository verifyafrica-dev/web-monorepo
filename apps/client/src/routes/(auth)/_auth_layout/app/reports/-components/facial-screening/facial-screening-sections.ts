import { asNonEmptyString, asRecord, formatHumanLabel } from "../../-utils";
import {
	buildProviderOutcome,
	computed,
	formatVerificationMode,
	leftoverFields,
	linkSettingsFields,
	type ProviderOutcome,
	type ReportCheck,
	SHARED_RESPONSE_KEYS,
	type SubmittedProof,
	sharedRequestFields,
	submittedProof,
	withoutEmpty,
} from "../report-builders";
import type { ReportField } from "../report-sections";

export type FacialScreeningSections = {
	submitted: ReportField[];
	outcome: ProviderOutcome;
	checks: ReportCheck[];
	checkedData: ReportField[];
	proofs: SubmittedProof[];
	additional: ReportField[];
};

const KNOWN_INPUT_KEYS = new Set([
	"email",
	"country",
	"language",
	"mode",
	"face",
	"ttl",
	"send_email",
	"allow_file_upload",
	"method_type",
	"collect",
	"reference",
	"callback_url",
	"redirect_url",
]);

const KNOWN_INPUT_FACE_KEYS = new Set([
	"proof",
	"verification_mode",
	"check_duplicate_request",
	"age",
	"allow_offline",
	"allow_online",
]);

const KNOWN_CHECKED_KEYS = new Set(["age", "duplicate_account_detected"]);

function formatAgeRange(value: unknown) {
	const age = asRecord(value);
	if (!age) return typeof value === "number" ? `${value}+` : undefined;
	const min = asNonEmptyString(String(age.min ?? ""));
	const max = asNonEmptyString(String(age.max ?? ""));
	if (min && max) return `${min} – ${max} years`;
	if (min) return `${min} years or older`;
	if (max) return `Up to ${max} years`;
	return undefined;
}

export function buildFacialScreeningSections({
	inputData,
	responseData,
}: {
	inputData: unknown;
	responseData: unknown;
}): FacialScreeningSections {
	const input = asRecord(inputData) ?? {};
	const inputFace = asRecord(input.face) ?? {};
	const response = asRecord(responseData) ?? {};
	const checked = asRecord(asRecord(response.verification_data)?.face) ?? {};
	const rawResult = asRecord(response.verification_result)?.face;
	const results = asRecord(rawResult) ?? { face: rawResult };

	const submitted = [
		...sharedRequestFields(input),
		computed(
			"verification_mode",
			"Verification Mode",
			formatVerificationMode(inputFace.verification_mode),
		),
		computed(
			"check_duplicate_request",
			"Duplicate Account Check",
			inputFace.check_duplicate_request,
			{ format: "yesNo" },
		),
		computed("age", "Required Age Range", formatAgeRange(inputFace.age)),
	];

	const duplicateDetected = checked.duplicate_account_detected;
	const checks: ReportCheck[] = [
		{ key: "face", label: "Face Verification", value: results.face },
		...Object.entries(results)
			.filter(([key]) => key !== "face")
			.map(([key, value]) => ({
				key,
				label: key === "age" ? "Age Check" : `${formatHumanLabel(key)} Check`,
				value,
			})),
		...(duplicateDetected === undefined || duplicateDetected === null
			? []
			: [
					{
						key: "duplicate",
						label: "No Duplicate Account",
						value:
							duplicateDetected === true || duplicateDetected === 1 ? 0 : 1,
					},
				]),
	];

	const checkedData = [
		computed("age", "Estimated Age", checked.age),
		computed(
			"duplicate_account_detected",
			"Duplicate Account Detected",
			duplicateDetected,
			{ format: "yesNo" },
		),
		...leftoverFields(checked, KNOWN_CHECKED_KEYS, "verification_data"),
	];

	const outcome = buildProviderOutcome(response);
	const additional = [
		...linkSettingsFields(input, inputFace),
		computed(
			"provider_customer_id",
			"Provider Customer ID",
			outcome.providerCustomerId,
			{ mono: true },
		),
		...leftoverFields(input, KNOWN_INPUT_KEYS, "input"),
		...leftoverFields(inputFace, KNOWN_INPUT_FACE_KEYS, "input.face"),
		...leftoverFields(response, new Set(SHARED_RESPONSE_KEYS), "response"),
	];

	return {
		submitted: withoutEmpty(submitted),
		outcome,
		checks,
		checkedData: withoutEmpty(checkedData),
		proofs: submittedProof("face_proof", "Face Capture", inputFace.proof),
		additional: withoutEmpty(additional),
	};
}
