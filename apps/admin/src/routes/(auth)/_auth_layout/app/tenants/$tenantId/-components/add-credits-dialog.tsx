import { useForm, useStore } from "@tanstack/react-form";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import { useCreateWalletCreditV2Mutation } from "#/api/http/v2/wallet/wallet.hooks";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { Textarea } from "@verifyafrica/ui/components/ui/textarea";
import { Field, FieldError, FieldGroup, FieldLabel } from "@verifyafrica/ui/components/ui/field";

const CREDIT_REASONS = [
	{ value: "promo_credit", label: "Promotional Credit" },
	{ value: "refund_service_recovery", label: "Refund / Service Recovery" },
	{ value: "billing_adjustment", label: "Billing Adjustment" },
	{ value: "migration_account_setup", label: "Migration / Account Setup" },
	{ value: "custom", label: "Custom Reason" },
] as const;

type CreditReason = (typeof CREDIT_REASONS)[number]["value"];

type AddCreditsFormValues = {
	amount: string;
	reason: CreditReason;
	custom_reason: string;
};

const AddCreditsFormSchema = z
	.object({
		amount: z
			.string()
			.trim()
			.min(1, "Amount is required")
			.refine((value) => /^\d*\.?\d+$/.test(value), {
				message: "Enter a valid amount",
			})
			.refine((value) => Number.parseFloat(value) >= 0.01, {
				message: "Amount must be at least 0.01",
			}),
		reason: z.enum([
			"promo_credit",
			"refund_service_recovery",
			"billing_adjustment",
			"migration_account_setup",
			"custom",
		]),
		custom_reason: z.string(),
	})
	.superRefine((value, context) => {
		if (value.reason === "custom" && !value.custom_reason.trim()) {
			context.addIssue({
				code: "custom",
				path: ["custom_reason"],
				message: "Custom reason is required",
			});
		}
	});

export function AddCreditsDialog({
	open,
	tenantId,
	tenantName,
	currency = "USD",
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	tenantId: string;
	tenantName: string;
	currency?: string;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}) {
	const createCreditMutation = useCreateWalletCreditV2Mutation();
	const isSubmitting = createCreditMutation.isPending;

	const defaultValues: AddCreditsFormValues = {
		amount: "",
		reason: "billing_adjustment",
		custom_reason: "",
	};

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: AddCreditsFormSchema,
		},
		onSubmit: async ({ value }) => {
			const payload = {
				amount: Number.parseFloat(value.amount).toFixed(2),
				reason: value.reason,
				...(value.reason === "custom"
					? { custom_reason: value.custom_reason.trim() }
					: {}),
			};

			try {
				await createCreditMutation.mutateAsync({ tenantId, payload });
				toast.success(
					`Added ${currency} ${payload.amount} to ${tenantName}.`,
				);
				form.reset();
				onOpenChange(false);
				onSuccess?.();
			} catch (error) {
				toast.error(getV2ErrorMessage(error));
			}
		},
	});

	useEffect(() => {
		if (!open) {
			form.reset();
		}
	}, [open, form]);

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && isSubmitting) {
			return;
		}

		if (!nextOpen) {
			form.reset();
		}

		onOpenChange(nextOpen);
	};

	const showCustomReason = useStore(
		form.store,
		(state) => state.values.reason === "custom",
	);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md" showCloseButton={!isSubmitting}>
				<DialogHeader>
					<DialogTitle className="font-semibold">Add Credits</DialogTitle>
					<DialogDescription>
						This will add spendable wallet credits directly to{" "}
						<strong>{tenantName}</strong> and sync the balance to Stripe.
					</DialogDescription>
				</DialogHeader>

				<form
					className="flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
				>
					<FieldGroup className="gap-4">
						<form.Field name="amount">
							{(field) => (
								<Field
									className="flex flex-col gap-2"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<FieldLabel htmlFor="credit-amount">
										Amount ({currency})
									</FieldLabel>
									<Input
										id="credit-amount"
										type="text"
										inputMode="decimal"
										placeholder="0.00"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => {
											const value = event.target.value;
											if (value === "" || /^\d*\.?\d*$/.test(value)) {
												field.handleChange(value);
											}
										}}
										disabled={isSubmitting}
										autoFocus
										aria-invalid={field.state.meta.errors.length > 0}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>

						<form.Field name="reason">
							{(field) => (
								<Field
									className="flex flex-col gap-2"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<FieldLabel>Reason</FieldLabel>
									<Select
										value={field.state.value}
										onValueChange={(value) =>
											field.handleChange(value as CreditReason)
										}
										disabled={isSubmitting}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{CREDIT_REASONS.map((reason) => (
												<SelectItem key={reason.value} value={reason.value}>
													{reason.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>

						{showCustomReason ? (
							<form.Field name="custom_reason">
								{(field) => (
									<Field
										className="flex flex-col gap-2"
										data-invalid={field.state.meta.errors.length > 0}
									>
										<FieldLabel htmlFor="credit-custom-reason">
											Custom Reason
										</FieldLabel>
										<Textarea
											id="credit-custom-reason"
											placeholder="Explain why this credit is being added"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											disabled={isSubmitting}
											rows={3}
											aria-invalid={field.state.meta.errors.length > 0}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>
						) : null}
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
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Adding Credits..." : "Add Credits"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
