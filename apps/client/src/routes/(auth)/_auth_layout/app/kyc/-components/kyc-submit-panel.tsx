import {
	CheckCircleIcon,
	FileTextIcon,
	InfoIcon,
	PaperPlaneTiltIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";

import { useSubmitKycForReviewMutation } from "#/api/http/v1/kyc/kyc.hooks";
import type { SectionRejectedReason } from "#/api/http/v2/tenants/tenants.types";
import { Alert, AlertDescription, AlertTitle } from "@verifyafrica/ui/components/ui/alert";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	formatRejectedAt,
	getSectionRejectionEntries,
	parseRejectedReasons,
} from "../-utils";
import { useKyc } from "./kyc-provider";

export function KycSubmitPanel() {
	const { tenantId, allSectionsCompleted, kyc } = useKyc();
	const [submitSuccess, setSubmitSuccess] = useState(false);
	const submitMutation = useSubmitKycForReviewMutation(tenantId ?? "");
	const isKycSubmitted = kyc.kyc_status === "submitted";

	if (kyc.kyc_verified) {
		return (
			<Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
				<CheckCircleIcon className="size-4 text-emerald-600" weight="fill" />
				<AlertTitle>KYC Approved</AlertTitle>
				<AlertDescription>
					Congratulations! Your KYC verification has been approved. You now have
					access to all platform features.
				</AlertDescription>
			</Alert>
		);
	}

	if (submitSuccess || (isKycSubmitted && allSectionsCompleted)) {
		return (
			<Alert className="border-amber-200 bg-amber-50 text-amber-950">
				<FileTextIcon className="size-4 text-amber-600" weight="fill" />
				<AlertTitle>Submission Under Review</AlertTitle>
				<AlertDescription className="space-y-2">
					<p>
						Your KYC application has been submitted and is currently under
						review by our compliance team.
					</p>
					{kyc.kyc_last_submission_date && (
						<p className="text-xs text-amber-700">
							Submitted on:{" "}
							{new Date(kyc.kyc_last_submission_date).toLocaleString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</p>
					)}
					<p>
						We&apos;ll notify you via email once the review is complete. This
						typically takes 2-3 business days.
					</p>
				</AlertDescription>
			</Alert>
		);
	}

	if (!allSectionsCompleted) {
		return null;
	}

	async function handleSubmit() {
		if (!tenantId) {
			toast.error("Tenant information is unavailable");
			return;
		}

		try {
			await submitMutation.mutateAsync();
			setSubmitSuccess(true);
			toast.success(
				"KYC submitted successfully! We'll review it within 2-3 business days.",
			);
		} catch {
			toast.error("Failed to submit KYC for approval. Please try again.");
		}
	}

	return (
		<Alert className="border-sky-200 bg-sky-50 text-sky-950">
			<InfoIcon className="size-4 text-sky-600" weight="fill" />
			<AlertTitle>Ready to Submit?</AlertTitle>
			<AlertDescription className="space-y-4">
				<p>
					All sections have been completed. You can now submit your KYC
					application for review. Our team will review your submission within 2-3
					business days.
				</p>
				<Button
					type="button"
					className="cursor-pointer tracking-wide"
					disabled={submitMutation.isPending}
					onClick={() => void handleSubmit()}
				>
					<PaperPlaneTiltIcon className="size-4" />
					{submitMutation.isPending ? "Submitting..." : "Submit for Approval"}
				</Button>
			</AlertDescription>
		</Alert>
	);
}

export function KycRejectedAlert({
	show,
	rejected_at,
	general_rejected_reason,
	section_rejected_reason,
}: {
	show: boolean;
	rejected_at?: string | null;
	general_rejected_reason?: string | null;
	section_rejected_reason?: SectionRejectedReason;
}) {
	if (!show) {
		return null;
	}

	const generalReasons = parseRejectedReasons(general_rejected_reason);
	const sectionReasons = section_rejected_reason
		? getSectionRejectionEntries(section_rejected_reason)
		: [];
	const formattedRejectedAt = formatRejectedAt(rejected_at);

	return (
		<Alert variant="destructive">
			<WarningCircleIcon className="size-4" />
			<AlertTitle>KYC Rejected</AlertTitle>
			<AlertDescription className="space-y-3">
				<p>
					Your KYC submission was rejected. Please review the issues below,
					update your application, and resubmit.
				</p>
				{formattedRejectedAt && (
					<p className="text-xs opacity-90">Rejected on: {formattedRejectedAt}</p>
				)}
				{generalReasons.length > 0 && (
					<ul className="list-disc space-y-1.5 pl-5 text-sm">
						{generalReasons.map((reason) => (
							<li key={reason}>{reason}</li>
						))}
					</ul>
				)}
				{sectionReasons.length > 0 && (
					<ul className="list-disc space-y-1.5 pl-5 text-sm">
						{sectionReasons.map(({ section, reason }) => (
							<li key={`${section}-${reason}`}>
								<span className="font-medium">{section}:</span> {reason}
							</li>
						))}
					</ul>
				)}
			</AlertDescription>
		</Alert>
	);
}
