import { Badge } from "@verifyafrica/ui/components/ui/badge";
import type { ReactNode } from "react";

import type { ProviderOutcome, ReportCheck } from "./report-builders";
import { ReportDetailField } from "./report-detail-field";
import { ReportResultBadge } from "./report-result-badge";
import {
	type ReportField,
	ReportFieldGrid,
	ReportSectionCard,
} from "./report-sections";

export function ReportOutcomeCard({
	title,
	outcome,
	checks,
	fields = [],
	children,
}: {
	title: string;
	outcome: ProviderOutcome;
	checks: ReportCheck[];
	fields?: ReportField[];
	children?: ReactNode;
}) {
	return (
		<ReportSectionCard title={title}>
			{outcome.declinedReason ||
			outcome.errorMessage ||
			outcome.declinedCodes.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2">
					{outcome.declinedReason ? (
						<ReportDetailField
							label="Declined Reason"
							className="sm:col-span-2"
							value={
								<span className="font-medium">{outcome.declinedReason}</span>
							}
						/>
					) : null}
					{outcome.errorMessage ? (
						<ReportDetailField
							label="Provider Error"
							className="sm:col-span-2"
							value={
								<span className="font-medium text-red-700">
									{outcome.errorMessage}
								</span>
							}
						/>
					) : null}
					{outcome.declinedCodes.length > 0 ? (
						<ReportDetailField
							label="Declined Codes"
							className="sm:col-span-2"
							value={
								<div className="flex flex-wrap gap-1">
									{outcome.declinedCodes.map((code) => (
										<Badge key={code} variant="outline" className="font-mono">
											{code}
										</Badge>
									))}
								</div>
							}
						/>
					) : null}
				</div>
			) : null}

			{checks.length > 0 ? (
				<div className="space-y-3">
					<p className="text-sm font-medium">Verification Checks</p>
					<div className="grid gap-4 sm:grid-cols-2">
						{checks.map((check) => (
							<ReportDetailField
								key={check.key}
								label={check.label}
								value={<ReportResultBadge value={check.value} />}
							/>
						))}
					</div>
				</div>
			) : null}

			<ReportFieldGrid fields={fields} />
			{children}
		</ReportSectionCard>
	);
}
