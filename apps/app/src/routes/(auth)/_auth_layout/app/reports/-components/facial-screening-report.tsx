import type { VerificationRequestDetail } from "#/api/http/v2/verifications/verifications.types";
import { GenericVerificationDetailReport } from "./generic-verification-detail-report";

export function FacialScreeningReport({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	return <GenericVerificationDetailReport verification={verification} />;
}
