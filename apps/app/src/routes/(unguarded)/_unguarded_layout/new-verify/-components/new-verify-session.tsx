import { useState } from "react";

import type { NewVerifySession } from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";
import { VERIFICATION_TYPES_BY_PRODUCT } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

import { AddressVerification } from "./verifications/address-verification";
import { AmlScreeningVerification } from "./verifications/aml-screening-verification";
import { BusinessAmlScreeningVerification } from "./verifications/business-aml-screening-verification";
import { FacialBiometricsVerification } from "./verifications/facial-biometrics/facial-biometrics-verification";
import { IdDocumentVerification } from "./verifications/id-document-verification";
import { KybScreeningVerification } from "./verifications/kyb-screening-verification";
import { NewVerifyChrome } from "./new-verify-chrome";
import { NewVerifyConsent } from "./new-verify-consent";

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

type NewVerifySessionViewProps = {
	session: NewVerifySession;
};

export function NewVerifySessionView({ session }: NewVerifySessionViewProps) {
	const [hasConsented, setHasConsented] = useState(false);
	const VerificationComponent =
		NEW_VERIFY_VERIFICATION_COMPONENTS[
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
