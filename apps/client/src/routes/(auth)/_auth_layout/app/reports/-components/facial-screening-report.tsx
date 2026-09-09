import type { FacialScreeningVerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { FacialScreeningInput } from "./facial-screening-input";
import { FacialScreeningOutcome } from "./facial-screening-outcome";

export function FacialScreeningReport({
	verification,
}: {
	verification: FacialScreeningVerificationRequestDetail;
}) {
	return (
		<div className="flex flex-col gap-6">
			<FacialScreeningInput verification={verification} />
			<FacialScreeningOutcome verification={verification} />
		</div>
	);
}
