import { toast } from "sonner";

import { useUpdateTenantUserMembershipV2Mutation } from "#/api/http/v2/tenants/tenants.hooks";
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
import type { ActiveUser } from "../active-users/-data";

export type TeamMembershipAction = "activate" | "deactivate";

type TeamMembershipDialogProps = {
	user: ActiveUser | null;
	action: TeamMembershipAction | null;
	tenantId?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
};

export function TeamMembershipDialog({
	user,
	action,
	tenantId,
	open,
	onOpenChange,
	onSuccess,
}: TeamMembershipDialogProps) {
	const updateMembershipMutation = useUpdateTenantUserMembershipV2Mutation(
		tenantId ?? "",
	);

	if (!user || !action) {
		return null;
	}

	const isDeactivating = action === "deactivate";
	const displayName = user.name || user.email;
	const isPending = updateMembershipMutation.isPending;

	async function handleConfirm() {
		if (!tenantId || !user) {
			toast.error("Tenant information is unavailable");
			return;
		}

		try {
			await updateMembershipMutation.mutateAsync({
				userId: user.id,
				membership_active: !isDeactivating,
			});

			toast.success(
				isDeactivating
					? `${displayName} has been deactivated`
					: `${displayName} has been reactivated`,
			);
			onSuccess?.();
			onOpenChange(false);
		} catch {
			toast.error(
				isDeactivating
					? "Failed to deactivate user. Please try again."
					: "Failed to reactivate user. Please try again.",
			);
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isDeactivating ? "Deactivate user?" : "Reactivate user?"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isDeactivating ? (
							<>
								This will revoke tenant access for{" "}
								<span className="font-medium text-foreground">
									{displayName}
								</span>
								. You can reactivate them later without removing their account.
							</>
						) : (
							<>
								This will restore tenant access for{" "}
								<span className="font-medium text-foreground">
									{displayName}
								</span>
								.
							</>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant={isDeactivating ? "destructive" : "default"}
						disabled={isPending || !tenantId}
						onClick={(event) => {
							event.preventDefault();
							void handleConfirm();
						}}
					>
						{isPending
							? isDeactivating
								? "Deactivating..."
								: "Reactivating..."
							: isDeactivating
								? "Deactivate"
								: "Reactivate"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
