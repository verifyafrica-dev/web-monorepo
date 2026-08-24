import { CheckIcon, CopyIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";

import { useSendVerificationEmailV2Mutation } from "#/api/http/v2/verifications/verifications.hooks";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import type { HostedLinkResult } from "#/lib/verification-links";

type HostedVerificationLinkCardProps = {
	linkResult: HostedLinkResult;
};

export function HostedVerificationLinkCard({
	linkResult,
}: HostedVerificationLinkCardProps) {
	const [copiedUrl, setCopiedUrl] = useState(false);
	const sendEmailMutation = useSendVerificationEmailV2Mutation();
	const verificationId = linkResult.hostedLink?.verification_id;
	const canSendEmail = Boolean(verificationId && linkResult.customerEmail);

	async function handleCopyUrl() {
		if (!linkResult.verificationUrl) {
			return;
		}

		await navigator.clipboard.writeText(linkResult.verificationUrl);
		setCopiedUrl(true);
		setTimeout(() => setCopiedUrl(false), 2000);
	}

	async function handleSendEmail() {
		if (!verificationId) {
			return;
		}

		try {
			await sendEmailMutation.mutateAsync(verificationId);
			toast.success("Verification email sent successfully.");
		} catch {
			toast.error("Unable to send verification email right now.");
		}
	}

	return (
		<Card className="border-emerald-200 bg-emerald-50/40">
			<CardContent className="space-y-4 pt-0">
				<p className="text-sm text-emerald-900">
					A verification link has been created and emailed to your customer.
					You can still copy the URL or resend the email.
				</p>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-1">
						<p className="text-xs font-medium text-muted-foreground">
							Customer Email
						</p>
						<p className="text-sm">{linkResult.customerEmail}</p>
					</div>

					{linkResult.expirationTime ? (
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">
								Expiration Time
							</p>
							<p className="text-sm">{linkResult.expirationTime}</p>
						</div>
					) : null}

					{linkResult.hostedLink ? (
						<>
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground">
									Link Token
								</p>
								<p className="font-mono text-sm">{linkResult.hostedLink.link}</p>
							</div>
							<div className="space-y-1">
								<p className="text-xs font-medium text-muted-foreground">
									Verification Reference
								</p>
								<p className="text-sm">
									{linkResult.hostedLink.verification_reference}
								</p>
							</div>
						</>
					) : null}
				</div>

				<div className="space-y-2">
					<p className="text-xs font-medium text-muted-foreground">
						Verification URL
					</p>
					<div className="flex items-start gap-2 rounded-md border bg-background p-3">
						<p className="min-w-0 flex-1 break-all font-mono text-sm">
							{linkResult.verificationUrl}
						</p>
						<div className="flex shrink-0 items-center gap-1">
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={() => void handleCopyUrl()}
								aria-label="Copy verification URL"
							>
								{copiedUrl ? (
									<CheckIcon className="size-4 text-emerald-600" />
								) : (
									<CopyIcon className="size-4" />
								)}
							</Button>
							{canSendEmail ? (
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									disabled={sendEmailMutation.isPending}
									onClick={() => void handleSendEmail()}
									aria-label="Send verification email"
								>
									<EnvelopeSimpleIcon className="size-4" />
								</Button>
							) : null}
						</div>
					</div>
				</div>

				{linkResult.verificationUrl ? (
					<Button
						type="button"
						className="cursor-pointer"
						onClick={() =>
							window.open(linkResult.verificationUrl, "_blank", "noopener,noreferrer")
						}
					>
						Start Verification
					</Button>
				) : null}
			</CardContent>
		</Card>
	);
}
