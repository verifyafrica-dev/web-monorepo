import type { VerificationRequestCreatePayload } from "#/api/http/v2/verifications/verifications.types";
import type { VerificationType } from "#/api/http/v2/verifications/verifications.types";
import { SHUFTI_CHOICES } from "#/lib/constants";

const FACIAL_VERIFICATION_TYPE = "face_match" satisfies VerificationType;

import type { FaceVerificationMode } from "./-data";

type LinkFormValues = {
	email: string;
	faceVerificationMode: FaceVerificationMode;
	urlLimit: string;
};

type DirectFormValues = {
	email: string;
};

function mapFaceVerificationMode(mode: FaceVerificationMode) {
	if (mode === "image") {
		return "image_only";
	}

	if (mode === "video") {
		return "video_only";
	}

	return "any";
}

function buildFaceBlock(options?: { proof?: string; verificationMode?: string }) {
	const face: Record<string, unknown> = {
		verification_mode: options?.verificationMode ?? "any",
		allow_offline: SHUFTI_CHOICES.NO,
		allow_online: SHUFTI_CHOICES.YES,
		check_duplicate_request: SHUFTI_CHOICES.NO,
	};

	if (options?.proof) {
		face.proof = options.proof;
	}

	return face;
}

export function buildFacialScreeningLinkPayload(
	values: LinkFormValues,
): VerificationRequestCreatePayload {
	return {
		verification_type: FACIAL_VERIFICATION_TYPE,
		method_type: "onsite",
		input_data: {
			language: "EN",
			email: values.email.trim(),
			ttl: Number(values.urlLimit),
			face: buildFaceBlock({
				verificationMode: mapFaceVerificationMode(values.faceVerificationMode),
			}),
		},
	};
}

export function buildFacialScreeningDirectPayload(
	values: DirectFormValues,
	proof: string,
): VerificationRequestCreatePayload {
	return {
		verification_type: FACIAL_VERIFICATION_TYPE,
		method_type: "offsite",
		input_data: {
			language: "EN",
			email: values.email.trim(),
			face: buildFaceBlock({ proof, verificationMode: "any" }),
		},
	};
}
