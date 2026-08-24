import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";

export function VerificationSubmittedDialog() {
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
						We&apos;ve received your document. You can close this page now.
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
