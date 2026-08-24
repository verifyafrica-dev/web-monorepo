import { EyeIcon, EyeSlashIcon, LockIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { getV2FormErrors } from "#/api/http/shared";
import {
	useAdminChangePasswordWithOtpV2Mutation,
	useAdminRequestChangePasswordOtpV2Mutation,
	useUserV2LogoutMutation,
} from "#/api/http/v2/users/users.hooks";
import {
	AdminChangePasswordWithOtpFormSchema,
	type AdminChangePasswordWithOtpFormValues,
} from "#/api/http/v2/users/users.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Input } from "@verifyafrica/ui/components/ui/input";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";

export function ChangePasswordWithOtpTab({ email }: { email: string }) {
	const requestOtpMutation = useAdminRequestChangePasswordOtpV2Mutation();
	const changePasswordMutation = useAdminChangePasswordWithOtpV2Mutation();
	const { logout, isLoggingOut } = useUserV2LogoutMutation();
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [formErrors, setFormErrors] = useState<Array<{ message: string }>>([]);

	const form = useForm({
		defaultValues: {
			old_password: "",
			otp: "",
			new_password: "",
			confirm_new_password: "",
		} satisfies AdminChangePasswordWithOtpFormValues,
		validators: {
			onSubmit: AdminChangePasswordWithOtpFormSchema,
		},
		onSubmit: async ({ value }) => {
			setFormErrors([]);
			await changePasswordMutation.mutateAsync(value, {
				onSuccess: async () => {
					toast.success("Password changed successfully. Please log in again.");
					await logout();
				},
				onError: (error) => {
					setFormErrors(getV2FormErrors(error));
				},
			});
		},
	});

	const requestingOtp = requestOtpMutation.isPending;

	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
				An OTP will be sent to the configured superuser emails for this account.
				<br />
				Account: <strong>{email}</strong>
			</div>

			<Button
				type="button"
				variant="outline"
				disabled={requestingOtp}
				onClick={() => {
					void requestOtpMutation.mutateAsync(undefined, {
						onSuccess: () => toast.success("OTP sent successfully."),
						onError: (error) => toast.error(getV2FormErrors(error)[0]?.message),
					});
				}}
			>
				{requestingOtp ? "Sending OTP..." : "Send OTP"}
			</Button>

			<FieldGroup className="grid gap-4">
				<form.Field name="old_password">
					{(field) => (
						<Field className="flex flex-col gap-1.5">
							<FieldLabel htmlFor="old-password">Current Password</FieldLabel>
							<div className="relative">
								<LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id="old-password"
									type={showCurrentPassword ? "text" : "password"}
									placeholder="Enter your current password"
									className="pr-10 pl-10"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									onClick={() => setShowCurrentPassword((visible) => !visible)}
								>
									{showCurrentPassword ? (
										<EyeSlashIcon className="size-4" />
									) : (
										<EyeIcon className="size-4" />
									)}
								</Button>
							</div>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name="otp">
					{(field) => (
						<Field className="flex flex-col gap-1.5">
							<FieldLabel htmlFor="otp">OTP</FieldLabel>
							<Input
								id="otp"
								placeholder="Enter the 5-digit OTP"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								aria-invalid={field.state.meta.errors.length > 0}
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name="new_password">
					{(field) => (
						<Field className="flex flex-col gap-1.5">
							<FieldLabel htmlFor="new-password">New Password</FieldLabel>
							<div className="relative">
								<LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id="new-password"
									type={showNewPassword ? "text" : "password"}
									placeholder="Enter your new password"
									className="pr-10 pl-10"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									onClick={() => setShowNewPassword((visible) => !visible)}
								>
									{showNewPassword ? (
										<EyeSlashIcon className="size-4" />
									) : (
										<EyeIcon className="size-4" />
									)}
								</Button>
							</div>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name="confirm_new_password">
					{(field) => (
						<Field className="flex flex-col gap-1.5">
							<FieldLabel htmlFor="confirm-password">
								Confirm New Password
							</FieldLabel>
							<div className="relative">
								<LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id="confirm-password"
									type={showConfirmPassword ? "text" : "password"}
									placeholder="Confirm your new password"
									className="pr-10 pl-10"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									onClick={() => setShowConfirmPassword((visible) => !visible)}
								>
									{showConfirmPassword ? (
										<EyeSlashIcon className="size-4" />
									) : (
										<EyeIcon className="size-4" />
									)}
								</Button>
							</div>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>
			</FieldGroup>

			{formErrors.length > 0 ? <FieldError errors={formErrors} /> : null}

			<Button
				type="submit"
				className="w-full"
				disabled={changePasswordMutation.isPending || isLoggingOut}
			>
				{changePasswordMutation.isPending || isLoggingOut
					? "Updating Password..."
					: "Change Password"}
			</Button>
		</form>
	);
}
