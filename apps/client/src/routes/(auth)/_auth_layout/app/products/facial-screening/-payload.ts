import type { VerificationRequestCreatePayload } from "#/api/http/v2/verifications/verifications.types";
import type { VerificationType } from "#/api/http/v2/verifications/verifications.types";
import { SHUFTI_CHOICES } from "@verifyafrica/ui/lib/constants";

import type { FaceVerificationMode } from "./-data";

const FACIAL_VERIFICATION_TYPE = "face_match" satisfies VerificationType;

type LinkFormValues = {
	email: string;
	faceVerificationMode: FaceVerificationMode;
	urlLimit: string;
	checkForDuplicates: boolean;
	ageMin: string;
	ageMax: string;
	verificationInstructions: string;
};

type DirectFormValues = {
	email: string;
};

function mapFaceVerificationMode(mode: FaceVerificationMode) {
	return mode === "video" ? "video_only" : "image_only";
}

function optionalFaceAge(ageMin: string, ageMax: string) {
	const min = ageMin.trim();
	const max = ageMax.trim();

	if (!min && !max) {
		return undefined;
	}

	return { min, max };
}

function buildFaceBlock(options: {
	proof?: string;
	verificationMode: string;
	checkForDuplicates?: boolean;
	ageMin?: string;
	ageMax?: string;
}) {
	const face: {
		verification_mode: string;
		allow_offline: string;
		allow_online: string;
		check_duplicate_request: string;
		proof?: string;
		age?: { min: string; max: string };
	} = {
		verification_mode: options.verificationMode,
		allow_offline: SHUFTI_CHOICES.NO,
		allow_online: SHUFTI_CHOICES.YES,
		check_duplicate_request: options.checkForDuplicates
			? SHUFTI_CHOICES.YES
			: SHUFTI_CHOICES.NO,
	};

	if (options.proof) {
		face.proof = options.proof;
	}

	const age = optionalFaceAge(options.ageMin ?? "", options.ageMax ?? "");
	if (age) {
		face.age = age;
	}

	return face;
}

export function buildFacialScreeningLinkPayload(
	values: LinkFormValues,
): VerificationRequestCreatePayload {
	return {
		verification_type: FACIAL_VERIFICATION_TYPE,
		method_type: "new_link",
		input_data: {
			language: "EN",
			email: values.email.trim(),
			ttl: Number(values.urlLimit),
			collect: {
				verification_instructions: values.verificationInstructions.trim(),
			},
			face: buildFaceBlock({
				verificationMode: mapFaceVerificationMode(values.faceVerificationMode),
				checkForDuplicates: values.checkForDuplicates,
				ageMin: values.ageMin,
				ageMax: values.ageMax,
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
			face: buildFaceBlock({
				proof,
				verificationMode: "image_only",
			}),
		},
	};
}
