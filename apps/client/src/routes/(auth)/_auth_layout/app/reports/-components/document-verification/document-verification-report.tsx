import type { DocumentVerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { DocumentVerificationInput } from "./document-verification-input";
import { DocumentVerificationOutcome } from "./document-verification-outcome";

export function DocumentVerificationReport({
	verification,
}: {
	verification: DocumentVerificationRequestDetail;
}) {
	return (
		<div className="flex flex-col gap-6">
			<DocumentVerificationInput verification={verification} />
			<DocumentVerificationOutcome responseData={verification.response_data} />
		</div>
	);
}
