import { toast } from "sonner";

import { useDeleteMixedVerificationV2Mutation } from "#/api/http/v2/verifications/verifications.hooks";
import type { MixedVerification } from "#/api/http/v2/verifications/verifications.types";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@verifyafrica/ui/components/ui/alert-dialog";
import { Button } from "@verifyafrica/ui/components/ui/button";

type DeleteCustomVerificationDialogProps = {
	open: boolean;
	template: MixedVerification | null;
	onOpenChange: (open: boolean) => void;
};

export function DeleteCustomVerificationDialog({
	open,
	template,
	onOpenChange,
}: DeleteCustomVerificationDialogProps) {
	const deleteMutation = useDeleteMixedVerificationV2Mutation();

	async function handleDelete() {
		if (!template) {
			return;
		}

		try {
			await deleteMutation.mutateAsync(template.id);
			toast.success("Custom verification deleted.");
			onOpenChange(false);
		} catch {
			toast.error("Failed to delete custom verification.");
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="font-semibold">
						Delete Custom Verification
					</AlertDialogTitle>
					<AlertDialogDescription>
						Delete <strong>{template?.name}</strong>? This removes it from your
						tenant catalog.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={deleteMutation.isPending}>
						Cancel
					</AlertDialogCancel>
					<Button
						type="button"
						variant="destructive"
						className="cursor-pointer"
						disabled={deleteMutation.isPending}
						onClick={() => void handleDelete()}
					>
						{deleteMutation.isPending ? "Deleting..." : "Delete"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
