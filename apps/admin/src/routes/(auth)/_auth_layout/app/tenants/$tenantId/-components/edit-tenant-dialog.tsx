import {
	BuildingsIcon,
	EnvelopeSimpleIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { toast } from "sonner";
import { getV2ErrorMessage } from "#/api/http/shared";
import { useUpdateTenantV2Mutation } from "#/api/http/v2/tenants/tenants.hooks";
import { TenantUpdateSchema } from "#/api/http/v2/tenants/tenants.types";
import { pickChangedFields } from "#/lib/pick-changed-fields";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@verifyafrica/ui/components/ui/field";

const EditTenantFormSchema = TenantUpdateSchema.pick({
	name: true,
	email: true,
}).required();

type EditTenantFormValues = {
	name: string;
	email: string;
};

export function EditTenantDialog({
	open,
	tenantId,
	tenantName,
	tenantEmail,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	tenantId: string;
	tenantName: string;
	tenantEmail: string;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}) {
	const updateTenantMutation = useUpdateTenantV2Mutation(tenantId);
	const isSubmitting = updateTenantMutation.isPending;

	const form = useForm({
		defaultValues: {
			name: tenantName,
			email: tenantEmail,
		} satisfies EditTenantFormValues,
		validators: {
			onSubmit: EditTenantFormSchema,
		},
		onSubmit: async ({ value }) => {
			const payload = pickChangedFields(
				{
					name: tenantName.trim(),
					email: tenantEmail.trim(),
				},
				{
					name: value.name.trim(),
					email: value.email.trim(),
				},
			);

			if (Object.keys(payload).length === 0) {
				return;
			}

			try {
				await updateTenantMutation.mutateAsync(payload);
				toast.success("Tenant updated successfully");
				onOpenChange(false);
				onSuccess?.();
			} catch (error) {
				toast.error(getV2ErrorMessage(error));
			}
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				name: tenantName,
				email: tenantEmail,
			});
		}
	}, [form, open, tenantEmail, tenantName]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && isSubmitting) {
			return;
		}

		if (!nextOpen) {
			form.reset({
				name: tenantName,
				email: tenantEmail,
			});
		}

		onOpenChange(nextOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md" showCloseButton={!isSubmitting}>
				<DialogHeader>
					<DialogTitle className="font-semibold">Edit Tenant</DialogTitle>
				</DialogHeader>

				<form
					className="flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
				>
					<FieldGroup className="gap-4">
						<form.Field name="name">
							{(field) => (
								<Field
									className="flex flex-col gap-2"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<FieldLabel htmlFor="edit-tenant-name">Tenant Name</FieldLabel>
									<div className="relative">
										<BuildingsIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="edit-tenant-name"
											className="pl-9"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											disabled={isSubmitting}
											autoFocus
											aria-invalid={field.state.meta.errors.length > 0}
										/>
									</div>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>

						<form.Field name="email">
							{(field) => (
								<Field
									className="flex flex-col gap-2"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<FieldLabel htmlFor="edit-tenant-email">
										Tenant Email
									</FieldLabel>
									<div className="relative">
										<EnvelopeSimpleIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="edit-tenant-email"
											type="email"
											className="pl-9"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											disabled={isSubmitting}
											aria-invalid={field.state.meta.errors.length > 0}
										/>
									</div>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>
					</FieldGroup>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<form.Subscribe selector={(state) => !state.isDefaultValue}>
							{(isDirty) => (
								<Button
									type="submit"
									disabled={isSubmitting || !isDirty}
								>
									{isSubmitting ? "Saving..." : "Save Changes"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
