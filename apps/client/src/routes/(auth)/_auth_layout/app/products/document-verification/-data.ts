import type { VerificationRequestCreatePayload } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import type { VerificationType } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import {
	SHUFTI_CHOICES,
	type ShuftiDocumentSupportedType,
} from "@verifyafrica/ui/lib/constants";

const DOCUMENT_VERIFICATION_TYPE = "id_document" satisfies VerificationType;

type LinkFormValues = {
	email: string;
	urlLimit: string;
	documentTypes: ShuftiDocumentSupportedType[];
	dob: boolean;
	age: boolean;
	gender: boolean;
	backsideProofRequired: boolean;
	verificationInstructions: string;
};

type DirectFormValues = {
	email: string;
	country: string;
	documentType: ShuftiDocumentSupportedType;
	firstName: string;
	lastName: string;
	dob: string;
	age: string;
	gender: string;
	requireBackside: boolean;
};

function buildDocumentBlock(direct?: {
	firstName: string;
	lastName: string;
	proof: string;
	documentType: ShuftiDocumentSupportedType;
	dob?: string;
	age?: string;
	gender?: string;
	backsideProof?: string | null;
	requireBackside?: boolean;
}) {
	const document: Record<string, unknown> = {
		backside_proof_required: SHUFTI_CHOICES.NO,
		allow_online: SHUFTI_CHOICES.YES,
		allow_offline: SHUFTI_CHOICES.YES,
		verification_mode: SHUFTI_CHOICES.ANY,
		fetch_enhanced_data: SHUFTI_CHOICES.YES,
	};

	if (direct) {
		document.name = {
			first_name: direct.firstName,
			last_name: direct.lastName,
			fuzzy_match: SHUFTI_CHOICES.YES,
		};
		document.proof = direct.proof;
		document.supported_types = [direct.documentType];
		if (direct.requireBackside) {
			document.backside_proof_required = SHUFTI_CHOICES.YES;
			if (direct.backsideProof) {
				document.additional_proof = direct.backsideProof;
			}
		}
		if (direct.dob) {
			document.dob = direct.dob;
		}
		if (direct.age) {
			document.age = direct.age;
		}
		if (direct.gender) {
			document.gender = direct.gender;
		}
	}

	return document;
}

export function buildDocumentVerificationLinkPayload(
	values: LinkFormValues,
): VerificationRequestCreatePayload {
	const document = {
		...buildDocumentBlock(),
		backside_proof_required: values.backsideProofRequired
			? SHUFTI_CHOICES.YES
			: SHUFTI_CHOICES.NO,
	} as Record<string, unknown>;

	// Empty selection = all types allowed (backend expands).
	if (values.documentTypes.length > 0) {
		document.supported_types = values.documentTypes;
	}

	return {
		verification_type: DOCUMENT_VERIFICATION_TYPE,
		method_type: "verify_link",
		input_data: {
			language: "EN",
			email: values.email.trim(),
			ttl: Number(values.urlLimit),
			document,
			collect: {
				dob: values.dob,
				age: values.age,
				gender: values.gender,
				backside_proof_required: values.backsideProofRequired,
				verification_instructions: values.verificationInstructions.trim(),
			},
		},
	};
}

export function buildDocumentVerificationDirectPayload(
	values: DirectFormValues,
	proof: string,
	backsideProof?: string | null,
): VerificationRequestCreatePayload {
	return {
		verification_type: DOCUMENT_VERIFICATION_TYPE,
		method_type: "offsite",
		input_data: {
			country: values.country.trim().toUpperCase(),
			language: "EN",
			email: values.email.trim(),
			document: buildDocumentBlock({
				firstName: values.firstName.trim(),
				lastName: values.lastName.trim(),
				proof,
				documentType: values.documentType,
				dob: values.dob.trim() || undefined,
				age: values.age.trim() || undefined,
				gender: values.gender.trim() || undefined,
				backsideProof,
				requireBackside: values.requireBackside,
			}),
		},
	};
}
