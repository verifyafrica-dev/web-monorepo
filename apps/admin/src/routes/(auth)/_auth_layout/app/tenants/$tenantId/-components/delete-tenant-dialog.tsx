import { WarningIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import type { V2AxiosError } from "#/api/http/shared";
import { useDeleteTenantV2Mutation } from "#/api/http/v2/tenants/tenants.hooks";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { DELETE_CONFIRM_ITEMS } from "../-constants";

export function DeleteTenantDialog({
	open,
	tenantId,
	tenantName,
	onOpenChange,
	onDeleted,
}: {
	open: boolean;
	tenantId: string;
	tenantName: string;
	onOpenChange: (open: boolean) => void;
	onDeleted: () => void;
}) {
	const [confirmText, setConfirmText] = useState("");
	const deleteTenantMutation = useDeleteTenantV2Mutation();
	const isDeleting = deleteTenantMutation.isPending;
	const isConfirmed = confirmText === tenantName;

	const handleClose = () => {
		if (isDeleting) {
			return;
		}

		setConfirmText("");
		onOpenChange(false);
	};

	const handleDelete = () => {
		if (!isConfirmed) {
			toast.error("Please type the tenant name correctly to confirm deletion");
			return;
		}

		deleteTenantMutation.mutate(tenantId, {
			onSuccess: () => {
				toast.success(`Tenant "${tenantName}" deleted successfully`);
				setConfirmText("");
				onOpenChange(false);
				onDeleted();
			},
			onError: (error) => {
				const axiosError = error as V2AxiosError;
				toast.error(
					axiosError.response?.data?.message ||
						"Failed to delete tenant. Please try again.",
				);
			},
		});
	};

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
			<DialogContent className="sm:max-w-lg" showCloseButton={!isDeleting}>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 font-semibold">
						<WarningIcon className="size-5 text-red-600" weight="fill" />
						Delete Tenant
					</DialogTitle>
					<DialogDescription>
						This soft-deletes the tenant on the platform. Associated data will
						no longer be accessible through normal admin flows.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
						<p className="font-medium">This action cannot be undone.</p>
						<p className="mt-2">This will permanently delete:</p>
						<ul className="mt-2 list-disc space-y-1 pl-5">
							{DELETE_CONFIRM_ITEMS.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</div>

					<div className="space-y-2">
						<Label htmlFor="delete-confirm">
							Please type{" "}
							<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
								{tenantName}
							</span>{" "}
							to confirm deletion
						</Label>
						<Input
							id="delete-confirm"
							value={confirmText}
							onChange={(event) => setConfirmText(event.target.value)}
							placeholder="Type tenant name here"
							disabled={isDeleting}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose} disabled={isDeleting}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={!isConfirmed || isDeleting}
					>
						{isDeleting ? "Deleting..." : "Delete Tenant"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
