import { toast } from "sonner";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import { useAdminResetUserPasswordV2Mutation } from "#/api/http/v2/users/users.hooks";
import type { AdminUser } from "#/api/http/v2/users/users.types";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@verifyafrica/ui/components/ui/alert-dialog";

export function ResetPasswordDialog({
	open,
	user,
	onOpenChange,
}: {
	open: boolean;
	user: AdminUser | null;
	onOpenChange: (open: boolean) => void;
}) {
	if (!user) {
		return null;
	}

	return (
		<ResetPasswordDialogContent
			open={open}
			user={user}
			onOpenChange={onOpenChange}
		/>
	);
}

function ResetPasswordDialogContent({
	open,
	user,
	onOpenChange,
}: {
	open: boolean;
	user: AdminUser;
	onOpenChange: (open: boolean) => void;
}) {
	const resetPasswordMutation = useAdminResetUserPasswordV2Mutation(user.id);
	const isSubmitting = resetPasswordMutation.isPending;

	const handleReset = async () => {
		try {
			await resetPasswordMutation.mutateAsync();
			toast.success(`Password reset email sent to ${user.email}`);
			onOpenChange(false);
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
	};

	return (
		<AlertDialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen && isSubmitting) {
					return;
				}

				onOpenChange(nextOpen);
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Reset Password?</AlertDialogTitle>
					<AlertDialogDescription>
						A new temporary password will be generated and emailed to{" "}
						<strong>{user.email}</strong>. This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						disabled={isSubmitting}
						onClick={(event) => {
							event.preventDefault();
							void handleReset();
						}}
					>
						{isSubmitting ? "Resetting..." : "Reset Password"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
