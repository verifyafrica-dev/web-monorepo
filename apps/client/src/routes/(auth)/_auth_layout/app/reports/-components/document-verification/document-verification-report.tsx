import type { DocumentVerificationRequestDetail } from "#/api/http/v2/verifications/verifications.types";
import { asNonEmptyString } from "../../-utils";
import { DocumentVerificationIdentityCard } from "./document-verification-identity-card";
import { DocumentVerificationOutcome } from "./document-verification-outcome";
import { ReportOverviewCard } from "../report-overview-card";

function formatVerificationType(value: string) {
	return value
		.replace(/_/g, " ")
		.replace(/-/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DocumentVerificationReport({
	verification,
}: {
	verification: DocumentVerificationRequestDetail;
}) {
	const proof = verification.response_data.additional_data?.document?.proof;

	return (
		<div className="flex flex-col gap-6">
			<ReportOverviewCard
				status={verification.status}
				verificationType={formatVerificationType(
					verification.verification_type,
				)}
				reference={verification.reference}
				createdAt={new Date(verification.created_at).toLocaleString()}
				submittedAt={
					verification.submitted_at
						? new Date(verification.submitted_at).toLocaleString()
						: undefined
				}
				verificationEvent={verification.response_data.event}
				customerEmail={verification.input_data.email}
				customerUniqueId={verification.input_data.customer_unique_id as string}
				country={verification.input_data.country as string}
				declinedReason={asNonEmptyString(
					verification.response_data.declined_reason,
				)}
			/>

			<DocumentVerificationIdentityCard
				identity={{
					fullName: proof?.full_name ?? proof?.first_name,
					firstName: proof?.first_name,
					lastName: proof?.last_name,
					dateOfBirth: proof?.dob,
					gender: proof?.gender,
					nationality:
						(proof?.nationality as string | undefined) ??
						(proof?.country as string | undefined),
					placeOfBirth: proof?.place_of_birth,
				}}
			/>

			<DocumentVerificationOutcome responseData={verification.response_data} />
		</div>
	);
}
