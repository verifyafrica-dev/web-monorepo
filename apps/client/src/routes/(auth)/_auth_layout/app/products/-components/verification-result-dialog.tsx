import { Link } from "@tanstack/react-router";

import type { VerificationRequest } from "#/api/http/v2/verifications/verifications.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import type { HostedLinkResult } from "@verifyafrica/api-client/lib/verification-links";

import { HostedVerificationLinkCard } from "./hosted-verification-link-card";

type VerificationResultDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	linkResult: HostedLinkResult | null;
	verification: VerificationRequest | null;
	onStartNew: () => void;
	description?: string;
};

export function VerificationResultDialog({
	open,
	onOpenChange,
	linkResult,
	verification,
	onStartNew,
	description = "Your verification request was created successfully.",
}: VerificationResultDialogProps) {
	const verificationId =
		verification?.id ?? linkResult?.hostedLink?.verification_id ?? null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="font-semibold">
						Verification Request Submitted
					</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				{linkResult ? <HostedVerificationLinkCard linkResult={linkResult} /> : null}

				{verification ? (
					<div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4 text-sm text-emerald-900">
						Verification completed successfully. View the report for the full
						result.
					</div>
				) : null}

				<DialogFooter className="gap-2 sm:justify-between">
					<Button
						type="button"
						variant="outline"
						className="cursor-pointer"
						onClick={onStartNew}
					>
						Start New Verification
					</Button>
					{verificationId ? (
						<Button type="button" className="cursor-pointer" asChild>
							<Link
								to="/app/reports/$id"
								params={{ id: verificationId }}
							>
								View Report
							</Link>
						</Button>
					) : null}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
