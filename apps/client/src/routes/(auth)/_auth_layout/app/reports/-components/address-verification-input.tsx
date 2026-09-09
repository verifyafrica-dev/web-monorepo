import type { AddressVerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { formatShuftiAddressDocumentTypeLabel } from "@verifyafrica/ui/lib/constants";
import { getCountryName } from "@verifyafrica/ui/lib/country-state-city";
import { displayValue } from "../-utils";
import { ReportDetailField } from "./report-detail-field";

function formatSupportedTypes(values?: string[]) {
	if (!values?.length) {
		return undefined;
	}

	return values.map(formatShuftiAddressDocumentTypeLabel).join(", ");
}

export function AddressVerificationInput({
	verification,
}: {
	verification: AddressVerificationRequestDetail;
}) {
	const inputData = verification.input_data;
	const address = inputData.address;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					Address Input Data
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<ReportDetailField
					label="Full Address"
					className="sm:col-span-2"
					value={displayValue(address?.full_address)}
				/>
				<ReportDetailField
					label="Country"
					value={displayValue(getCountryName(inputData.country))}
				/>
				<ReportDetailField
					label="Language"
					value={displayValue(inputData.language)}
				/>
				<ReportDetailField
					label="Email"
					value={displayValue(inputData.email)}
				/>
				<ReportDetailField
					label={
						address?.supported_types?.length === 1
							? "Document Type"
							: "Document Types"
					}
					value={displayValue(formatSupportedTypes(address?.supported_types))}
				/>
			</CardContent>
		</Card>
	);
}
