import { useEffect, useMemo, useState } from "react";
import type { SectionRejectedReason } from "#/api/http/v2/tenants/tenants.types";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@verifyafrica/ui/components/ui/accordion";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { Textarea } from "@verifyafrica/ui/components/ui/textarea";

const SECTION_REASONS = [
	{
		key: "basic_information",
		title: "Basic Information",
		defaultReason: "Company registration document is invalid or expired.",
	},
	{
		key: "primary_contact",
		title: "Primary Contact",
		defaultReason: "Primary contact details are incomplete or invalid.",
	},
	{
		key: "directors_and_shareholders",
		title: "Directors and Shareholders",
		defaultReason:
			"Directors identification documents are invalid/expired or UBO declarations are incomplete.",
	},
	{
		key: "business_activity",
		title: "Business Activity",
		defaultReason:
			"Business activity information is incomplete, unclear, or not sufficient.",
	},
	{
		key: "onboarding_questionnaire",
		title: "Onboarding Questionnaire",
		defaultReason:
			"Onboarding questionnaire responses are incomplete or inconsistent.",
	},
	{
		key: "documents_upload",
		title: "Documents Upload",
		defaultReason:
			"Uploaded compliance documents are illegible, unclear, outdated, or invalid.",
	},
	{
		key: "compliance_declarations",
		title: "Compliance Declarations",
		defaultReason: "Required compliance declarations are incomplete or not accepted.",
	},
	{
		key: "authorized_signature",
		title: "Authorized Signature",
		defaultReason: "Authorized signature section is incomplete or invalid.",
	},
] as const;

type SectionReasonKey = (typeof SECTION_REASONS)[number]["key"];

type SectionRejectedReasonPayload = Record<SectionReasonKey, string | null>;

export type RejectComplianceSubmitPayload = {
	general_rejected_reason: string;
	section_rejected_reason: SectionRejectedReasonPayload;
};

type SectionReasonState = Record<
	SectionReasonKey,
	{
		selected: boolean;
		reason: string;
	}
>;

const buildInitialSectionReasonState = (): SectionReasonState =>
	SECTION_REASONS.reduce((acc, section) => {
		acc[section.key] = {
			selected: false,
			reason: section.defaultReason,
		};
		return acc;
	}, {} as SectionReasonState);

export function RejectComplianceDialog({
	open,
	isRevokingApproval,
	isSubmitting,
	initialGeneralRejectedReason,
	initialSectionRejectedReason,
	onOpenChange,
	onSubmit,
}: {
	open: boolean;
	isRevokingApproval?: boolean;
	isSubmitting?: boolean;
	initialGeneralRejectedReason?: string | null;
	initialSectionRejectedReason?: SectionRejectedReason;
	onOpenChange: (open: boolean) => void;
	onSubmit: (payload: RejectComplianceSubmitPayload) => void;
}) {
	const [sectionReasonState, setSectionReasonState] = useState<SectionReasonState>(
		buildInitialSectionReasonState(),
	);
	const [generalRejectedReason, setGeneralRejectedReason] = useState("");

	useEffect(() => {
		if (!open) {
			return;
		}

		setSectionReasonState((current) => {
			const next = buildInitialSectionReasonState();
			for (const section of SECTION_REASONS) {
				const reason = initialSectionRejectedReason?.[section.key]?.trim();
				if (reason) {
					next[section.key] = {
						selected: true,
						reason,
					};
				}
			}
			return JSON.stringify(current) === JSON.stringify(next) ? current : next;
		});
		setGeneralRejectedReason(initialGeneralRejectedReason ?? "");
	}, [open, initialGeneralRejectedReason, initialSectionRejectedReason]);

	const selectedSectionSummaries = useMemo(
		() =>
			SECTION_REASONS.filter((section) => sectionReasonState[section.key].selected)
				.map((section) => ({
					title: section.title,
					reason: sectionReasonState[section.key].reason.trim(),
				}))
				.filter((item) => item.reason.length > 0),
		[sectionReasonState],
	);

	const normalizedGeneralRejectedReason = useMemo(
		() => generalRejectedReason.trim(),
		[generalRejectedReason],
	);

	const sectionRejectedReason = useMemo<SectionRejectedReasonPayload>(
		() =>
			SECTION_REASONS.reduce((acc, section) => {
				const sectionState = sectionReasonState[section.key];
				acc[section.key] =
					sectionState.selected && sectionState.reason.trim().length > 0
						? sectionState.reason.trim()
						: null;
				return acc;
			}, {} as SectionRejectedReasonPayload),
		[sectionReasonState],
	);

	const canSubmit =
		selectedSectionSummaries.length > 0 ||
		normalizedGeneralRejectedReason.length > 0;

	const toggleSection = (key: SectionReasonKey) => {
		setSectionReasonState((current) => ({
			...current,
			[key]: {
				...current[key],
				selected: !current[key].selected,
			},
		}));
	};

	const updateSectionReasonText = (key: SectionReasonKey, reason: string) => {
		setSectionReasonState((current) => ({
			...current,
			[key]: {
				...current[key],
				reason,
			},
		}));
	};

	const handleSubmit = () => {
		if (!canSubmit) {
			return;
		}

		onSubmit({
			general_rejected_reason: normalizedGeneralRejectedReason,
			section_rejected_reason: sectionRejectedReason,
		});
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen && isSubmitting) {
					return;
				}

				onOpenChange(nextOpen);
			}}
		>
			<DialogContent
				className="sm:max-w-2xl"
				showCloseButton={!isSubmitting}
			>
				<DialogHeader>
					<DialogTitle className="font-semibold">
						{isRevokingApproval
							? "Revoke Compliance Approval"
							: "Reject Compliance Application"}
					</DialogTitle>
					<DialogDescription>
						{isRevokingApproval
							? "This disables the tenant's verified compliance status and notifies them with your reason."
							: "Select one or more sections, then edit the default rejection note for each section."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Section-specific Rejection Reasons</Label>
						<Accordion
							type="multiple"
							className="rounded-lg border px-3"
						>
							{SECTION_REASONS.map((section) => {
								const selected = sectionReasonState[section.key].selected;
								return (
									<AccordionItem
										key={section.key}
										value={section.key}
									>
										<AccordionTrigger className="items-center py-3 hover:no-underline">
											<div className="flex items-center gap-3">
												<Checkbox
													checked={selected}
													onCheckedChange={() => toggleSection(section.key)}
													onClick={(event) => event.stopPropagation()}
													disabled={isSubmitting}
												/>
												<span className="text-sm font-medium">
													{section.title}
												</span>
											</div>
										</AccordionTrigger>
										<AccordionContent>
											<div className="space-y-2">
												<Label htmlFor={`reason-${section.key}`}>
													Reason for {section.title}
												</Label>
												<Textarea
													id={`reason-${section.key}`}
													value={sectionReasonState[section.key].reason}
													onChange={(event) =>
														updateSectionReasonText(
															section.key,
															event.target.value,
														)
													}
													rows={3}
													disabled={isSubmitting || !selected}
												/>
											</div>
										</AccordionContent>
									</AccordionItem>
								);
							})}
						</Accordion>
					</div>

					<div className="space-y-2">
						<Label htmlFor="custom-rejection-reason">
							General Rejection Note (Optional)
						</Label>
						<Textarea
							id="custom-rejection-reason"
							value={generalRejectedReason}
							onChange={(event) =>
								setGeneralRejectedReason(event.target.value)
							}
							placeholder="Add any extra issues not tied to a specific section..."
							rows={3}
							disabled={isSubmitting}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleSubmit}
						disabled={!canSubmit || isSubmitting}
					>
						{isSubmitting
							? "Saving..."
							: isRevokingApproval
								? "Revoke Approval"
								: "Reject Application"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
