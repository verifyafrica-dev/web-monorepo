import {
	BuildingsIcon,
	CreditCardIcon,
	EnvelopeSimpleIcon,
	FloppyDiskIcon,
	InfoIcon,
	UserIcon,
} from "@phosphor-icons/react";
import { type ReactNode, useMemo, useState } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import { useCreateBillingInformationV2Mutation } from "#/api/http/v2/billing/billing.hooks";
import type { BillingPlan } from "#/api/http/v2/billing/billing.types";
import { useCreateTenantV2Mutation } from "#/api/http/v2/tenants/tenants.hooks";
import { Alert, AlertDescription } from "@verifyafrica/ui/components/ui/alert";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { PhoneInput } from "@verifyafrica/ui/components/ui-extended/phone-input";
import { cn } from "@verifyafrica/ui/lib/utils";
import { getBillingPlanLabel } from "../-data";

type AddTenantFormState = {
	name: string;
	email: string;
	admin_first_name: string;
	admin_last_name: string;
	admin_email: string;
	admin_phone_number: string;
	plan: BillingPlan;
};

type FormErrors = Partial<Record<keyof AddTenantFormState, string>>;

const INITIAL_FORM_STATE: AddTenantFormState = {
	name: "",
	email: "",
	admin_first_name: "",
	admin_last_name: "",
	admin_email: "",
	admin_phone_number: "",
	plan: "payg",
};

function isEmail(value: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function Field({
	label,
	error,
	children,
	className,
}: {
	label: string;
	error?: string;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<Label>
				{label} <span className="text-destructive">*</span>
			</Label>
			{children}
			{error ? <p className="text-xs text-destructive">{error}</p> : null}
		</div>
	);
}

function IconInput({
	icon: Icon,
	...props
}: React.ComponentProps<typeof Input> & {
	icon: typeof BuildingsIcon;
}) {
	return (
		<div className="relative">
			<Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input className="pl-9" {...props} />
		</div>
	);
}

export function AddTenantDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [formData, setFormData] = useState<AddTenantFormState>(INITIAL_FORM_STATE);
	const [errors, setErrors] = useState<FormErrors>({});
	const createTenantMutation = useCreateTenantV2Mutation();
	const createBillingMutation = useCreateBillingInformationV2Mutation();
	const isSubmitting =
		createTenantMutation.isPending || createBillingMutation.isPending;

	const adminFullName = useMemo(
		() =>
			[formData.admin_first_name, formData.admin_last_name]
				.filter(Boolean)
				.join(" "),
		[formData.admin_first_name, formData.admin_last_name],
	);

	const isFormComplete = useMemo(() => {
		return (
			formData.name.trim().length >= 2 &&
			isEmail(formData.email) &&
			formData.admin_first_name.trim().length >= 2 &&
			formData.admin_last_name.trim().length >= 2 &&
			isEmail(formData.admin_email) &&
			Boolean(formData.admin_phone_number) &&
			isValidPhoneNumber(formData.admin_phone_number)
		);
	}, [formData]);

	const updateField = <K extends keyof AddTenantFormState>(
		field: K,
		value: AddTenantFormState[K],
	) => {
		setFormData((current) => ({ ...current, [field]: value }));

		if (errors[field]) {
			setErrors((current) => ({ ...current, [field]: undefined }));
		}
	};

	const resetForm = () => {
		setFormData(INITIAL_FORM_STATE);
		setErrors({});
	};

	const validateForm = () => {
		const nextErrors: FormErrors = {};

		if (formData.name.trim().length < 2) {
			nextErrors.name = "Tenant name must be at least 2 characters";
		}

		if (!isEmail(formData.email)) {
			nextErrors.email = "Please enter a valid tenant email address";
		}

		if (formData.admin_first_name.trim().length < 2) {
			nextErrors.admin_first_name = "First name must be at least 2 characters";
		}

		if (formData.admin_last_name.trim().length < 2) {
			nextErrors.admin_last_name = "Last name must be at least 2 characters";
		}

		if (!isEmail(formData.admin_email)) {
			nextErrors.admin_email = "Please enter a valid admin email address";
		}

		if (!formData.admin_phone_number) {
			nextErrors.admin_phone_number = "Admin phone number is required";
		} else if (!isValidPhoneNumber(formData.admin_phone_number)) {
			nextErrors.admin_phone_number = "Please enter a valid phone number";
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleClose = () => {
		if (isSubmitting) {
			return;
		}

		resetForm();
		onOpenChange(false);
	};

	const handleSubmit = async () => {
		if (!validateForm()) {
			return;
		}

		try {
			const tenant = await createTenantMutation.mutateAsync({
				name: formData.name.trim(),
				email: formData.email.trim(),
				admin_email: formData.admin_email.trim(),
				admin_first_name: formData.admin_first_name.trim(),
				admin_last_name: formData.admin_last_name.trim(),
				admin_phone_number: formData.admin_phone_number,
			});

			await createBillingMutation.mutateAsync({
				tenant: tenant.id,
				billing_email: formData.email.trim(),
				billing_plan: formData.plan,
				billing_name: formData.name.trim(),
			});

			toast.success(`${formData.name.trim()} has been created successfully`);
			resetForm();
			onOpenChange(false);
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
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
			<DialogContent
				className="max-h-[92vh] overflow-y-auto sm:max-w-5xl"
				showCloseButton={!isSubmitting}
			>
				<DialogHeader className="gap-1 text-left">
					<DialogTitle className="text-xl">Add New Tenant</DialogTitle>
					<DialogDescription>
						Create a new tenant organization on the platform
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-8 lg:grid-cols-2">
					<section className="space-y-6">
						<div className="flex items-center gap-2">
							<BuildingsIcon className="size-5 text-muted-foreground" />
							<h3 className="text-base font-medium">Tenant Information</h3>
						</div>

						<div className="space-y-4">
							<Field label="Tenant Name" error={errors.name}>
								<IconInput
									icon={BuildingsIcon}
									value={formData.name}
									onChange={(event) =>
										updateField("name", event.target.value)
									}
									placeholder="Enter organization name"
									disabled={isSubmitting}
								/>
							</Field>

							<Field label="Tenant Email" error={errors.email}>
								<IconInput
									icon={EnvelopeSimpleIcon}
									type="email"
									value={formData.email}
									onChange={(event) =>
										updateField("email", event.target.value)
									}
									placeholder="contact@company.com"
									disabled={isSubmitting}
								/>
							</Field>

							<Field label="Billing Plan" error={errors.plan}>
								<Select
									value={formData.plan}
									onValueChange={(value) =>
										updateField("plan", value as BillingPlan)
									}
									disabled={isSubmitting}
								>
									<SelectTrigger className="w-full">
										<div className="flex items-center gap-2">
											<CreditCardIcon className="size-4 text-muted-foreground" />
											<SelectValue />
										</div>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="payg">
											Pay As You Go (PAYG)
										</SelectItem>
										<SelectItem value="enterprise">
											Enterprise Plan
										</SelectItem>
									</SelectContent>
								</Select>
							</Field>
						</div>
					</section>

					<section className="space-y-6">
						<div className="flex items-center gap-2">
							<UserIcon className="size-5 text-muted-foreground" />
							<h3 className="text-base font-medium">Admin Information</h3>
						</div>

						<div className="space-y-4">
							<Field label="Admin First Name" error={errors.admin_first_name}>
								<IconInput
									icon={UserIcon}
									value={formData.admin_first_name}
									onChange={(event) =>
										updateField("admin_first_name", event.target.value)
									}
									placeholder="John"
									disabled={isSubmitting}
								/>
							</Field>

							<Field label="Admin Last Name" error={errors.admin_last_name}>
								<IconInput
									icon={UserIcon}
									value={formData.admin_last_name}
									onChange={(event) =>
										updateField("admin_last_name", event.target.value)
									}
									placeholder="Doe"
									disabled={isSubmitting}
								/>
							</Field>

							<Field label="Admin Email" error={errors.admin_email}>
								<IconInput
									icon={EnvelopeSimpleIcon}
									type="email"
									value={formData.admin_email}
									onChange={(event) =>
										updateField("admin_email", event.target.value)
									}
									placeholder="admin@company.com"
									disabled={isSubmitting}
								/>
							</Field>

							<Field
								label="Admin Phone Number"
								error={errors.admin_phone_number}
							>
								<PhoneInput
									defaultCountry="NG"
									value={formData.admin_phone_number}
									onChange={(value) =>
										updateField("admin_phone_number", value ?? "")
									}
									disabled={isSubmitting}
								/>
								<p className="text-xs text-muted-foreground">
									Enter phone number without country code
								</p>
							</Field>
						</div>
					</section>
				</div>

				<div className="rounded-lg border bg-muted/40 p-4">
					<h4 className="text-sm font-medium">Summary</h4>
					<div className="mt-2 space-y-1 text-sm text-muted-foreground">
						<p>
							<span className="font-medium text-foreground">Tenant:</span>{" "}
							{formData.name.trim() || "Not specified"}
						</p>
						<p>
							<span className="font-medium text-foreground">
								Tenant Email:
							</span>{" "}
							{formData.email.trim() || "Not specified"}
						</p>
						<p>
							<span className="font-medium text-foreground">Admin:</span>{" "}
							{adminFullName || "Not specified"}
						</p>
						<p>
							<span className="font-medium text-foreground">
								Admin Email:
							</span>{" "}
							{formData.admin_email.trim() || "Not specified"}
						</p>
						<p>
							<span className="font-medium text-foreground">
								Admin Phone:
							</span>{" "}
							{formData.admin_phone_number || "Not specified"}
						</p>
						<p>
							<span className="font-medium text-foreground">Plan:</span>{" "}
							{getBillingPlanLabel(formData.plan)}
						</p>
					</div>
				</div>

				<Alert className="border-blue-200 bg-blue-50 text-blue-900">
					<InfoIcon />
					<AlertDescription>
						All fields are required. An invitation email will be sent to the
						admin email address.
					</AlertDescription>
				</Alert>

				<DialogFooter className="gap-2 sm:justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => void handleSubmit()}
						disabled={isSubmitting || !isFormComplete}
					>
						<FloppyDiskIcon weight="bold" />
						{isSubmitting ? "Creating..." : "Create Tenant"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
