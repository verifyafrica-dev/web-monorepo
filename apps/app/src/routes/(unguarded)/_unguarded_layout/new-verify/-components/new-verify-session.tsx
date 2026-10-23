import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react";
import { useState } from "react";

import type { NewVerifySession } from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";
import { VERIFICATION_TYPES_BY_PRODUCT } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { cn } from "@verifyafrica/ui/lib/utils";

import { AddressVerification } from "./verifications/address-verification";
import { AmlScreeningVerification } from "./verifications/aml-screening-verification";
import { BusinessAmlScreeningVerification } from "./verifications/business-aml-screening-verification";
import { FacialBiometricsVerification } from "./verifications/facial-biometrics/facial-biometrics-verification";
import { IdDocumentVerification } from "./verifications/id-document-verification";
import { GovernmentRegistryVerification } from "./verifications/government-registry-verification";
import { KybScreeningVerification } from "./verifications/kyb-screening-verification";
import { MixedContinueProvider } from "./mixed-continue-context";
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
	onMixedContinue?: () => void;
};

function MixedStepProgress({ session }: { session: NewVerifySession }) {
	const steps = session.mixed_session?.steps ?? [];
	if (!session.is_mixed || steps.length === 0) {
		return null;
	}

	return (
		<div className="border-b border-border px-4 py-3 md:px-6">
			<p className="mb-2 text-xs text-muted-foreground">
				Complete each step in order. You can only move forward.
			</p>
			<ol className="m-0 flex list-none flex-wrap gap-3 p-0">
				{steps.map((step) => {
					const isCurrent = step.step_id === session.current_step_id;
					const isDone = step.submitted;
					return (
						<li
							key={step.step_id}
							className={cn(
								"flex items-center gap-1.5 text-xs",
								isCurrent
									? "font-semibold text-foreground"
									: "text-muted-foreground",
							)}
						>
							{isDone ? (
								<CheckCircleIcon className="size-4 text-primary" weight="fill" />
							) : (
								<CircleIcon
									className={cn(
										"size-4",
										isCurrent ? "text-primary" : "text-muted-foreground",
									)}
									weight={isCurrent ? "fill" : "regular"}
								/>
							)}
							<span>{titleForVerificationType(step.type)}</span>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

export function NewVerifySessionView({
	session,
	onMixedContinue,
}: NewVerifySessionViewProps) {
	const [hasConsented, setHasConsented] = useState(false);
	const VerificationComponent = isGovernmentRegistrySession(session)
		? GovernmentRegistryVerification
		: NEW_VERIFY_VERIFICATION_COMPONENTS[
				session.verification_type as keyof typeof NEW_VERIFY_VERIFICATION_COMPONENTS
			];

	const steps = session.mixed_session?.steps ?? [];
	const currentIndex = steps.findIndex(
		(step) => step.step_id === session.current_step_id,
	);
	// While the submitted dialog is open, React still has the pre-advance session:
	// current step is the one just submitted; next exists if it is not the last.
	const hasNextStep =
		Boolean(session.is_mixed) &&
		currentIndex >= 0 &&
		currentIndex < steps.length - 1;

	const mixedContinueValue =
		session.is_mixed && onMixedContinue
			? {
					isMixed: true,
					hasNextStep,
					onContinue: onMixedContinue,
				}
			: null;

	return (
		<MixedContinueProvider value={mixedContinueValue}>
			<NewVerifyChrome
				token={session.token}
				contactEmail={session.email ?? ""}
				verificationTitle={titleForVerificationType(session.verification_type)}
			>
				<MixedStepProgress session={session} />
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
		</MixedContinueProvider>
	);
}
