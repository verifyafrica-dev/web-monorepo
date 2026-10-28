import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";

import { useMixedContinue } from "../mixed-continue-context";

type VerificationSubmittedDialogProps = {
	description?: string;
	/** When set, shows a continue button for forward-only mixed flows. */
	onContinue?: () => void;
	continueLabel?: string;
};

export function VerificationSubmittedDialog({
	description = "We've received your document. You can close this page now.",
	onContinue,
	continueLabel = "Continue to next step",
}: VerificationSubmittedDialogProps) {
	const mixed = useMixedContinue();
	const showContinue = Boolean(onContinue) || Boolean(mixed?.hasNextStep);
	const handleContinue = onContinue ?? mixed?.onContinue;
	const resolvedDescription =
		mixed?.hasNextStep && !onContinue
			? "We've received this step and are processing it. Continue to the next verification."
			: mixed?.isMixed && !mixed.hasNextStep
				? "We've received all your verification steps and are processing them. You can close this page now."
				: description;

	return (
		<Dialog open>
			<DialogContent
				showCloseButton={false}
				onEscapeKeyDown={(event) => {
					event.preventDefault();
				}}
				onPointerDownOutside={(event) => {
					event.preventDefault();
				}}
				onInteractOutside={(event) => {
					event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle className="font-semibold">
						Verification submitted
					</DialogTitle>
					<DialogDescription className="text-pretty">
						{resolvedDescription}
					</DialogDescription>
				</DialogHeader>
				{showContinue && handleContinue ? (
					<DialogFooter>
						<Button
							type="button"
							className="cursor-pointer tracking-wide"
							onClick={handleContinue}
						>
							{continueLabel}
						</Button>
					</DialogFooter>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
