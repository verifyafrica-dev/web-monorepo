import { HourglassMediumIcon } from "@phosphor-icons/react";
import {
	type VerificationRequestDetail,
	VerificationStatusSchema,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { cn } from "@verifyafrica/ui/lib/utils";
import { useMemo } from "react";

import { ReportDetailField } from "../report-detail-field";
import { ReportOutcomeCard } from "../report-outcome-card";
import { ReportFieldGrid, ReportSectionCard } from "../report-sections";
import {
	buildRiskAssessmentSections,
	type RiskAssessmentSections,
	type RiskQuestionGroup,
	type RiskServiceCheck,
} from "./risk-assessment-sections";

const SERVICE_STATUS_CLASS_NAMES: Record<string, string> = {
	accepted: "border-emerald-200 bg-emerald-500 text-white",
	approved: "border-emerald-200 bg-emerald-500 text-white",
	declined: "border-red-200 bg-red-500 text-white",
	rejected: "border-red-200 bg-red-500 text-white",
};

function RiskLevelSummary({ sections }: { sections: RiskAssessmentSections }) {
	if (!sections.rangeName && !sections.assessmentTitle) return null;

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			{sections.rangeName ? (
				<ReportDetailField
					label="Risk Range"
					value={
						<Badge
							variant="outline"
							className={cn(
								"text-sm",
								sections.riskLevel?.badgeClassName ??
									"border-slate-300 bg-slate-100 text-slate-700",
							)}
						>
							{sections.riskLevel?.label ?? sections.rangeName}
						</Badge>
					}
				/>
			) : null}
			{sections.assessmentTitle ? (
				<ReportDetailField
					label="Assessment"
					value={sections.assessmentTitle}
				/>
			) : null}
		</div>
	);
}

function PendingQuestionnaire() {
	return (
		<div className="flex gap-3 rounded-lg border bg-muted/60 p-4">
			<HourglassMediumIcon className="mt-0.5 size-5 shrink-0 text-secondary" />
			<div className="flex min-w-0 flex-col gap-1">
				<p className="text-sm font-medium">
					Waiting for the customer to complete the questionnaire
				</p>
				<p className="text-sm text-pretty text-muted-foreground">
					Share the verification link above with the customer. The risk range,
					scores and answers appear here once they finish the Shufti
					questionnaire and any face check it asks for.
				</p>
			</div>
		</div>
	);
}

function ServiceChecks({ services }: { services: RiskServiceCheck[] }) {
	if (services.length === 0) return null;

	return (
		<ReportSectionCard title="Service Checks">
			<div className="grid gap-4 sm:grid-cols-2">
				{services.map((service) => (
					<ReportDetailField
						key={service.key}
						label={service.name}
						value={
							<Badge
								variant="outline"
								className={cn(
									"capitalize",
									SERVICE_STATUS_CLASS_NAMES[service.status.toLowerCase()] ??
										"border-slate-300 bg-slate-100 text-slate-700",
								)}
							>
								{service.status.replaceAll("_", " ")}
							</Badge>
						}
					/>
				))}
			</div>
		</ReportSectionCard>
	);
}

function QuestionnaireAnswers({ groups }: { groups: RiskQuestionGroup[] }) {
	if (groups.length === 0) return null;

	return (
		<ReportSectionCard title="Questionnaire Answers">
			{groups.map((group) => (
				<div key={group.key} className="flex flex-col gap-3">
					{group.title ? (
						<p className="text-sm font-medium">{group.title}</p>
					) : null}
					<ol className="divide-y rounded-lg border">
						{group.questions.map((item, index) => (
							<li
								key={item.key}
								className="grid gap-1 p-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] sm:gap-6"
							>
								<p className="text-sm text-pretty text-muted-foreground">
									<span className="mr-2 font-mono text-xs tabular-nums">
										{index + 1}.
									</span>
									{item.question}
								</p>
								<p className="text-sm font-medium text-pretty">
									{item.answer ?? "Not answered"}
								</p>
							</li>
						))}
					</ol>
				</div>
			))}
		</ReportSectionCard>
	);
}

export function RiskAssessmentReport({
	verification,
}: {
	verification: VerificationRequestDetail;
}) {
	const sections = useMemo(
		() =>
			buildRiskAssessmentSections({
				inputData: verification.input_data,
				responseData: verification.response_data,
			}),
		[verification.input_data, verification.response_data],
	);
	const isPending =
		verification.status === VerificationStatusSchema.enum.PENDING &&
		!sections.hasResult;
	const isUnknownProfile = /risk reference/i.test(
		sections.outcome.errorMessage ?? "",
	);

	return (
		<div className="flex flex-col gap-6">
			<ReportSectionCard title="Risk Assessment Input Data">
				<ReportFieldGrid fields={sections.submitted} />
			</ReportSectionCard>

			<ReportOutcomeCard
				title="Risk Assessment Outcome"
				outcome={sections.outcome}
				checks={sections.checks}
			>
				{isPending ? (
					<PendingQuestionnaire />
				) : null}
				{isUnknownProfile ? (
					<p className="text-sm text-pretty text-muted-foreground">
						The selected risk profile does not exist on the Shufti account that
						processed this request. Test credentials only accept test profiles,
						and live credentials only accept live profiles.
					</p>
				) : null}
				<RiskLevelSummary sections={sections} />
				{sections.scores.length > 0 ? (
					<div className="space-y-3 border-t pt-4">
						<p className="text-sm font-medium">Score Breakdown</p>
						<ReportFieldGrid fields={sections.scores} />
					</div>
				) : null}
			</ReportOutcomeCard>

			<ServiceChecks services={sections.services} />
			<QuestionnaireAnswers groups={sections.questionnaire} />

			{sections.additional.length > 0 ? (
				<ReportSectionCard title="Additional Details">
					<ReportFieldGrid fields={sections.additional} />
				</ReportSectionCard>
			) : null}
		</div>
	);
}
