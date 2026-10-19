import {
	BuildingsIcon,
	EnvelopeSimpleIcon,
	InfoIcon,
	UserIcon,
	UserPlusIcon,
} from "@phosphor-icons/react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import {
	AdminTestAccountCreateSchema,
	type AdminTestAccountCreatePayload,
} from "@verifyafrica/api-client/http/v2/users/users.types";
import { useAdminCreateTestAccountV2Mutation } from "#/api/http/v2/users/users.hooks";
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

type FormErrors = Partial<Record<keyof AdminTestAccountCreatePayload, string>>;

const INITIAL_FORM_STATE: AdminTestAccountCreatePayload = {
	first_name: "",
	last_name: "",
	email: "",
	tenant_name: "",
	tenant_email: "",
};

function FormField({
	id,
	label,
	required = true,
	error,
	children,
}: {
	id: string;
	label: string;
	required?: boolean;
	error?: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<Label htmlFor={id}>
				{label} {required ? <span className="text-destructive">*</span> : null}
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

export function CreateTestAccountDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [formData, setFormData] =
		useState<AdminTestAccountCreatePayload>(INITIAL_FORM_STATE);
	const [errors, setErrors] = useState<FormErrors>({});
	const createMutation = useAdminCreateTestAccountV2Mutation();
	const isSubmitting = createMutation.isPending;

	const updateField = (
		field: keyof AdminTestAccountCreatePayload,
		value: string,
	) => {
		setFormData((current) => ({ ...current, [field]: value }));
		if (errors[field]) {
			setErrors((current) => ({ ...current, [field]: undefined }));
		}
	};

	const handleClose = () => {
		if (isSubmitting) {
			return;
		}
		setFormData(INITIAL_FORM_STATE);
		setErrors({});
		onOpenChange(false);
	};

	const handleSubmit = async () => {
		const parsed = AdminTestAccountCreateSchema.safeParse({
			...formData,
			email: formData.email.trim(),
			tenant_email: formData.tenant_email.trim(),
		});

		if (!parsed.success) {
			const nextErrors: FormErrors = {};
			for (const issue of parsed.error.issues) {
				const field = issue.path[0] as keyof AdminTestAccountCreatePayload;
				nextErrors[field] ??= issue.message;
			}
			setErrors(nextErrors);
			return;
		}

		try {
			const user = await createMutation.mutateAsync(parsed.data);
			toast.success(`Test account created. Sign-in details were emailed to ${user.email}`);
			setFormData(INITIAL_FORM_STATE);
			setErrors({});
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
				className="max-h-[92vh] overflow-y-auto sm:max-w-lg"
				showCloseButton={!isSubmitting}
			>
				<DialogHeader className="gap-1 text-left">
					<DialogTitle className="text-xl">Create Test Account</DialogTitle>
					<DialogDescription>
						Create an organization and its admin user on the test environment.
					</DialogDescription>
				</DialogHeader>

				<form
					className="flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						void handleSubmit();
					}}
				>
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							id="test-account-first-name"
							label="First Name"
							error={errors.first_name}
						>
							<IconInput
								id="test-account-first-name"
								icon={UserIcon}
								value={formData.first_name}
								onChange={(event) => updateField("first_name", event.target.value)}
								placeholder="John"
								disabled={isSubmitting}
							/>
						</FormField>
						<FormField
							id="test-account-last-name"
							label="Last Name"
							error={errors.last_name}
						>
							<IconInput
								id="test-account-last-name"
								icon={UserIcon}
								value={formData.last_name}
								onChange={(event) => updateField("last_name", event.target.value)}
								placeholder="Doe"
								disabled={isSubmitting}
							/>
						</FormField>
					</div>

					<FormField id="test-account-email" label="Email" error={errors.email}>
						<IconInput
							id="test-account-email"
							icon={EnvelopeSimpleIcon}
							type="email"
							value={formData.email}
							onChange={(event) => updateField("email", event.target.value)}
							placeholder="john@company.com"
							disabled={isSubmitting}
						/>
					</FormField>

					<FormField
						id="test-account-tenant-name"
						label="Organization Name"
						error={errors.tenant_name}
					>
						<IconInput
							id="test-account-tenant-name"
							icon={BuildingsIcon}
							value={formData.tenant_name}
							onChange={(event) => updateField("tenant_name", event.target.value)}
							placeholder="Acme Inc."
							disabled={isSubmitting}
						/>
					</FormField>

					<FormField
						id="test-account-tenant-email"
						label="Organization Email"
						required={false}
						error={errors.tenant_email}
					>
						<IconInput
							id="test-account-tenant-email"
							icon={EnvelopeSimpleIcon}
							type="email"
							value={formData.tenant_email}
							onChange={(event) => updateField("tenant_email", event.target.value)}
							placeholder="Defaults to the user's email"
							disabled={isSubmitting}
						/>
					</FormField>

					<Alert className="border-blue-200 bg-blue-50 text-blue-900">
						<InfoIcon />
						<AlertDescription>
							The user receives an 8-character temporary password by email. They
							must change it on first sign-in, and it expires after 7 days. The
							organization gets the standard test credit.
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
						<Button type="submit" disabled={isSubmitting}>
							<UserPlusIcon weight="bold" />
							{isSubmitting ? "Creating..." : "Create Account"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
