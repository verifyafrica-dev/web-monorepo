import type { RefObject } from "react";
import type { AmlScreeningVerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { AmlScreeningDownloadReport } from "./aml-screening/aml-screening-download-report";
import { AmlScreeningInput } from "./aml-screening-input";
import { AmlScreeningOutcome } from "./aml-screening-outcome";
import { VerificationMetadataCard } from "./verification-metadata-card";

export function AmlScreeningReport({
	verification,
	downloadRef,
}: {
	verification: AmlScreeningVerificationRequestDetail;
	downloadRef?: RefObject<HTMLDivElement | null>;
}) {
	return (
		<div className="flex flex-col gap-6">
			<AmlScreeningInput verification={verification} />
			<AmlScreeningOutcome verification={verification} />
			{downloadRef ? (
				<div
					aria-hidden
					className="pointer-events-none fixed top-0 left-[-200vw] w-[1024px] opacity-0"
				>
					<div
						ref={downloadRef}
						className="flex flex-col gap-6 bg-background"
					>
						<VerificationMetadataCard verification={verification} />
						<AmlScreeningDownloadReport verification={verification} />
					</div>
				</div>
			) : null}
		</div>
	);
}
