import {
	VERIFICATION_TYPES_BY_PRODUCT,
	type VerificationRequestDetail,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

import { buildAddressVerificationSections } from "./address-verification/address-verification-sections";
import { buildAmlScreeningSections } from "./aml-screening/aml-sections";
import { getSubmittedDocumentProofs } from "./document-verification/document-verification-sections";
import { buildFacialScreeningSections } from "./facial-screening/facial-screening-sections";
import type { SubmittedProof } from "./report-builders";

function isProduct(
	product: keyof typeof VERIFICATION_TYPES_BY_PRODUCT,
	verificationType: string,
) {
	return (VERIFICATION_TYPES_BY_PRODUCT[product] as readonly string[]).includes(
		verificationType,
	);
}

/** Proofs we submitted ourselves, which replace the provider's copies in reports. */
export function getVerificationSubmittedProofs(
	verification: VerificationRequestDetail,
): SubmittedProof[] {
	const type = verification.verification_type;
	const sources = {
		inputData: verification.input_data,
		responseData: verification.response_data,
	};

	if (
		isProduct("Document Verification", type) ||
		type === "document_verification"
	) {
		return getSubmittedDocumentProofs(verification.input_data);
	}
	if (isProduct("Address Verification", type)) {
		return buildAddressVerificationSections(sources).proofs;
	}
	if (isProduct("Facial Screening", type) || type === "facial_screening") {
		return buildFacialScreeningSections(sources).proofs;
	}
	if (isProduct("AML Screening", type)) {
		return buildAmlScreeningSections({ ...sources, subject: "individual" })
			.proofs;
	}
	if (isProduct("Business AML Screening", type)) {
		return buildAmlScreeningSections({ ...sources, subject: "business" })
			.proofs;
	}
	return [];
}
