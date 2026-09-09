import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { getCountryName } from "@verifyafrica/ui/lib/country-state-city";
import { cn } from "@verifyafrica/ui/lib/utils";
import { displayValue } from "../-utils";
import { ReportDetailField } from "./report-detail-field";

function getResultValueLabel(
	value: unknown,
): "Passed" | "Failed" | "Not available" {
	if (value === null || value === undefined || value === "") {
		return "Not available";
	}

	if (typeof value === "number") {
		return value > 0 ? "Passed" : "Failed";
	}

	if (typeof value === "boolean") {
		return value ? "Passed" : "Failed";
	}

	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (!normalized) {
			return "Not available";
		}

		if (
			normalized === "passed" ||
			normalized === "success" ||
			normalized === "true" ||
			normalized === "1"
		) {
			return "Passed";
		}

		if (
			normalized === "failed" ||
			normalized === "error" ||
			normalized === "false" ||
			normalized === "0"
		) {
			return "Failed";
		}
	}

	return "Not available";
}

function ResultBadge({ value }: { value: unknown }) {
	const label = getResultValueLabel(value);

	return (
		<Badge
			variant="outline"
			className={cn(
				"capitalize",
				label === "Passed" && "border-emerald-200 bg-emerald-500 text-white",
				label === "Failed" && "border-red-200 bg-red-500 text-white",
				label === "Not available" &&
					"border-slate-300 bg-slate-100 text-slate-700",
			)}
		>
			{label}
		</Badge>
	);
}

export function AddressVerificationOutcome({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	const responseData = verification.response_data;
	const addressResult = responseData.verification_result?.address;
	const fullAddress =
		responseData.verification_data?.address?.full_address ??
		verification.input_data.address?.full_address;
	const country =
		responseData.country ?? verification.input_data.country ?? undefined;
	const email = responseData.email ?? verification.input_data.email;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					Address Verification Outcome
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<ReportDetailField
					label="Reference"
					value={displayValue(responseData.reference ?? verification.reference)}
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
					label="Full Address"
					className="sm:col-span-2"
					value={displayValue(fullAddress)}
				/>
				<ReportDetailField
					label="Address Document"
					value={<ResultBadge value={addressResult?.address_document} />}
				/>
				<ReportDetailField
					label="Address Must Not Be Expired"
					value={
						<ResultBadge value={addressResult?.address_must_not_be_expired} />
					}
				/>
				<ReportDetailField
					label="Full Address"
					value={<ResultBadge value={addressResult?.full_address} />}
				/>
			</CardContent>
		</Card>
	);
}
