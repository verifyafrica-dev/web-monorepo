import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { toast } from "sonner";

import {
	useCreateMixedVerificationV2Mutation,
	useUpdateMixedVerificationV2Mutation,
} from "#/api/http/v2/verifications/verifications.hooks";
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
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { Switch } from "@verifyafrica/ui/components/ui/switch";
import { Textarea } from "@verifyafrica/ui/components/ui/textarea";
import { pickChangedFields } from "@verifyafrica/ui/lib/pick-changed-fields";
import { cn } from "@verifyafrica/ui/lib/utils";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import {
	buildCustomVerificationPayload,
	CUSTOM_MIXED_VERIFICATION_TYPE_OPTIONS,
	CustomVerificationFormSchema,
	formatVerificationTypeLabel,
	getCustomVerificationFormValues,
} from "../-data";

const verificationTypePillClassName = cn(
	"inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-sm transition-colors",
	"border-border bg-muted/30 text-muted-foreground hover:bg-muted/50",
	"focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
	"aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary",
);

type CustomVerificationDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tenantId: string;
	template?: MixedVerification | null;
};

export function CustomVerificationDialog({
	open,
	onOpenChange,
	tenantId,
	template,
}: CustomVerificationDialogProps) {
	const createMutation = useCreateMixedVerificationV2Mutation();
	const updateMutation = useUpdateMixedVerificationV2Mutation();
	const isEditing = Boolean(template);

	const form = useForm({
		defaultValues: getCustomVerificationFormValues(template),
		validators: {
			onSubmit: CustomVerificationFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				if (isEditing && template) {
					const payload = pickChangedFields(
						buildCustomVerificationPayload(
							getCustomVerificationFormValues(template),
						),
						buildCustomVerificationPayload(value),
					);

					if (Object.keys(payload).length === 0) {
						return;
					}

					await updateMutation.mutateAsync({
						id: template.id,
						payload,
						tenantId,
					});
					toast.success("Custom verification updated.");
				} else {
					await createMutation.mutateAsync({
						payload: {
							...buildCustomVerificationPayload(value),
							is_custom: true,
						},
						tenantId,
					});
					toast.success("Custom verification created.");
				}

				onOpenChange(false);
			} catch {
				toast.error("Failed to save custom verification.");
			}
		},
	});

	useEffect(() => {
		if (!open) {
			return;
		}

		form.reset(getCustomVerificationFormValues(template));
	}, [open, template, form]);

	const isSaving = createMutation.isPending || updateMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="font-semibold">
						{isEditing
							? "Edit Custom Verification"
							: "Create Custom Verification"}
					</DialogTitle>
					<DialogDescription>
						Build a tenant-specific mixed verification template from supported
						check types.
					</DialogDescription>
				</DialogHeader>

				<form
					className="flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						form.handleSubmit();
					}}
				>
					<FieldGroup className="flex flex-col gap-4">
						<form.Field name="name">
							{(field) => (
								<Field
									className="gap-1.5"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<FieldLabel htmlFor="custom-verification-name">
										Name
									</FieldLabel>
									<Input
										id="custom-verification-name"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="Name"
										disabled={isSaving}
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>

						<form.Field name="description">
							{(field) => (
								<Field className="gap-1.5">
									<FieldLabel htmlFor="custom-verification-description">
										Description
									</FieldLabel>
									<Textarea
										id="custom-verification-description"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="Description"
										rows={3}
										disabled={isSaving}
									/>
								</Field>
							)}
						</form.Field>

						<form.Field name="verifications">
							{(field) => (
								<Field
									className="gap-3"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<div>
										<p className="text-sm font-medium">
											Included Verification Types
										</p>
										<p className="mt-1 text-xs text-muted-foreground">
											Selecting Address Verification will require a full address
											when this template is started.
										</p>
									</div>

									<fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0">
										<legend className="sr-only">
											Included verification types
										</legend>
										{CUSTOM_MIXED_VERIFICATION_TYPE_OPTIONS.map((type) => {
											const isSelected = field.state.value.includes(type);

											return (
												<button
													key={type}
													type="button"
													aria-pressed={isSelected}
													disabled={isSaving}
													className={verificationTypePillClassName}
													onClick={() => {
														const current = field.state.value;

														field.handleChange(
															isSelected
																? current.filter((item) => item !== type)
																: [...current, type],
														);
													}}
												>
													{formatVerificationTypeLabel(type)}
												</button>
											);
										})}
									</fieldset>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>

						<form.Field name="is_active">
							{(field) => (
								<Field className="gap-1.5">
									<div className="flex items-center gap-3">
										<Switch
											id="custom-verification-active"
											checked={field.state.value}
											onCheckedChange={(checked) =>
												field.handleChange(checked === true)
											}
											disabled={isSaving}
										/>
										<Label htmlFor="custom-verification-active">
											Template is active
										</Label>
									</div>
								</Field>
							)}
						</form.Field>
					</FieldGroup>

					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							className="cursor-pointer tracking-wide"
							disabled={isSaving}
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<form.Subscribe selector={(state) => !state.isDefaultValue}>
							{(isDirty) => (
								<Button
									type="submit"
									className="cursor-pointer tracking-wide"
									disabled={isSaving || (isEditing && !isDirty)}
								>
									{isSaving ? "Saving..." : "Save"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
