import { ArrowRightIcon, LockIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	Link,
	Navigate,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
	useUserV2ResetPasswordMutation,
	useVerifyForgotPasswordTokenV2Query,
} from "#/api/http/v2/users/users.hooks";
import {
	UserResetPasswordFormWithoutTokenSchema,
	type UserResetPasswordFormWithoutTokenValues,
	UserResetPasswordSearchSchema,
} from "#/api/http/v2/users/users.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Spinner } from "@verifyafrica/ui/components/ui/spinner";
import { deleteAllCookies } from "@verifyafrica/ui/lib/cookies";
import type { V2AxiosError } from "#/api/http/shared";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { AuthPageShell } from "../-components";

export const Route = createFileRoute(
	"/(unguarded)/_unguarded_layout/reset-password/",
)({
	head: () => ({
		meta: [
			{ title: "Reset Password | VerifyAfrica" },
			{ name: "description", content: "Set a new password and recover access to your account." },
		],
	}),
	validateSearch: UserResetPasswordSearchSchema,
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const navigate = useNavigate();
	const { token } = Route.useSearch();
	const resetPasswordMutation = useUserV2ResetPasswordMutation();
	const tokenVerification = useVerifyForgotPasswordTokenV2Query(token);
	const [formErrors, setFormErrors] = useState<Array<{ message: string }>>([]);

	const form = useForm({
		defaultValues: {
			new_password: "",
			confirm_new_password: "",
		} satisfies UserResetPasswordFormWithoutTokenValues,
		validators: {
			onSubmit: UserResetPasswordFormWithoutTokenSchema,
		},
		onSubmit: async ({ value }) => {
			setFormErrors([]);
			deleteAllCookies();

			await resetPasswordMutation.mutateAsync(
				{
					token,
					new_password: value.new_password,
					confirm_new_password: value.confirm_new_password,
				},
				{
					onSuccess: () => {
						toast.success("Password reset successful");
						navigate({ to: "/login", replace: true });
					},
					onError: (error) => {
						const axiosError = error as V2AxiosError;
						const data = axiosError.response?.data;

						if (data?.errors?.length) {
							setFormErrors(data.errors.map((message) => ({ message })));
							return;
						}

						if (data?.message) {
							setFormErrors([{ message: data.message }]);
							return;
						}

						setFormErrors([
							{ message: axiosError.message || "Something went wrong" },
						]);
					},
				},
			);
		},
	});

	if (!token) {
		return <Navigate to="/forgot-password" />;
	}

	if (tokenVerification.isPending) {
		return (
			<AuthPageShell
				title="Verifying reset link"
				subtitle="Please wait while we validate your password reset link"
			>
				<div className="flex justify-center py-8">
					<Spinner className="size-8 text-primary" />
				</div>
			</AuthPageShell>
		);
	}

	if (tokenVerification.isError) {
		const axiosError = tokenVerification.error as V2AxiosError;
		const data = axiosError.response?.data;
		const errors = data?.errors?.length
			? data.errors.map((message) => ({ message }))
			: [
					{
						message: data?.message || "This reset link is invalid or expired.",
					},
				];

		return (
			<AuthPageShell
				title="Reset link unavailable"
				subtitle="We couldn't verify this password reset link."
				footer={
					<p className="mt-6 text-center text-sm text-muted-foreground">
						<Link
							to="/forgot-password"
							className="font-semibold text-foreground hover:underline"
						>
							Request a new reset link
						</Link>
					</p>
				}
			>
				<FieldError errors={errors} />
			</AuthPageShell>
		);
	}

	const verifiedUser = tokenVerification.data;

	return (
		<AuthPageShell
			title="Reset password"
			subtitle={`Choose a new password for ${verifiedUser.email}`}
			footer={
				<p className="mt-6 text-center text-sm text-muted-foreground">
					Need a new link?{" "}
					<Link
						to="/forgot-password"
						className="font-semibold text-foreground hover:underline"
						replace
					>
						Request another reset link
					</Link>
				</p>
			}
		>
			<form
				id="reset-password-form"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="flex flex-col gap-4"
			>
				<FieldGroup className="flex flex-col gap-4">
					<form.Field name="new_password">
						{(field) => (
							<Field className="flex flex-col gap-2">
								<FieldLabel htmlFor="new-password">New Password</FieldLabel>
								<div className="relative">
									<LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="new-password"
										type="password"
										placeholder="Enter your new password"
										autoComplete="new-password"
										className="pl-10"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={
											field.state.meta.isTouched && !field.state.meta.isValid
										}
										aria-describedby={field.state.meta.errors?.join(" ")}
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
								<FieldLabel htmlFor="confirm-new-password">
									Confirm New Password
								</FieldLabel>
								<div className="relative">
									<LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="confirm-new-password"
										type="password"
										placeholder="Confirm your new password"
										autoComplete="new-password"
										className="pl-10"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={
											field.state.meta.isTouched && !field.state.meta.isValid
										}
										aria-describedby={field.state.meta.errors?.join(" ")}
									/>
								</div>
								{field.state.meta.isTouched && !field.state.meta.isValid && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>
				</FieldGroup>

				{formErrors.length > 0 && <FieldError errors={formErrors} />}

				<Field orientation="horizontal">
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
				</Field>
			</form>
		</AuthPageShell>
	);
}
