import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { AddressVerificationOutcome } from "./address-verification-outcome";

export function AddressVerificationReport({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	return <AddressVerificationOutcome verification={verification} />;
}
