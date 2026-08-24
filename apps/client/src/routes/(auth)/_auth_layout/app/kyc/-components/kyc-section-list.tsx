import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { cn } from "#/lib/utils.ts";
import type { KycSection } from "../-data";
import { SECTION_NAMES } from "../-data";
import { isKycSectionCompleted } from "../-utils";
import { useKyc } from "./kyc-provider";

function SectionStatusIcon({
	completed,
	rejected,
}: {
	completed: boolean;
	rejected: boolean;
}) {
	return (
		<div
			className={cn(
				"flex size-8 shrink-0 items-center justify-center rounded-full border",
				rejected
					? "border-destructive/30 bg-destructive/10 text-destructive"
					: completed
					? "border-emerald-200 bg-emerald-50 text-emerald-600"
					: "border-slate-200 bg-slate-50 text-slate-400",
			)}
		>
			{completed && !rejected ? (
				<CheckIcon className="size-4" weight="bold" />
			) : (
				<XIcon className="size-4" weight="bold" />
			)}
		</div>
	);
}

export function KycSectionList({ sections }: { sections: KycSection[] }) {
	const { completionStatus, isReadOnly, kyc, sectionRejectedReason } = useKyc();

	return (
		<ul className="space-y-3">
			{sections.map((section) => {
				const isCompleted = isKycSectionCompleted(
					section.path,
					completionStatus,
				);
				const isRejectedSection =
					kyc.kyc_status === "rejected" &&
					((section.path === SECTION_NAMES.BASIC_INFORMATION &&
						Boolean(sectionRejectedReason.basic_information?.trim())) ||
						(section.path === SECTION_NAMES.PRIMARY_CONTACT &&
							Boolean(sectionRejectedReason.primary_contact?.trim())) ||
						(section.path === SECTION_NAMES.DIRECTORS_AND_SHAREHOLDERS &&
							Boolean(
								sectionRejectedReason.directors_and_shareholders?.trim(),
							)) ||
						(section.path === SECTION_NAMES.BUSINESS_ACTIVITY &&
							Boolean(sectionRejectedReason.business_activity?.trim())) ||
						(section.path === SECTION_NAMES.ONBOARDING_QUESTIONNAIRE &&
							Boolean(
								sectionRejectedReason.onboarding_questionnaire?.trim(),
							)) ||
						(section.path === SECTION_NAMES.DOCUMENTS_UPLOAD &&
							Boolean(sectionRejectedReason.documents_upload?.trim())) ||
						(section.path === SECTION_NAMES.COMPLIANCE_DECLARATIONS &&
							Boolean(
								sectionRejectedReason.compliance_declarations?.trim(),
							)) ||
						(section.path === SECTION_NAMES.AUTHORIZED_SIGNATURE &&
							Boolean(sectionRejectedReason.authorized_signature?.trim())));

				return (
					<li
						key={section.path}
						className="flex items-center gap-4 rounded-xl border bg-card px-4 py-5 sm:px-5"
					>
						<SectionStatusIcon
							completed={isCompleted}
							rejected={isRejectedSection}
						/>

						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<p className="font-semibold text-foreground">{section.title}</p>
							<p className="text-sm text-muted-foreground">
								{section.description}
							</p>
						</div>

						{!isReadOnly && (
							<Button
								variant="outline"
								size="sm"
								className="shrink-0 cursor-pointer px-4 text-xs font-semibold tracking-wide text-primary uppercase"
								asChild
							>
								<Link to="/app/kyc" search={{ section: section.path }}>
									Edit
								</Link>
							</Button>
						)}
					</li>
				);
			})}
		</ul>
	);
}
