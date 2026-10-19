import { EyeIcon, EyeSlashIcon, LockIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";
import {
	UserChangePasswordFormSchema,
	type UserChangePasswordFormValues,
} from "@verifyafrica/api-client/http/v2/users/users.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { deleteAllCookies } from "@verifyafrica/ui/lib/cookies";
import {
	useUserV2ChangePasswordMutation,
	useUserV2LogoutMutation,
} from "#/api/http/v2/users/users.hooks";
import { useAuthStore } from "#/stores/auth-store";

type PasswordInputProps = {
	id: string;
	label: string;
	placeholder: string;
	autoComplete: string;
	value: string;
	onBlur: () => void;
	onChange: (value: string) => void;
	errors: Array<{ message: string } | undefined>;
};

function PasswordInput({
	id,
	label,
	placeholder,
	autoComplete,
	value,
	onBlur,
	onChange,
	errors,
}: PasswordInputProps) {
	const [visible, setVisible] = useState(false);
	const invalid = errors.length > 0;

	return (
		<Field className="flex flex-col gap-1.5" data-invalid={invalid}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<div className="relative">
				<LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					id={id}
					type={visible ? "text" : "password"}
					placeholder={placeholder}
					autoComplete={autoComplete}
					className="pr-10 pl-10"
					value={value}
					onBlur={onBlur}
					onChange={(event) => onChange(event.target.value)}
					aria-invalid={invalid}
				/>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					onClick={() => setVisible((current) => !current)}
					aria-label={visible ? "Hide password" : "Show password"}
				>
					{visible ? (
						<EyeSlashIcon className="size-4" />
					) : (
						<EyeIcon className="size-4" />
					)}
				</Button>
			</div>
			<FieldError errors={errors} />
		</Field>
	);
}

export function RequiredPasswordChange() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const changePasswordMutation = useUserV2ChangePasswordMutation();
	const { logout, isLoggingOut } = useUserV2LogoutMutation();
	const [formErrors, setFormErrors] = useState<Array<{ message: string }>>([]);

	const form = useForm({
		defaultValues: {
			old_password: "",
			new_password: "",
			confirm_password: "",
		} satisfies UserChangePasswordFormValues,
		validators: {
			onSubmit: UserChangePasswordFormSchema,
		},
		onSubmit: async ({ value }) => {
			setFormErrors([]);

			await changePasswordMutation.mutateAsync(
				{
					old_password: value.old_password,
					new_password: value.new_password,
				},
				{
					onSuccess: () => {
						// Changing the password revokes every session, including this one.
						deleteAllCookies();
						useAuthStore.getState().clearAuth();
						queryClient.clear();
						toast.success("Password updated. Sign in with your new password.");
						navigate({ to: "/login", replace: true });
					},
					onError: (error) => {
						const data = (error as V2AxiosError).response?.data;

						if (data?.errors?.length) {
							setFormErrors(data.errors.map((message) => ({ message })));
						} else if (data?.message) {
							setFormErrors([{ message: data.message }]);
						} else {
							setFormErrors([
								{ message: "Failed to change password. Please try again." },
							]);
						}
					},
				},
			);
		},
	});

	const isSubmitting = changePasswordMutation.isPending;

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
			<div className="mb-8 flex w-full max-w-md flex-col items-center gap-3 text-center">
				<ShieldCheckIcon className="size-12 text-primary" />
				<h1 className="text-3xl font-semibold tracking-tight text-foreground">
					Choose a new password
				</h1>
				<p className="text-sm text-muted-foreground">
					You signed in with a temporary password. Set your own password to
					continue to your dashboard.
				</p>
			</div>
			<Card className="w-full max-w-md shadow-lg">
				<CardContent className="pt-6">
					<form
						className="flex flex-col gap-6"
						onSubmit={(event) => {
							event.preventDefault();
							form.handleSubmit();
						}}
					>
						<FieldGroup className="grid gap-4">
							<form.Field name="old_password">
								{(field) => (
									<PasswordInput
										id="temporary-password"
										label="Temporary Password"
										placeholder="Enter the password from your email"
										autoComplete="current-password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={field.handleChange}
										errors={field.state.meta.errors}
									/>
								)}
							</form.Field>
							<form.Field name="new_password">
								{(field) => (
									<PasswordInput
										id="new-password"
										label="New Password"
										placeholder="Enter your new password"
										autoComplete="new-password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={field.handleChange}
										errors={field.state.meta.errors}
									/>
								)}
							</form.Field>
							<form.Field name="confirm_password">
								{(field) => (
									<PasswordInput
										id="confirm-password"
										label="Confirm New Password"
										placeholder="Confirm your new password"
										autoComplete="new-password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={field.handleChange}
										errors={field.state.meta.errors}
									/>
								)}
							</form.Field>
						</FieldGroup>

						{formErrors.length > 0 && <FieldError errors={formErrors} />}

						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting ? "Updating Password..." : "Update Password"}
						</Button>
					</form>
				</CardContent>
			</Card>
			<Button
				type="button"
				variant="link"
				className="mt-4 text-muted-foreground"
				onClick={() => logout()}
				disabled={isLoggingOut}
			>
				Sign out
			</Button>
		</div>
	);
}
