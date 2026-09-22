import { useState } from "react";

import type { NewVerifySession } from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";
import { VERIFICATION_TYPES_BY_PRODUCT } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

import { AddressVerification } from "./verifications/address-verification";
import { AmlScreeningVerification } from "./verifications/aml-screening-verification";
import { BusinessAmlScreeningVerification } from "./verifications/business-aml-screening-verification";
import { FacialBiometricsVerification } from "./verifications/facial-biometrics/facial-biometrics-verification";
import { IdDocumentVerification } from "./verifications/id-document-verification";
import { GovernmentRegistryVerification } from "./verifications/government-registry-verification";
import { KybScreeningVerification } from "./verifications/kyb-screening-verification";
import { NewVerifyChrome } from "./new-verify-chrome";
import { NewVerifyConsent } from "./new-verify-consent";

const GOVERNMENT_REGISTRY_TYPES = new Set<string>(
	VERIFICATION_TYPES_BY_PRODUCT["Government Registry Checks"],
);

const NEW_VERIFY_VERIFICATION_COMPONENTS = {
	id_document: IdDocumentVerification,
	address_verification: AddressVerification,
	face_match: FacialBiometricsVerification,
	aml_screening: AmlScreeningVerification,
	business_aml_screening: BusinessAmlScreeningVerification,
	kyb_screening: KybScreeningVerification,
} as const;

function titleForVerificationType(verificationType: string) {
	for (const [title, types] of Object.entries(VERIFICATION_TYPES_BY_PRODUCT)) {
		if ((types as readonly string[]).includes(verificationType)) {
			return title;
		}
	}

	return verificationType.replaceAll("_", " ");
}

function isGovernmentRegistrySession(session: NewVerifySession) {
	return (
		Boolean(session.registry_fields) ||
		GOVERNMENT_REGISTRY_TYPES.has(session.verification_type)
	);
}

type NewVerifySessionViewProps = {
	session: NewVerifySession;
};

export function NewVerifySessionView({ session }: NewVerifySessionViewProps) {
	const [hasConsented, setHasConsented] = useState(false);
	const VerificationComponent = isGovernmentRegistrySession(session)
		? GovernmentRegistryVerification
		: NEW_VERIFY_VERIFICATION_COMPONENTS[
				session.verification_type as keyof typeof NEW_VERIFY_VERIFICATION_COMPONENTS
			];

	return (
		<NewVerifyChrome
			token={session.token}
			contactEmail={session.email ?? ""}
			verificationTitle={titleForVerificationType(session.verification_type)}
		>
			<NewVerifyConsent onConsented={() => setHasConsented(true)} />
			{hasConsented ? (
				VerificationComponent ? (
					<VerificationComponent session={session} />
				) : (
					<div className="flex flex-1 items-center justify-center px-6 text-center">
						<p className="text-sm text-muted-foreground">
							This verification type is not available on this link yet.
						</p>
					</div>
				)
			) : (
				<div className="flex-1" />
			)}
		</NewVerifyChrome>
	);
}
