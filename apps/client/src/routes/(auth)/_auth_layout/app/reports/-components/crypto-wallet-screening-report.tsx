import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import type { RefObject } from "react";

import { AmlScreeningReport } from "./aml-screening/aml-screening-report";

export function CryptoWalletScreeningReport({
	verification,
	downloadRef,
}: {
	verification: VerificationRequestDetail;
	downloadRef?: RefObject<HTMLDivElement | null>;
}) {
	return (
		<AmlScreeningReport
			verification={verification}
			subject="crypto"
			downloadRef={downloadRef}
		/>
	);
}
