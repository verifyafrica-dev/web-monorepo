import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@verifyafrica/ui/components/ui/alert-dialog";
import {
	TEST_ACCOUNT_BLOCKED_DESCRIPTION,
	TEST_ACCOUNT_BLOCKED_SUPPORT_EMAIL,
	TEST_ACCOUNT_BLOCKED_TITLE,
} from "#/lib/test-account-blocked";

export const ACCOUNT_BLOCKED_STORAGE_KEY = "va_account_blocked";

export function AccountBlockedDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{TEST_ACCOUNT_BLOCKED_TITLE}</AlertDialogTitle>
					<AlertDialogDescription>
						{TEST_ACCOUNT_BLOCKED_DESCRIPTION}{" "}
						<a
							href={`mailto:${TEST_ACCOUNT_BLOCKED_SUPPORT_EMAIL}`}
							className="font-medium text-foreground underline underline-offset-2"
						>
							{TEST_ACCOUNT_BLOCKED_SUPPORT_EMAIL}
						</a>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogAction>Okay</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
