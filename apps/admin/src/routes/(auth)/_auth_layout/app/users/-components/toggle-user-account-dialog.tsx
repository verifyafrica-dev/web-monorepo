import { toast } from "sonner";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import { useUpdateUserV2DetailMutation } from "#/api/http/v2/users/users.hooks";
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

export function ToggleUserAccountDialog({
	open,
	user,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	user: AdminUser | null;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}) {
	if (!user) {
		return null;
	}

	return (
		<ToggleUserAccountDialogContent
			open={open}
			user={user}
			onOpenChange={onOpenChange}
			onSuccess={onSuccess}
		/>
	);
}

function ToggleUserAccountDialogContent({
	open,
	user,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	user: AdminUser;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}) {
	const updateUserMutation = useUpdateUserV2DetailMutation(user.id);
	const isSubmitting = updateUserMutation.isPending;
	const isEnabling = !user.is_active;

	const handleConfirm = async () => {
		try {
			await updateUserMutation.mutateAsync({ is_active: !user.is_active });
			toast.success(
				`User account ${isEnabling ? "enabled" : "disabled"} successfully`,
			);
			onOpenChange(false);
			onSuccess?.();
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
					<AlertDialogTitle>
						{isEnabling ? "Enable Account?" : "Disable Account?"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to {isEnabling ? "enable" : "disable"} the
						account for <strong>{user.email}</strong>?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant={isEnabling ? "default" : "destructive"}
						disabled={isSubmitting}
						onClick={(event) => {
							event.preventDefault();
							void handleConfirm();
						}}
					>
						{isSubmitting
							? "Saving..."
							: isEnabling
								? "Enable Account"
								: "Disable Account"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
