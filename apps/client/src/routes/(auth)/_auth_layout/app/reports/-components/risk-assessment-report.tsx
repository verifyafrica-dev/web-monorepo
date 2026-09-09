import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { GenericVerificationDetailReport } from "./generic-verification-detail-report";

export function RiskAssessmentReport({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	return <GenericVerificationDetailReport verification={verification} />;
}
