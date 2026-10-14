import type { AddressVerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

import { ReportOutcomeCard } from "../report-outcome-card";
import { ReportFieldGrid, ReportSectionCard } from "../report-sections";
import { SubmittedProofs } from "../submitted-proofs";
import { buildAddressVerificationSections } from "./address-verification-sections";

export function AddressVerificationReport({
	verification,
}: {
	verification: AddressVerificationRequestDetail;
}) {
	const sections = buildAddressVerificationSections({
		inputData: verification.input_data,
		responseData: verification.response_data,
	});

	return (
		<div className="flex flex-col gap-6">
			<ReportSectionCard title="Address Verification Input Data">
				<ReportFieldGrid fields={sections.submitted} />
			</ReportSectionCard>

			<ReportOutcomeCard
				title="Address Verification Outcome"
				outcome={sections.outcome}
				checks={sections.checks}
			>
				{sections.checkedData.length > 0 ? (
					<div className="space-y-3 border-t pt-4">
						<p className="text-sm font-medium">Data Returned by Provider</p>
						<ReportFieldGrid fields={sections.checkedData} />
					</div>
				) : null}
			</ReportOutcomeCard>

			<SubmittedProofs proofs={sections.proofs} />

			{sections.additional.length > 0 ? (
				<ReportSectionCard title="Additional Details">
					<ReportFieldGrid fields={sections.additional} />
				</ReportSectionCard>
			) : null}
		</div>
	);
}
