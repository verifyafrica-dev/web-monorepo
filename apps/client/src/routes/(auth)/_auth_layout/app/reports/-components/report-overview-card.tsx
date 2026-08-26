import type { ReactNode } from "react";

import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { ReportDetailField } from "./report-detail-field";

type ReportOverviewCardProps = {
	status: ReactNode;
	verificationType: string;
	reference?: string | null;
	createdAt: string;
	submittedAt?: string;
	verificationEvent?: string;
	customerEmail?: string;
	customerUniqueId?: string;
	country?: string;
	declinedReason?: string;
	renderCopyButton?: (value: string) => ReactNode;
};

function withCopyButton(
	value: string,
	renderCopyButton?: (value: string) => ReactNode,
	mono = false,
) {
	const copyButton = renderCopyButton?.(value);
	if (!copyButton) {
		return (
			<span className={mono ? "font-mono text-xs" : undefined}>{value}</span>
		);
	}

	return (
		<div className="flex items-center gap-1">
			<span className={mono ? "font-mono text-xs" : undefined}>{value}</span>
			{copyButton}
		</div>
	);
}

export function ReportOverviewCard({
	status,
	verificationType,
	reference,
	createdAt,
	submittedAt,
	verificationEvent,
	customerEmail,
	customerUniqueId,
	country,
	declinedReason,
	renderCopyButton,
}: ReportOverviewCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base font-semibold">
					Report Overview
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4 sm:grid-cols-2">
				<ReportDetailField
					label="Status"
					value={status}
				/>
				<ReportDetailField
					label="Verification Type"
					value={verificationType}
				/>
				<ReportDetailField
					label="Reference"
					value={withCopyButton(reference ?? "N/A", renderCopyButton, true)}
				/>
				<ReportDetailField
					label="Created At"
					value={createdAt}
				/>
				{submittedAt ? (
					<ReportDetailField
						label="Submitted At"
						value={submittedAt}
					/>
				) : null}
				{country ? (
					<ReportDetailField
						label="Country"
						value={country}
					/>
				) : null}
				{verificationEvent ? (
					<ReportDetailField
						label="Verification Event"
						value={verificationEvent}
					/>
				) : null}
				{customerEmail ? (
					<ReportDetailField
						label="Customer Email"
						value={withCopyButton(customerEmail, renderCopyButton)}
					/>
				) : null}
				{customerUniqueId ? (
					<ReportDetailField
						label="Customer Unique ID"
						value={withCopyButton(customerUniqueId, renderCopyButton, true)}
					/>
				) : null}
				{declinedReason ? (
					<ReportDetailField
						label="Declined Reason"
						className="sm:col-span-2"
						value={<span className="font-medium">{declinedReason}</span>}
					/>
				) : null}
			</CardContent>
		</Card>
	);
}
