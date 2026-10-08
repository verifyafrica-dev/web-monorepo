import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { BusinessAmlScreeningInput } from "./business-aml-screening-input";
import { BusinessAmlScreeningOutcome } from "./business-aml-screening-outcome";

export function BusinessAmlScreeningReport({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	return (
		<div className="flex flex-col gap-6">
			<BusinessAmlScreeningInput verification={verification} />
			<BusinessAmlScreeningOutcome verification={verification} />
		</div>
	);
}
