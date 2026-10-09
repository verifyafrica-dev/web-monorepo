import type { VerificationRequestDetail } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { type RefObject, useMemo } from "react";

import { ReportOutcomeCard } from "../report-outcome-card";
import { ReportFieldGrid, ReportSectionCard } from "../report-sections";
import { SubmittedProofs } from "../submitted-proofs";
import { VerificationMetadataCard } from "../verification-metadata-card";
import { AmlCategoryBadge } from "./aml-hit-badges";
import { AmlHitList } from "./aml-hit-list";
import {
	type AmlScreeningSections,
	type AmlSubject,
	buildAmlScreeningSections,
} from "./aml-sections";

function AmlReportBody({
	sections,
	variant,
}: {
	sections: AmlScreeningSections;
	variant: "interactive" | "pdf";
}) {
	const productName =
		sections.subject === "business"
			? "Business AML Screening"
			: "AML Screening";
	const isClear =
		sections.hits.length === 0 &&
		!sections.outcome.errorMessage &&
		sections.checks.some((check) => Number(check.value) === 1);

	return (
		<div className="flex flex-col gap-6">
			<ReportSectionCard title={`${productName} Input Data`}>
				<ReportFieldGrid fields={sections.submitted} />
			</ReportSectionCard>

			<ReportOutcomeCard
				title={`${productName} Outcome`}
				outcome={sections.outcome}
				checks={sections.checks}
				fields={sections.summary}
			>
				{sections.categoryCounts.length > 0 ? (
					<div className="space-y-3 border-t pt-4">
						<p className="text-sm font-medium">Risk Categories</p>
						<div className="flex flex-wrap gap-2">
							{sections.categoryCounts.map((entry) => (
								<AmlCategoryBadge
									key={entry.category}
									category={entry.category}
									count={entry.count}
								/>
							))}
						</div>
					</div>
				) : null}
				{isClear ? (
					<p className="border-t pt-4 text-sm text-muted-foreground">
						No matches were found on the screened lists.
					</p>
				) : null}
			</ReportOutcomeCard>

			<AmlHitList
				hits={sections.hits}
				categoryCounts={sections.categoryCounts}
				variant={variant}
			/>

			<SubmittedProofs proofs={sections.proofs} />

			{sections.additional.length > 0 ? (
				<ReportSectionCard title="Additional Details">
					<ReportFieldGrid fields={sections.additional} />
				</ReportSectionCard>
			) : null}
		</div>
	);
}

export function AmlScreeningReport({
	verification,
	subject,
	downloadRef,
}: {
	verification: VerificationRequestDetail;
	subject: AmlSubject;
	downloadRef?: RefObject<HTMLDivElement | null>;
}) {
	const sections = useMemo(
		() =>
			buildAmlScreeningSections({
				inputData: verification.input_data,
				responseData: verification.response_data,
				subject,
			}),
		[verification.input_data, verification.response_data, subject],
	);

	return (
		<div className="flex flex-col gap-6">
			<AmlReportBody sections={sections} variant="interactive" />
			{downloadRef ? (
				<div
					aria-hidden
					inert
					className="pointer-events-none fixed top-0 left-[-200vw] w-[1024px] opacity-0"
				>
					<div ref={downloadRef} className="flex flex-col gap-6 bg-background">
						<VerificationMetadataCard verification={verification} />
						<AmlReportBody sections={sections} variant="pdf" />
					</div>
				</div>
			) : null}
		</div>
	);
}
