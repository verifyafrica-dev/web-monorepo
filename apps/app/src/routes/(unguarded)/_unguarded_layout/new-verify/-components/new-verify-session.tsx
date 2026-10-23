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

function shortLabelForVerificationType(verificationType: string) {
	const title = titleForVerificationType(verificationType);
	if (title.length <= 18) {
		return title;
	}
	return title.split(" ")[0] ?? title;
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

	const completedCount = steps.filter((step) => step.submitted).length;

	return (
		<div className="border-b border-border px-4 py-4 md:px-6">
			<p className="mb-3 text-xs text-muted-foreground">
				Step {Math.min(completedCount + 1, steps.length)} of {steps.length}
			</p>
			<ol className="m-0 flex list-none items-start justify-between gap-1 p-0">
				{steps.map((step, index) => {
					const isCurrent = step.step_id === session.current_step_id;
					const isDone = step.submitted;
					const isUpcoming = !isDone && !isCurrent;
					const showConnector = index < steps.length - 1;

					return (
						<li
							key={step.step_id}
							className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5"
						>
							{showConnector ? (
								<span
									aria-hidden
									className={cn(
										"absolute top-3 left-[calc(50%+0.75rem)] right-[calc(-50%+0.75rem)] h-0.5",
										isDone ? "bg-primary" : "bg-border",
									)}
								/>
							) : null}
							<span
								className={cn(
									"relative z-10 flex size-6 items-center justify-center rounded-full",
									isDone && "bg-primary/10",
									isCurrent && "bg-primary/10 ring-2 ring-primary/30",
									isUpcoming && "bg-muted",
								)}
								aria-current={isCurrent ? "step" : undefined}
							>
								{isDone ? (
									<CheckCircleIcon
										className="size-5 text-primary"
										weight="fill"
									/>
								) : (
									<CircleIcon
										className={cn(
											"size-4",
											isCurrent ? "text-primary" : "text-muted-foreground",
										)}
										weight={isCurrent ? "fill" : "regular"}
									/>
								)}
							</span>
							<span
								className={cn(
									"max-w-full truncate text-center text-[10px] leading-tight sm:text-xs",
									isCurrent
										? "font-semibold text-foreground"
										: isDone
											? "font-medium text-foreground"
											: "text-muted-foreground",
								)}
								title={titleForVerificationType(step.type)}
							>
								{shortLabelForVerificationType(step.type)}
							</span>
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
