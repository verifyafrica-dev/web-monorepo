import { ArrowRightIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useUserV2ForgotPasswordMutation } from "#/api/http/v2/users/users.hooks";
import {
	type UserForgotPasswordPayload,
	UserForgotPasswordSchema,
} from "#/api/http/v2/users/users.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Input } from "@verifyafrica/ui/components/ui/input";
import type { V2AxiosError } from "#/api/http/shared";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { AuthPageShell } from "../-components";

export const Route = createFileRoute(
	"/(unguarded)/_unguarded_layout/forgot-password/",
)({
	head: () => ({
		meta: [
			{ title: "Forgot Password | VerifyAfrica" },
			{ name: "description", content: "Request instructions to reset your account password." },
		],
	}),
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const forgotPasswordMutation = useUserV2ForgotPasswordMutation();
	const [formErrors, setFormErrors] = useState<Array<{ message: string }>>([]);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const form = useForm({
		defaultValues: {
			email: "",
		} satisfies UserForgotPasswordPayload,
		validators: {
			onSubmit: UserForgotPasswordSchema,
		},
		onSubmit: async ({ value }) => {
			setFormErrors([]);
			setIsSubmitted(false);

			await forgotPasswordMutation.mutateAsync(value, {
				onSuccess: () => {
					setIsSubmitted(true);
					toast.success("If an account exists, a reset link has been sent.");
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
			});
		},
	});

	return (
		<AuthPageShell
			title="Forgot password?"
			subtitle={
				isSubmitted
					? "Check your email for a password reset link"
					: "Enter your email and we'll send you a reset link"
			}
			footer={
				<p className="mt-6 text-center text-sm text-muted-foreground">
					Remember your password?{" "}
					<Link
						to="/login"
						className="font-semibold text-foreground hover:underline"
					>
						Back to sign in
					</Link>
				</p>
			}
		>
			{isSubmitted ? (
				<div className="flex flex-col items-center gap-4 text-center">
					<div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
						<EnvelopeSimpleIcon
							className="size-7"
							weight="duotone"
						/>
					</div>
					<p className="text-sm text-muted-foreground">
						If an account exists for that email, we sent a link to reset your
						password. The link expires after a short time.
					</p>
				</div>
			) : (
				<form
					id="forgot-password-form"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="flex flex-col gap-4"
				>
					<FieldGroup className="flex flex-col gap-2">
						<form.Field name="email">
							{(field) => (
								<Field className="flex flex-col gap-2">
									<FieldLabel htmlFor="email">Email Address</FieldLabel>
									<div className="relative">
										<EnvelopeSimpleIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="email"
											type="email"
											autoComplete="email"
											placeholder="Enter your email"
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
							disabled={forgotPasswordMutation.isPending}
						>
							Send Reset Link
							<ArrowRightIcon
								className="size-4"
								weight="bold"
							/>
						</Button>
					</Field>
				</form>
			)}
		</AuthPageShell>
	);
}
