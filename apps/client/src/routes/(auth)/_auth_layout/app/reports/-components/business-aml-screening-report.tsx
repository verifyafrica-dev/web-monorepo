import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { BusinessAmlScreeningInput } from "./business-aml-screening-input";
import { GenericVerificationDetailReport } from "./generic-verification-detail-report";

export function BusinessAmlScreeningReport({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	return (
		<div className="flex flex-col gap-6">
			<BusinessAmlScreeningInput verification={verification} />
			<GenericVerificationDetailReport verification={verification} />
		</div>
	);
}
