import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { cn } from "@verifyafrica/ui/lib/utils";
import type { DocumentVerificationResponsePayload } from "#/api/http/v2/verifications/verifications.types";
import { asNonEmptyString, asRecord } from "../../-utils";
import { ReportDetailField } from "../report-detail-field";

function asStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((item) => String(item ?? "").trim())
		.filter((item) => item.length > 0);
}

function formatLabel(value: string) {
	return value
		.replace(/_/g, " ")
		.replace(/-/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

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

export function DocumentVerificationOutcome({
	responseData,
}: {
	responseData: DocumentVerificationResponsePayload;
}) {
	const payload = (asRecord(asRecord(responseData)?.data) ??
		asRecord(responseData) ??
		{}) as DocumentVerificationResponsePayload;
	const verificationData = asRecord(payload.verification_data);
	const documentData = asRecord(verificationData?.document);
	const verificationResult = asRecord(payload.verification_result);
	const documentResult = asRecord(verificationResult?.document);
	const declinedReason = asNonEmptyString(payload.declined_reason);

	const supportedTypes = asStringArray(documentData?.supported_types);
	const selectedTypes = asStringArray(documentData?.selected_type);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					Document Verification Outcome
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				{declinedReason ? (
					<ReportDetailField
						label="Declined Reason"
						className="sm:col-span-2"
						value={<span className="font-medium">{declinedReason}</span>}
					/>
				) : null}
				<ReportDetailField
					label="Supported Types"
					value={
						supportedTypes.length > 0 ? (
							<div className="flex flex-wrap gap-1">
								{supportedTypes.map((type) => (
									<Badge
										key={type}
										variant="outline"
									>
										{formatLabel(type)}
									</Badge>
								))}
							</div>
						) : (
							<Badge
								variant="outline"
								className="border-slate-300 bg-slate-100 text-slate-700"
							>
								Not available
							</Badge>
						)
					}
				/>
				<ReportDetailField
					label="Selected Type"
					value={
						selectedTypes.length > 0 ? (
							<div className="flex flex-wrap gap-1">
								{selectedTypes.map((type) => (
									<Badge
										key={type}
										variant="outline"
									>
										{formatLabel(type)}
									</Badge>
								))}
							</div>
						) : (
							<Badge
								variant="outline"
								className="border-slate-300 bg-slate-100 text-slate-700"
							>
								Not available
							</Badge>
						)
					}
				/>
				<ReportDetailField
					label="Document"
					value={<ResultBadge value={documentResult?.document} />}
				/>
				<ReportDetailField
					label="Document Country"
					value={<ResultBadge value={documentResult?.document_country} />}
				/>
				<ReportDetailField
					label="Document Must Not Be Expired"
					value={
						<ResultBadge value={documentResult?.document_must_not_be_expired} />
					}
				/>
				<ReportDetailField
					label="Document Proof"
					value={<ResultBadge value={documentResult?.document_proof} />}
				/>
				<ReportDetailField
					label="Document Visibility"
					value={<ResultBadge value={documentResult?.document_visibility} />}
				/>
				<ReportDetailField
					label="Selected Type Check"
					value={<ResultBadge value={documentResult?.selected_type} />}
				/>
			</CardContent>
		</Card>
	);
}
