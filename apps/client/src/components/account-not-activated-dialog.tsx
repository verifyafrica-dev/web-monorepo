import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@verifyafrica/ui/components/ui/alert-dialog";

export const ACCOUNT_NOT_ACTIVATED_TITLE = "Account not activated";

/** Absolute link to the activation page for this email, on the current dashboard origin. */
export function getActivationLink(email: string) {
	const origin =
		typeof window === "undefined"
			? "https://dashboard.verifyafrica.io"
			: window.location.origin;
	return `${origin}/activate-account?email=${encodeURIComponent(email)}`;
}

export function AccountNotActivatedDialog({
	open,
	email,
	onOpenChange,
}: {
	open: boolean;
	email: string;
	onOpenChange: (open: boolean) => void;
}) {
	const link = getActivationLink(email);

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{ACCOUNT_NOT_ACTIVATED_TITLE}</AlertDialogTitle>
					<AlertDialogDescription>
						Click on the link{" "}
						<a
							href={link}
							className="font-medium break-all text-foreground underline underline-offset-2"
						>
							{link}
						</a>{" "}
						to activate your account and enter the OTP sent to your email.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogAction>Okay</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
