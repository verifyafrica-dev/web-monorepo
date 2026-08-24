import { toast } from "sonner";
import { getV2ErrorMessage } from "#/api/http/shared";
import { useDeleteMixedVerificationV2Mutation } from "#/api/http/v2/verifications/verifications.hooks";
import type { MixedVerification } from "#/api/http/v2/verifications/verifications.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";

export function DeleteMixedVerificationDialog({
	open,
	template,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	template: MixedVerification | null;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}) {
	const deleteMutation = useDeleteMixedVerificationV2Mutation();
	const isDeleting = deleteMutation.isPending;

	const handleClose = () => {
		if (isDeleting) {
			return;
		}

		onOpenChange(false);
	};

	const handleDelete = async () => {
		if (!template) {
			return;
		}

		try {
			await deleteMutation.mutateAsync(template.id);
			toast.success("Mixed verification deleted");
			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
	};

	if (!template) {
		return null;
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					handleClose();
					return;
				}

				onOpenChange(nextOpen);
			}}
		>
			<DialogContent
				className="sm:max-w-md"
				showCloseButton={!isDeleting}
			>
				<DialogHeader>
					<DialogTitle className="font-semibold">
						Delete Mixed Verification
					</DialogTitle>
					<DialogDescription className="text-sm leading-relaxed">
						Delete <span className="font-semibold text-foreground">{template.name}</span>
						? This action will remove the template from the active catalog and
						cannot be undone from the dashboard.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={() => void handleDelete()}
						disabled={isDeleting}
					>
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
