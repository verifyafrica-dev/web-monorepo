import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
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

export function BusinessAmlScreeningInput({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	const inputData = verification.input_data;
	const business = inputData.aml_for_businesses;
	const filters = inputData.filters;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					Business AML Screening Input Data
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
					label="Business Name"
					value={displayValue(business?.business_name)}
				/>
				<ReportDetailField
					label="Incorporation Date"
					value={displayValue(business?.business_incorporation_date)}
				/>
				<ReportDetailField
					label="Countries"
					value={displayValue(
						formatCountries(business?.countries, inputData.country),
					)}
				/>
				<ReportDetailField
					label="Filters"
					value={displayValue(
						formatStringList(filters?.filters ?? business?.filters),
					)}
				/>
				<ReportDetailField
					label="Match Score"
					value={displayValue(filters?.match_score ?? business?.match_score)}
				/>
				<ReportDetailField
					label="RCA Search"
					value={displayValue(
						formatYesNo(filters?.rca_search ?? business?.rca_search),
					)}
				/>
				<ReportDetailField
					label="Alias Search"
					value={displayValue(
						formatYesNo(filters?.alias_search ?? business?.alias_search),
					)}
				/>
				<ReportDetailField
					label="Context"
					className="sm:col-span-2"
					value={displayValue(business?.context)}
				/>
			</CardContent>
		</Card>
	);
}
