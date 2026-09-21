import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { KybScreeningInput } from "./kyb-screening-input";
import { KybScreeningOutcome } from "./kyb-screening-outcome";

export function KybReport({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	return (
		<div className="flex flex-col gap-6">
			<KybScreeningInput verification={verification} />
			<KybScreeningOutcome verification={verification} />
		</div>
	);
}
