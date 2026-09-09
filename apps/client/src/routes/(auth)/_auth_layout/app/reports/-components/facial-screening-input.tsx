import type { FacialScreeningVerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { getCountryName } from "@verifyafrica/ui/lib/country-state-city";
import { displayValue } from "../-utils";
import { ReportDetailField } from "./report-detail-field";

function formatVerificationMode(value?: string) {
	if (!value) {
		return undefined;
	}

	return value
		.replace(/_/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatYesNo(value?: string) {
	if (value === "1" || value === "true") {
		return "Yes";
	}

	if (value === "0" || value === "false") {
		return "No";
	}

	return undefined;
}

function formatAgeRange(min?: string, max?: string) {
	const lower = min?.trim();
	const upper = max?.trim();

	if (lower && upper) {
		return `${lower}–${upper}`;
	}

	if (lower) {
		return `${lower}+`;
	}

	if (upper) {
		return `Up to ${upper}`;
	}

	return undefined;
}

export function FacialScreeningInput({
	verification,
}: {
	verification: FacialScreeningVerificationRequestDetail;
}) {
	const inputData = verification.input_data;
	const face = inputData.face;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					Facial Screening Input Data
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<ReportDetailField
					label="Email"
					value={displayValue(inputData.email)}
				/>
				<ReportDetailField
					label="Language"
					value={displayValue(inputData.language)}
				/>
				<ReportDetailField
					label="Country"
					value={displayValue(getCountryName(inputData.country))}
				/>
				<ReportDetailField
					label="Verification Mode"
					value={displayValue(formatVerificationMode(face?.verification_mode))}
				/>
				<ReportDetailField
					label="Duplicate Check"
					value={displayValue(formatYesNo(face?.check_duplicate_request))}
				/>
				<ReportDetailField
					label="Age Range"
					value={displayValue(formatAgeRange(face?.age?.min, face?.age?.max))}
				/>
			</CardContent>
		</Card>
	);
}
