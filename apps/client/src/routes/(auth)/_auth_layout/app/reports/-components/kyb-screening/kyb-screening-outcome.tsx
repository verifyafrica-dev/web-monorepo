import { Badge } from "@verifyafrica/ui/components/ui/badge";

import { ReportDetailField } from "../report-detail-field";
import { ReportResultBadge } from "../report-result-badge";
import { ReportSectionCard } from "../report-sections";
import { KybRegistryBadge } from "./kyb-registry-badge";
import type { KybOutcome } from "./kyb-screening-sections";

export function KybScreeningOutcome({ outcome }: { outcome: KybOutcome }) {
	return (
		<ReportSectionCard title="KYB Screening Outcome">
			<div className="grid gap-4 sm:grid-cols-2">
				<ReportDetailField
					label="KYB Check"
					value={<ReportResultBadge value={outcome.kybResult} />}
				/>
				<ReportDetailField
					label="Companies Found"
					value={outcome.companiesFound}
				/>
				{outcome.declinedReason ? (
					<ReportDetailField
						label="Declined Reason"
						className="sm:col-span-2"
						value={
							<span className="font-medium">{outcome.declinedReason}</span>
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
				{outcome.registries.length > 0 ? (
					<ReportDetailField
						label="Data Sources"
						className="sm:col-span-2"
						value={
							<div className="flex flex-wrap gap-1">
								{outcome.registries.map((registry) => (
									<KybRegistryBadge key={registry.name} registry={registry} />
								))}
							</div>
						}
					/>
				) : null}
				{outcome.providerCustomerId ? (
					<ReportDetailField
						label="Provider Customer ID"
						value={outcome.providerCustomerId}
						mono
					/>
				) : null}
			</div>
		</ReportSectionCard>
	);
}
