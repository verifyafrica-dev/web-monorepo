import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";

type VerificationSubmittedDialogProps = {
	description?: string;
};

export function VerificationSubmittedDialog({
	description = "We've received your document. You can close this page now.",
}: VerificationSubmittedDialogProps) {
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
						{description}
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
