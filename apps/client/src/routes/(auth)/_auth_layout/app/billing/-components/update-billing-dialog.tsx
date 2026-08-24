import { BuildingsIcon } from "@phosphor-icons/react";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
	useCreateBillingInformationV2Mutation,
	useUpdateTenantBillingInformationV2Mutation,
} from "#/api/http/v2/billing/billing.hooks";
import type { BillingInformation } from "#/api/http/v2/billing/billing.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { hasChangedFields } from "#/lib/pick-changed-fields";
import {
	type BillingFormState,
	EMPTY_BILLING_FORM,
	getBillingFormState,
	getBillingInformationCreatePayload,
	getBillingInformationUpdatePayload,
} from "../-data";
import { BillingInformationFormFields } from "./billing-information-form-fields";

export function UpdateBillingDialog({
	open,
	onOpenChange,
	billingInfo,
	tenantId,
}: ComponentProps<typeof Dialog> & {
	billingInfo?: BillingInformation;
	tenantId?: string;
}) {
	const [form, setForm] = useState<BillingFormState>(EMPTY_BILLING_FORM);
	const createMutation = useCreateBillingInformationV2Mutation();
	const updateMutation = useUpdateTenantBillingInformationV2Mutation(
		tenantId ?? "",
	);
	const originalForm = useMemo(
		() => getBillingFormState(billingInfo),
		[billingInfo],
	);
	const isEditing = Boolean(billingInfo);
	const hasChanges = isEditing
		? hasChangedFields(originalForm, form)
		: true;

	const isSaving = createMutation.isPending || updateMutation.isPending;

	useEffect(() => {
		if (open) {
			setForm(getBillingFormState(billingInfo));
		}
	}, [open, billingInfo]);

	function updateField<K extends keyof BillingFormState>(
		field: K,
		value: BillingFormState[K],
	) {
		setForm((current) => ({ ...current, [field]: value }));
	}

	function handleSubmit() {
		if (billingInfo) {
			const payload = getBillingInformationUpdatePayload(originalForm, form);

			if (Object.keys(payload).length === 0) {
				return;
			}

			updateMutation.mutate(payload, {
				onSuccess: () => {
					toast.success("Billing information updated");
					onOpenChange?.(false);
				},
				onError: () => {
					toast.error("Failed to update billing information");
				},
			});
			return;
		}

		if (!tenantId) {
			toast.error("Tenant information is unavailable");
			return;
		}

		createMutation.mutate(getBillingInformationCreatePayload(form, tenantId), {
			onSuccess: () => {
				toast.success("Billing information saved");
				onOpenChange?.(false);
			},
			onError: () => {
				toast.error("Failed to save billing information");
			},
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 font-semibold">
						<BuildingsIcon className="size-5 text-primary" weight="duotone" />
						Update Billing Information
					</DialogTitle>
				</DialogHeader>

				<BillingInformationFormFields
					form={form}
					onFieldChange={updateField}
					isEmailDisabled={Boolean(billingInfo)}
				/>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						className="cursor-pointer"
						onClick={() => onOpenChange?.(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						className="cursor-pointer"
						disabled={isSaving || !hasChanges}
						onClick={handleSubmit}
					>
						{isSaving ? "Saving..." : "Update Billing Info"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
