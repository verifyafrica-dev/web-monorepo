import { ArrowRightIcon, LockIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { getV2FormErrors } from "#/api/http/shared";
import { useAdminResetPasswordWithOtpV2Mutation } from "#/api/http/v2/users/users.hooks";
import {
	AdminResetPasswordWithOtpFormSchema,
	type AdminResetPasswordWithOtpFormValues,
} from "#/api/http/v2/users/users.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { Field, FieldError, FieldGroup } from "@verifyafrica/ui/components/ui/field";
import { AuthPageShell } from "../-components";

const resetPasswordSearchSchema = z.object({
	email: z.email().optional(),
});

export const Route = createFileRoute(
	"/(unguarded)/_unguarded_layout/reset-password/",
)({
	head: () => ({
		meta: [
			{ title: "Reset Password | VerifyAfrica" },
			{ name: "description", content: "Set a new password to regain access to your admin account." },
		],
	}),
	validateSearch: resetPasswordSearchSchema,
	beforeLoad: ({ search }) => {
		if (!search.email) {
			throw redirect({ to: "/forgot-password", replace: true });
		}
	},
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const { email } = Route.useSearch();
	const navigate = useNavigate();
	const safeEmail = email ?? "";
	const resetPasswordMutation = useAdminResetPasswordWithOtpV2Mutation();
	const [formErrors, setFormErrors] = useState<Array<{ message: string }>>([]);

	const form = useForm({
		defaultValues: {
			email: safeEmail,
			otp: "",
			new_password: "",
			confirm_new_password: "",
		} satisfies AdminResetPasswordWithOtpFormValues,
		validators: {
			onSubmit: AdminResetPasswordWithOtpFormSchema,
		},
		onSubmit: async ({ value }) => {
			setFormErrors([]);
			await resetPasswordMutation.mutateAsync(value, {
				onSuccess: () => {
					toast.success("Password reset successful");
					navigate({ to: "/login", replace: true });
				},
				onError: (error) => {
					setFormErrors(getV2FormErrors(error));
				},
			});
		},
	});

	return (
		<AuthPageShell
			title="Reset password"
			subtitle="Enter your email, OTP and new password."
			footer={
				<p className="mt-6 text-center text-sm text-muted-foreground">
					Need another OTP?{" "}
					<Link
						to="/forgot-password"
						className="font-semibold text-foreground hover:underline"
					>
						Request OTP again
					</Link>
				</p>
			}
		>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					form.handleSubmit();
				}}
				className="flex flex-col gap-4"
			>
				<FieldGroup className="flex flex-col gap-2">
					<form.Field name="email">
						{(field) => (
							<Field className="flex flex-col gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									autoComplete="email"
									placeholder="Enter your admin email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								{field.state.meta.isTouched && !field.state.meta.isValid && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>

					<form.Field name="otp">
						{(field) => (
							<Field className="flex flex-col gap-2">
								<Label htmlFor="otp">OTP</Label>
								<Input
									id="otp"
									placeholder="Enter the 5-digit OTP"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								{field.state.meta.isTouched && !field.state.meta.isValid && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>

					<form.Field name="new_password">
						{(field) => (
							<Field className="flex flex-col gap-2">
								<Label htmlFor="new-password">New Password</Label>
								<div className="relative">
									<LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="new-password"
										type="password"
										autoComplete="new-password"
										placeholder="Enter your new password"
										className="pl-10"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								</div>
								{field.state.meta.isTouched && !field.state.meta.isValid && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>

					<form.Field name="confirm_new_password">
						{(field) => (
							<Field className="flex flex-col gap-2">
								<Label htmlFor="confirm-password">Confirm New Password</Label>
								<div className="relative">
									<LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="confirm-password"
										type="password"
										autoComplete="new-password"
										placeholder="Confirm your new password"
										className="pl-10"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								</div>
								{field.state.meta.isTouched && !field.state.meta.isValid && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>
				</FieldGroup>

				{formErrors.length > 0 ? <FieldError errors={formErrors} /> : null}

				<Button
					type="submit"
					className="w-full cursor-pointer"
					disabled={resetPasswordMutation.isPending}
				>
					Reset Password
					<ArrowRightIcon
						className="size-4"
						weight="bold"
					/>
				</Button>
			</form>
		</AuthPageShell>
	);
}
