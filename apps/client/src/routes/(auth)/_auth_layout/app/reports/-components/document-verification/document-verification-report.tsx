import type { DocumentVerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

import { asNonEmptyString } from "../../-utils";
import {
	ReportDataMatches,
	ReportFieldGrid,
	ReportSectionCard,
} from "../report-sections";
import { DocumentVerificationInput } from "./document-verification-input";
import { DocumentVerificationOutcome } from "./document-verification-outcome";
import { DocumentVerificationProofs } from "./document-verification-proofs";
import { buildDocumentVerificationSections } from "./document-verification-sections";

export function DocumentVerificationReport({
	verification,
}: {
	verification: DocumentVerificationRequestDetail;
}) {
	const sections = buildDocumentVerificationSections({
		inputData: verification.input_data,
		responseData: verification.response_data,
	});
	const hasPersonal =
		sections.personal.length > 0 || sections.dataMatches.length > 0;

	return (
		<div className="flex flex-col gap-6">
			<DocumentVerificationInput fields={sections.submitted} />
			<DocumentVerificationOutcome
				declinedReason={asNonEmptyString(
					verification.response_data?.declined_reason,
				)}
				declinedCodes={sections.declinedCodes}
				selectedTypes={sections.selectedTypes}
				supportedTypes={sections.supportedTypes}
				checks={sections.checks}
			/>

			{hasPersonal ? (
				<ReportSectionCard title="Personal Information">
					<ReportFieldGrid fields={sections.personal} />
					<ReportDataMatches matches={sections.dataMatches} />
				</ReportSectionCard>
			) : null}

			{sections.document.length > 0 ? (
				<ReportSectionCard title="Document Details">
					<ReportFieldGrid fields={sections.document} />
				</ReportSectionCard>
			) : null}

			<DocumentVerificationProofs proofs={sections.proofs} />

			{sections.additional.length > 0 ? (
				<ReportSectionCard title="Additional Details">
					<ReportFieldGrid fields={sections.additional} />
				</ReportSectionCard>
			) : null}
		</div>
	);
}
