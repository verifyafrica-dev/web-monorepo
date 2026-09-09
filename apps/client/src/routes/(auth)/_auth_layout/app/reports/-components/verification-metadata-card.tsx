import { CheckIcon, CopyIcon } from "@phosphor-icons/react";

import { VerificationStatusSchema } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { useClipboard } from "@verifyafrica/ui/hooks/use-clipboard";
import { extractHostedVerificationUrl } from "@verifyafrica/api-client/lib/verification-links";
import {
	formatReportDate,
	formatVerificationType,
	getVerificationTargetName,
	mapVerificationRequestToReport,
} from "../-data";
import { ReportDetailField } from "./report-detail-field";
import { VerificationStatusBadge } from "./verification-badges";

type VerificationMetadataCardProps = {
	verification: VerificationRequestDetail;
};

export function VerificationMetadataCard({
	verification,
}: VerificationMetadataCardProps) {
	const { copied, copy } = useClipboard({
		successMessage: "Verification link copied.",
		errorMessage: "Unable to copy verification link.",
	});
	const report = mapVerificationRequestToReport(verification);
	const verificationUrl = extractHostedVerificationUrl(verification);
	const showVerificationLink =
		verification.status === VerificationStatusSchema.enum.PENDING &&
		Boolean(verificationUrl);

	return (
		<Card className="bg-muted/20">
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					Verification Overview
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
				<ReportDetailField
					label="Verification ID"
					value={verification.id}
					mono
				/>
				<ReportDetailField
					label="Batch ID"
					value={verification.batch_id ?? "N/A"}
					mono
				/>
				<ReportDetailField
					label="Type"
					value={formatVerificationType(report)}
				/>
				<ReportDetailField
					label="Status"
					value={<VerificationStatusBadge status={verification.status} />}
				/>
				<ReportDetailField
					label="Subject"
					value={getVerificationTargetName(verification)}
				/>
				<ReportDetailField
					label="Cost"
					value={`${verification.currency} ${verification.cost_charged}`}
				/>
				<ReportDetailField
					label="Created At"
					value={formatReportDate(verification.created_at)}
				/>
				{verification.submitted_at ? (
					<ReportDetailField
						label="Submitted At"
						value={formatReportDate(verification.submitted_at)}
					/>
				) : null}
				{verification.reference ? (
					<ReportDetailField
						label="Reference"
						value={verification.reference}
						mono
					/>
				) : null}
				{verification.response_data.event ? (
					<ReportDetailField
						label="Event"
						value={verification.response_data.event}
						mono
					/>
				) : null}
				{verification.input_data.customer_unique_id ? (
					<ReportDetailField
						label="Customer Unique ID"
						value={verification.input_data.customer_unique_id}
					/>
				) : null}

				{verification.response_data.declined_reason ? (
					<ReportDetailField
						label="Declined Reason"
						value={verification.response_data.declined_reason}
					/>
				) : null}
				<ReportDetailField
					label="Mode"
					value={verification.link ? "Link" : "Direct"}
				/>

				{showVerificationLink ? (
					<ReportDetailField
						label="Verification Link"
						className="sm:col-span-2"
						value={
							<div className="flex items-start gap-2 rounded-md border bg-background p-3">
								<a
									href={verificationUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="min-w-0 flex-1 break-all font-mono text-xs text-foreground hover:underline"
								>
									{verificationUrl}
								</a>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="shrink-0"
									onClick={() => void copy(verificationUrl)}
									aria-label="Copy verification link"
								>
									{copied ? (
										<CheckIcon className="size-4 text-emerald-600" />
									) : (
										<CopyIcon className="size-4" />
									)}
								</Button>
							</div>
						}
					/>
				) : null}
			</CardContent>
		</Card>
	);
}
