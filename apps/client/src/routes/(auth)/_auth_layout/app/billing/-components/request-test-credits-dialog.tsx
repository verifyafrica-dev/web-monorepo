import { EnvelopeSimpleIcon, WalletIcon } from "@phosphor-icons/react";
import type { ComponentProps } from "react";

import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import {
	BILLING_SUPPORT_EMAIL,
	getTestCreditRequestMailto,
} from "../-data";

type RequestTestCreditsDialogProps = ComponentProps<typeof Dialog> & {
	userEmail?: string;
	tenantId?: string;
	tenantName?: string;
	balanceLabel?: string;
};

export function RequestTestCreditsDialog({
	open,
	onOpenChange,
	userEmail,
	tenantId,
	tenantName,
	balanceLabel,
}: RequestTestCreditsDialogProps) {
	const mailto = getTestCreditRequestMailto({
		userEmail,
		tenantId,
		tenantName,
		balanceLabel,
	});

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<WalletIcon
							className="size-5 text-primary"
							weight="duotone"
						/>
						Request more credits
					</DialogTitle>
					<DialogDescription>
						Card payments are not available in the test environment. Email
						support and we will add credits to your wallet.
					</DialogDescription>
				</DialogHeader>

				<div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
					<p className="text-muted-foreground">Send your request to</p>
					<p className="mt-1 font-medium">{BILLING_SUPPORT_EMAIL}</p>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						className="cursor-pointer"
						onClick={() => onOpenChange?.(false)}
					>
						Close
					</Button>
					<Button
						type="button"
						className="cursor-pointer"
						asChild
					>
						<a href={mailto}>
							<EnvelopeSimpleIcon
								className="size-4"
								weight="bold"
							/>
							Email support
						</a>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
