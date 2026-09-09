import type {
	FaceVerificationResultFace,
	FacialScreeningVerificationRequestDetail,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { getCountryName } from "@verifyafrica/ui/lib/country-state-city";
import { cn } from "@verifyafrica/ui/lib/utils";
import { asNonEmptyString, displayValue } from "../-utils";
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

function getFaceResult(face?: number | FaceVerificationResultFace | null) {
	if (face === null || face === undefined) {
		return { face: undefined, age: undefined };
	}

	if (typeof face === "number") {
		return { face, age: undefined };
	}

	return { face: face.face, age: face.age };
}

export function FacialScreeningOutcome({
	verification,
}: {
	verification: FacialScreeningVerificationRequestDetail;
}) {
	const responseData = verification.response_data ?? {};
	const faceResult = getFaceResult(responseData.verification_result?.face);
	const faceData = responseData.verification_data?.face;
	const declinedReason = asNonEmptyString(responseData.declined_reason);
	const country =
		responseData.country ?? verification.input_data.country ?? undefined;
	const email = responseData.email ?? verification.input_data.email;
	const duplicateDetected = faceData?.duplicate_account_detected;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					Facial Screening Outcome
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
					label="Estimated Age"
					value={displayValue(faceData?.age)}
				/>
				{declinedReason ? (
					<ReportDetailField
						label="Declined Reason"
						className="sm:col-span-2"
						value={<span className="font-medium">{declinedReason}</span>}
					/>
				) : null}
				<ReportDetailField
					label="Face"
					value={<ResultBadge value={faceResult.face} />}
				/>
				<ReportDetailField
					label="Age"
					value={<ResultBadge value={faceResult.age} />}
				/>
				<ReportDetailField
					label="Duplicate Check"
					value={
						<ResultBadge
							value={
								duplicateDetected === undefined || duplicateDetected === null
									? undefined
									: !duplicateDetected
							}
						/>
					}
				/>
			</CardContent>
		</Card>
	);
}
