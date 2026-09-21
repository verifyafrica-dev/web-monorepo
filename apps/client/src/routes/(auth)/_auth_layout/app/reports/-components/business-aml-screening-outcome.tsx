import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { getCountryName } from "@verifyafrica/ui/lib/country-state-city";
import { isPlainObject } from "@verifyafrica/ui/lib/validators";
import {
	asNonEmptyString,
	asRecord,
	asUnknownArray,
	displayValue,
	formatHumanLabel,
	getResponsePayload,
} from "../-utils";
import { ReportDetailField } from "./report-detail-field";
import { ReportResultBadge } from "./report-result-badge";

function asStringList(value: unknown): string[] {
	return asUnknownArray(value)
		.map((item) => String(item ?? "").trim())
		.filter(Boolean);
}

export function BusinessAmlScreeningOutcome({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	const payload = getResponsePayload(verification.response_data);
	const verificationData = asRecord(payload.verification_data) ?? {};
	const business =
		asRecord(verificationData.aml_for_businesses) ??
		asRecord(payload.aml_for_businesses) ??
		{};
	const verificationResult = asRecord(payload.verification_result) ?? {};
	const amlData = asRecord(business.aml_data) ?? {};
	const hits = asUnknownArray(amlData.hits).filter(isPlainObject);
	const declinedReason = asNonEmptyString(payload.declined_reason);
	const appliedFilters = asStringList(business.filters ?? amlData.filters);
	const country =
		(typeof payload.country === "string" ? payload.country : undefined) ??
		verification.input_data.country;
	const email =
		(typeof payload.email === "string" ? payload.email : undefined) ??
		verification.input_data.email;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					Business AML Screening Outcome
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<ReportDetailField
					label="Reference"
					value={displayValue(payload.reference ?? verification.reference)}
					mono
				/>
				<ReportDetailField
					label="Country"
					value={displayValue(getCountryName(country))}
				/>
				<ReportDetailField
					label="Email"
					value={displayValue(email)}
				/>
				<ReportDetailField
					label="Business Name"
					value={displayValue(
						business.business_name ??
							verification.input_data.aml_for_businesses?.business_name,
					)}
				/>
				<ReportDetailField
					label="Incorporation Date"
					value={displayValue(
						business.business_incorporation_date ??
							verification.input_data.aml_for_businesses
								?.business_incorporation_date,
					)}
				/>
				<ReportDetailField
					label="Customer Unique ID"
					value={displayValue(payload.customer_unique_id)}
				/>
				<ReportDetailField
					label="Hits"
					value={displayValue(hits.length)}
				/>
				<ReportDetailField
					label="Match Score"
					value={displayValue(business.match_score)}
				/>
				{declinedReason ? (
					<ReportDetailField
						label="Declined Reason"
						className="sm:col-span-2"
						value={<span className="font-medium">{declinedReason}</span>}
					/>
				) : null}
				<ReportDetailField
					label="Applied Filters"
					className="sm:col-span-2"
					value={
						appliedFilters.length > 0 ? (
							<div className="flex flex-wrap gap-1">
								{appliedFilters.map((filter) => (
									<Badge
										key={filter}
										variant="outline"
									>
										{formatHumanLabel(filter)}
									</Badge>
								))}
							</div>
						) : (
							displayValue(undefined)
						)
					}
				/>
				<ReportDetailField
					label="Business AML"
					value={
						<ReportResultBadge value={verificationResult.aml_for_businesses} />
					}
				/>
			</CardContent>
		</Card>
	);
}
