import type { AmlScreeningVerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { AmlScreeningInput } from "../aml-screening-input";
import { AmlScreeningOutcome } from "../aml-screening-outcome";

export function AmlScreeningDownloadReport({
	verification,
}: {
	verification: AmlScreeningVerificationRequestDetail;
}) {
	return (
		<div className="flex flex-col gap-6">
			<AmlScreeningInput verification={verification} />
			<AmlScreeningOutcome verification={verification} />
		</div>
	);
}
