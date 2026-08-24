import { ArrowRightIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getV2FormErrors } from "#/api/http/shared";
import { useAdminForgotPasswordV2Mutation } from "#/api/http/v2/users/users.hooks";
import {
	AdminRequestPasswordOtpSchema,
	type AdminRequestPasswordOtpPayload,
} from "#/api/http/v2/users/users.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { Field, FieldError, FieldGroup } from "@verifyafrica/ui/components/ui/field";
import { AuthPageShell } from "../-components";

export const Route = createFileRoute(
	"/(unguarded)/_unguarded_layout/forgot-password/",
)({
	head: () => ({
		meta: [
			{ title: "Forgot Password | VerifyAfrica" },
			{ name: "description", content: "Request a reset link to recover your admin account password." },
		],
	}),
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const navigate = useNavigate();
	const forgotPasswordMutation = useAdminForgotPasswordV2Mutation();
	const [formErrors, setFormErrors] = useState<Array<{ message: string }>>([]);

	const form = useForm({
		defaultValues: {
			email: "",
		} satisfies AdminRequestPasswordOtpPayload,
		validators: {
			onSubmit: AdminRequestPasswordOtpSchema,
		},
		onSubmit: async ({ value }) => {
			setFormErrors([]);
			await forgotPasswordMutation.mutateAsync(value, {
				onSuccess: () => {
					toast.success("OTP sent successfully.");
					navigate({
						to: "/reset-password",
						search: { email: value.email },
					});
				},
				onError: (error) => {
					setFormErrors(getV2FormErrors(error));
				},
			});
		},
	});

	return (
		<AuthPageShell
			title="Forgot password"
			subtitle="Enter your admin email to request an OTP for password reset."
			footer={
				<p className="mt-6 text-center text-sm text-muted-foreground">
					Remembered your password?{" "}
					<Link to="/login" className="font-semibold text-foreground hover:underline">
						Back to login
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
								<div className="relative">
									<EnvelopeSimpleIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="email"
										type="email"
										autoComplete="email"
										placeholder="Enter your admin email"
										className="pl-10"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={
											field.state.meta.isTouched && !field.state.meta.isValid
										}
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
					disabled={forgotPasswordMutation.isPending}
				>
					Request OTP
					<ArrowRightIcon className="size-4" weight="bold" />
				</Button>
			</form>
		</AuthPageShell>
	);
}

