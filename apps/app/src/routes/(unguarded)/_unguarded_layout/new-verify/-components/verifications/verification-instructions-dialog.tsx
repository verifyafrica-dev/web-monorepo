import { useEffect, useState } from "react";

import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";

const INSTRUCTIONS_LOCK_MS = 2_000;

type VerificationInstructionsDialogProps = {
	instructions: string;
};

export function VerificationInstructionsDialog({
	instructions,
}: VerificationInstructionsDialogProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [canDismiss, setCanDismiss] = useState(false);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setCanDismiss(true);
		}, INSTRUCTIONS_LOCK_MS);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, []);

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open && !canDismiss) {
					return;
				}

				setIsOpen(open);
			}}
		>
			<DialogContent
				showCloseButton={canDismiss}
				onEscapeKeyDown={(event) => {
					if (!canDismiss) {
						event.preventDefault();
					}
				}}
				onPointerDownOutside={(event) => {
					if (!canDismiss) {
						event.preventDefault();
					}
				}}
				onInteractOutside={(event) => {
					if (!canDismiss) {
						event.preventDefault();
					}
				}}
			>
				<DialogHeader>
					<DialogTitle className="font-semibold">
						Verification instructions
					</DialogTitle>
					<DialogDescription className="text-pretty whitespace-pre-wrap">
						{instructions}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						type="button"
						className="w-full sm:w-auto"
						disabled={!canDismiss}
						onClick={() => setIsOpen(false)}
					>
						Got it
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
