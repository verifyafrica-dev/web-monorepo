import type { AddressVerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { AddressVerificationInput } from "./address-verification-input";
import { AddressVerificationOutcome } from "./address-verification-outcome";

export function AddressVerificationReport({
	verification,
}: {
	verification: AddressVerificationRequestDetail;
}) {
	return (
		<div className="flex flex-col gap-6">
			<AddressVerificationInput verification={verification} />
			<AddressVerificationOutcome verification={verification} />
		</div>
	);
}
