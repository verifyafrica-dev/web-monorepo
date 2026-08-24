import { toast } from "sonner";
import { useDeleteTenantInvitationMutation } from "#/api/http/v1/tenants/tenants.hooks";
import { useRemoveTenantUserV2Mutation } from "#/api/http/v2/tenants/tenants.hooks";
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

export type DeleteUserDialogTarget = {
	id: string;
	email: string;
	name?: string;
};

type DeleteUserDialogProps = {
	target: DeleteUserDialogTarget | null;
	type: "invitation" | "user";
	tenantId?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: (target: DeleteUserDialogTarget) => void;
};

export function DeleteUserDialog({
	target,
	type,
	tenantId,
	open,
	onOpenChange,
	onSuccess,
}: DeleteUserDialogProps) {
	const removeUserMutation = useRemoveTenantUserV2Mutation(tenantId ?? "");
	const deleteInvitationMutation = useDeleteTenantInvitationMutation(
		tenantId ?? "",
	);

	if (!target) {
		return null;
	}

	const isInvitation = type === "invitation";
	const displayName = target.name ?? target.email;
	const isDeleting =
		removeUserMutation.isPending || deleteInvitationMutation.isPending;

	async function handleConfirm() {
		if (!tenantId || !target) {
			toast.error("Tenant information is unavailable");
			return;
		}

		const deleteTarget = target;

		try {
			if (isInvitation) {
				await deleteInvitationMutation.mutateAsync(deleteTarget.id);
				toast.success("Invitation deleted successfully");
			} else {
				await removeUserMutation.mutateAsync(deleteTarget.id);
				toast.success("User removed successfully");
			}

			onSuccess?.(deleteTarget);
			onOpenChange(false);
		} catch {
			toast.error(
				isInvitation
					? "Failed to delete invitation. Please try again."
					: "Failed to remove user. Please try again.",
			);
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isInvitation ? "Delete invitation?" : "Delete user?"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isInvitation ? (
							<>
								This will permanently remove the invitation sent to{" "}
								<span className="font-medium text-foreground">
									{target.email}
								</span>
								. This action cannot be undone.
							</>
						) : (
							<>
								Removing a user will also remove their access to the tenant. Are
								you sure you want to remove{" "}
								<span className="font-medium text-foreground">
									{displayName}
								</span>
								? This action cannot be undone.
							</>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={isDeleting || !tenantId}
						onClick={(event) => {
							event.preventDefault();
							void handleConfirm();
						}}
					>
						{isDeleting ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
