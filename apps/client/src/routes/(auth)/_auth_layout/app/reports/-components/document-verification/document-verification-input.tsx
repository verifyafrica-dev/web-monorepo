import type { DocumentVerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import {
	COUNTRY_NAME_BY_ISO_CODE,
	getCountryName,
} from "@verifyafrica/ui/lib/country-state-city";
import { displayValue } from "../../-utils";
import { ReportDetailField } from "../report-detail-field";

function joinName(...parts: Array<string | undefined>) {
	const name = parts
		.map((part) => part?.trim())
		.filter((part): part is string => Boolean(part))
		.join(" ");

	return name || undefined;
}

export function DocumentVerificationInput({
	verification,
}: {
	verification: DocumentVerificationRequestDetail;
}) {
	const inputData = verification.input_data;
	const document = inputData.document;
	const name = document?.name;
	const firstName = name?.first_name;
	const lastName = name?.last_name;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					Document Input Data
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<ReportDetailField
					label="Full Name"
					value={displayValue(joinName(firstName, lastName))}
				/>
				<ReportDetailField
					label="First Name"
					value={displayValue(firstName)}
				/>
				<ReportDetailField
					label="Last Name"
					value={displayValue(lastName)}
				/>
				<ReportDetailField
					label="Date of Birth"
					value={displayValue(document?.dob)}
				/>
				<ReportDetailField
					label="Age"
					value={displayValue(document?.age)}
				/>
				<ReportDetailField
					label="Gender"
					value={displayValue(document?.gender)}
				/>
				<ReportDetailField
					label="Country"
					value={displayValue(getCountryName(inputData.country))}
					valueClassName="capitalize"
				/>
				<ReportDetailField
					label="Language"
					value={displayValue(inputData.language)}
				/>
				<ReportDetailField
					label="Email"
					value={displayValue(inputData.email)}
				/>
			</CardContent>
		</Card>
	);
}
