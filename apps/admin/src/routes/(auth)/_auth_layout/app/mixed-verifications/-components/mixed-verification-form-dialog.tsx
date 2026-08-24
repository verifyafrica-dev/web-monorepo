import { InfoIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { toast } from "sonner";
import { getV2ErrorMessage } from "#/api/http/shared";
import {
	useCreateMixedVerificationV2Mutation,
	useUpdateMixedVerificationV2Mutation,
} from "#/api/http/v2/verifications/verifications.hooks";
import type { MixedVerification } from "#/api/http/v2/verifications/verifications.types";
import { Alert, AlertDescription } from "@verifyafrica/ui/components/ui/alert";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Dialog,
	DialogContent,
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
	buildMixedVerificationPayload,
	EMPTY_MIXED_VERIFICATION_FORM,
	formatMixedVerificationType,
	MIXED_VERIFICATION_TYPE_OPTIONS,
	MixedVerificationFormSchema,
	toMixedVerificationFormValues,
} from "../-data";

export function MixedVerificationFormDialog({
	open,
	template,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	template?: MixedVerification | null;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}) {
	const isEditing = Boolean(template);
	const createMutation = useCreateMixedVerificationV2Mutation();
	const updateMutation = useUpdateMixedVerificationV2Mutation();
	const isSubmitting = createMutation.isPending || updateMutation.isPending;

	const form = useForm({
		defaultValues: EMPTY_MIXED_VERIFICATION_FORM,
		validators: {
			onSubmit: MixedVerificationFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				if (template) {
					const originalValues = toMixedVerificationFormValues(template);
					const payload = pickChangedFields(
						buildMixedVerificationPayload(originalValues),
						buildMixedVerificationPayload(value),
					);

					if (Object.keys(payload).length === 0) {
						return;
					}

					await updateMutation.mutateAsync({
						id: template.id,
						payload,
					});
					toast.success("Mixed verification updated");
				} else {
					const payload = buildMixedVerificationPayload(value);
					await createMutation.mutateAsync({
						payload,
					});
					toast.success("Mixed verification created");
				}

				onOpenChange(false);
				onSuccess?.();
			} catch (error) {
				toast.error(getV2ErrorMessage(error));
			}
		},
	});

	useEffect(() => {
		if (!open) {
			return;
		}

		form.reset(
			template
				? toMixedVerificationFormValues(template)
				: EMPTY_MIXED_VERIFICATION_FORM,
		);
	}, [form, open, template]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && isSubmitting) {
			return;
		}

		if (!nextOpen) {
			form.reset(
				template
					? toMixedVerificationFormValues(template)
					: EMPTY_MIXED_VERIFICATION_FORM,
			);
		}

		onOpenChange(nextOpen);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={handleOpenChange}
		>
			<DialogContent
				className="sm:max-w-2xl"
				showCloseButton={!isSubmitting}
			>
				<DialogHeader>
					<DialogTitle className="font-semibold">
						{isEditing
							? "Edit Mixed Verification"
							: "Create Mixed Verification"}
					</DialogTitle>
				</DialogHeader>

				<form
					className="flex flex-col gap-5"
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
									<FieldLabel htmlFor="mixed-verification-name">
										Name
									</FieldLabel>
									<Input
										id="mixed-verification-name"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										disabled={isSubmitting}
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>

						<form.Field name="description">
							{(field) => (
								<Field className="flex flex-col gap-2">
									<FieldLabel htmlFor="mixed-verification-description">
										Description
									</FieldLabel>
									<Textarea
										id="mixed-verification-description"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										disabled={isSubmitting}
										rows={3}
									/>
								</Field>
							)}
						</form.Field>

						<form.Field name="verifications">
							{(field) => (
								<Field
									className="flex flex-col gap-2"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<FieldLabel>Included Verification Types</FieldLabel>
									<div className="flex flex-wrap gap-2">
										{MIXED_VERIFICATION_TYPE_OPTIONS.map((verificationType) => {
											const selected =
												field.state.value.includes(verificationType);

											return (
												<Badge
													key={verificationType}
													variant={selected ? "default" : "outline"}
													className={cn(
														"cursor-pointer px-3 py-1.5 text-xs font-medium",
														selected
															? "hover:bg-primary/90"
															: "bg-muted/40 hover:bg-muted",
													)}
													onClick={() => {
														field.handleChange(
															selected
																? field.state.value.filter(
																		(item) => item !== verificationType,
																	)
																: [...field.state.value, verificationType],
														);
													}}
												>
													{formatMixedVerificationType(verificationType)}
												</Badge>
											);
										})}
									</div>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>

						<div className="grid gap-4 md:grid-cols-2">
							<form.Field name="journey_id">
								{(field) => (
									<Field
										className="flex flex-col gap-2"
										data-invalid={field.state.meta.errors.length > 0}
									>
										<FieldLabel htmlFor="mixed-verification-journey-id">
											Journey ID
										</FieldLabel>
										<Input
											id="mixed-verification-journey-id"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											disabled={isSubmitting}
											aria-invalid={field.state.meta.errors.length > 0}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>

							<form.Field name="price">
								{(field) => (
									<Field
										className="flex flex-col gap-2"
										data-invalid={field.state.meta.errors.length > 0}
									>
										<FieldLabel htmlFor="mixed-verification-price">
											Price
										</FieldLabel>
										<Input
											id="mixed-verification-price"
											value={field.state.value}
											inputMode="decimal"
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											disabled={isSubmitting}
											aria-invalid={field.state.meta.errors.length > 0}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>
						</div>

						{!isEditing ? (
							<Alert className="border-blue-200 bg-blue-50 text-blue-900">
								<InfoIcon
									className="size-4"
									weight="fill"
								/>
								<AlertDescription>
									New templates are created in Live mode.
								</AlertDescription>
							</Alert>
						) : null}

						<form.Field name="is_active">
							{(field) => (
								<div className="flex items-center gap-3">
									<Switch
										checked={field.state.value}
										disabled={isSubmitting}
										onCheckedChange={field.handleChange}
									/>
									<Label>Template is active</Label>
								</div>
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
						<form.Subscribe
							selector={(state) => !state.isDefaultValue}
						>
							{(isDirty) => (
								<Button
									type="submit"
									disabled={
										isSubmitting || (isEditing && !isDirty)
									}
								>
									{isSubmitting ? "Saving..." : "Save"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
