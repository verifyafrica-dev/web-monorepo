import type { AmlScreeningVerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { getCountryName } from "@verifyafrica/ui/lib/country-state-city";
import {
	displayValue,
	formatHumanLabel,
	formatStringList,
	formatYesNo,
} from "../-utils";
import { ReportDetailField } from "./report-detail-field";

function formatCountries(codes?: string[], fallback?: string) {
	const values = codes?.length ? codes : fallback ? [fallback] : [];
	if (values.length === 0) {
		return undefined;
	}

	return values
		.map((code) => getCountryName(code) || formatHumanLabel(code))
		.join(", ");
}

export function AmlScreeningInput({
	verification,
}: {
	verification: AmlScreeningVerificationRequestDetail;
}) {
	const inputData = verification.input_data;
	const background = inputData.background_checks;
	const filters = inputData.filters;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					AML Screening Input Data
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
					label="Full Name"
					value={displayValue(background?.name?.full_name)}
				/>
				<ReportDetailField
					label="Date Of Birth"
					value={displayValue(background?.dob)}
				/>
				<ReportDetailField
					label="Countries"
					value={displayValue(
						formatCountries(background?.countries, inputData.country),
					)}
				/>
				<ReportDetailField
					label="Filters"
					value={displayValue(
						formatStringList(filters?.filters ?? background?.filters),
					)}
				/>
				<ReportDetailField
					label="Match Score"
					value={displayValue(filters?.match_score ?? background?.match_score)}
				/>
				<ReportDetailField
					label="RCA Search"
					value={displayValue(
						formatYesNo(filters?.rca_search ?? background?.rca_search),
					)}
				/>
				<ReportDetailField
					label="Alias Search"
					value={displayValue(
						formatYesNo(filters?.alias_search ?? background?.alias_search),
					)}
				/>
				<ReportDetailField
					label="Context"
					className="sm:col-span-2"
					value={displayValue(background?.context)}
				/>
			</CardContent>
		</Card>
	);
}
