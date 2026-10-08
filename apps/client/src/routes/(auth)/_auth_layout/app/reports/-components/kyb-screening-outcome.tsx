import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
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
	getResponsePayload,
	type UnknownRecord,
} from "../-utils";
import { ReportDetailField } from "./report-detail-field";
import { ReportResultBadge } from "./report-result-badge";

function getFirstPresentValue(...values: unknown[]) {
	return values.find((value) => {
		if (value === null || value === undefined) {
			return false;
		}

		if (typeof value === "string") {
			return value.trim().length > 0;
		}

		return true;
	});
}

function getKybCompanies(payload: UnknownRecord): UnknownRecord[] {
	const verificationData = asRecord(payload.verification_data) ?? {};
	const kyb = verificationData.kyb;

	if (Array.isArray(kyb)) {
		return kyb.filter(isPlainObject) as UnknownRecord[];
	}

	if (isPlainObject(kyb)) {
		return [kyb as UnknownRecord];
	}

	return [];
}

function getRegisteredAddress(company: UnknownRecord) {
	const address = company.company_registered_address;

	if (typeof address === "string") {
		return address;
	}

	const first = asUnknownArray(address).find(isPlainObject) as
		| UnknownRecord
		| undefined;

	if (typeof first?.address === "string") {
		return first.address;
	}

	if (typeof company.company_registered_address_in_full === "string") {
		return company.company_registered_address_in_full;
	}

	return undefined;
}

export function KybScreeningOutcome({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	const payload = getResponsePayload(verification.response_data);
	const verificationResult = asRecord(payload.verification_result) ?? {};
	const companies = getKybCompanies(payload);
	const company = companies[0] ?? {};
	const declinedReason = asNonEmptyString(payload.declined_reason);
	const country =
		(typeof payload.country === "string" ? payload.country : undefined) ??
		(typeof company.company_jurisdiction_code === "string"
			? company.company_jurisdiction_code
			: undefined) ??
		verification.input_data.kyb?.company_jurisdiction_code ??
		verification.input_data.country;
	const email =
		(typeof payload.email === "string" ? payload.email : undefined) ??
		verification.input_data.email;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					KYB Screening Outcome
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
					label="Company Name"
					value={displayValue(
						getFirstPresentValue(company.company_name, company.name),
					)}
				/>
				<ReportDetailField
					label="Company Number"
					value={displayValue(
						getFirstPresentValue(
							company.company_number,
							company.registration_number,
							company.native_company_number,
						),
					)}
				/>
				<ReportDetailField
					label="Company Type"
					value={displayValue(
						getFirstPresentValue(company.company_type, company.type),
					)}
				/>
				<ReportDetailField
					label="Current Status"
					value={displayValue(
						getFirstPresentValue(
							company.company_current_status,
							company.company_status,
							company.status,
						),
					)}
					valueClassName="capitalize"
				/>
				<ReportDetailField
					label="Jurisdiction"
					value={displayValue(
						getFirstPresentValue(
							company.company_jurisdiction_code,
							company.jurisdiction_code,
						),
					)}
				/>
				<ReportDetailField
					label="Registration Date"
					value={displayValue(
						getFirstPresentValue(
							company.company_registration_date,
							company.company_incorporation_date,
							company.registration_date,
						),
					)}
				/>
				<ReportDetailField
					label="Matches"
					value={displayValue(companies.length)}
				/>
				<ReportDetailField
					label="Registered Address"
					className="sm:col-span-2"
					value={displayValue(getRegisteredAddress(company))}
				/>
				<ReportDetailField
					label="Customer Unique ID"
					value={displayValue(payload.customer_unique_id)}
				/>
				{declinedReason ? (
					<ReportDetailField
						label="Declined Reason"
						className="sm:col-span-2"
						value={<span className="font-medium">{declinedReason}</span>}
					/>
				) : null}
				<ReportDetailField
					label="KYB"
					value={<ReportResultBadge value={verificationResult.kyb} />}
				/>
			</CardContent>
		</Card>
	);
}
