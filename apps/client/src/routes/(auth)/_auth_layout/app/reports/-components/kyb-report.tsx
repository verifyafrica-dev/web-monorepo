import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { GenericVerificationDetailReport } from "./generic-verification-detail-report";
import { KybScreeningInput } from "./kyb-screening-input";

export function KybReport({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	return (
		<div className="flex flex-col gap-6">
			<KybScreeningInput verification={verification} />
			<GenericVerificationDetailReport verification={verification} />
		</div>
	);
}
