import {
	ArrowRightIcon,
	BuildingsIcon,
	EnvelopeSimpleIcon,
	LockIcon,
	UserIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useUserV2RegisterMutation } from "#/api/http/v2/users/users.hooks";
import {
	UserRegisterFormSchema,
	type UserRegisterFormValues,
} from "#/api/http/v2/users/users.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { AuthPageShell } from "../-components";

export const Route = createFileRoute(
	"/(unguarded)/_unguarded_layout/register/",
)({
	head: () => ({
		meta: [
			{ title: "Register | VerifyAfrica" },
			{ name: "description", content: "Create a VerifyAfrica account for your organization." },
		],
	}),
	component: RegisterPage,
});

function RegisterPage() {
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [formErrors, setFormErrors] = useState<Array<{ message: string }>>([]);
	const navigate = useNavigate();
	const registerMutation = useUserV2RegisterMutation();

	const form = useForm({
		defaultValues: {
			tenant_name: "",
			first_name: "",
			last_name: "",
			email: "",
			password: "",
		} satisfies UserRegisterFormValues,
		validators: {
			onSubmit: UserRegisterFormSchema,
		},
		onSubmit: async ({ value }) => {
			setFormErrors([]);

			await registerMutation.mutateAsync(
				{
					...value,
					tenant_email: value.email,
				},
				{
					onSuccess: () => {
						toast.success(
							"Account created. Check your email for a verification code.",
						);
						navigate({
							to: "/activate-account",
							search: { email: value.email },
						});
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

	return (
		<AuthPageShell
			title="Create Account"
			subtitle="Join us today and get started"
			footer={
				<p className="mt-6 text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link
						to="/login"
						className="font-semibold text-foreground hover:underline"
					>
						Sign in here
					</Link>
				</p>
			}
		>
			<form
				id="register-form"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="flex flex-col gap-4"
			>
				<div className="grid gap-4 sm:grid-cols-2">
					<form.Field name="first_name">
						{(field) => (
							<Field className="flex flex-col gap-2">
								<FieldLabel htmlFor="first-name">First Name</FieldLabel>
								<div className="relative">
									<UserIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="first-name"
										placeholder="John"
										autoComplete="given-name"
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

					<form.Field name="last_name">
						{(field) => (
							<Field className="flex flex-col gap-2">
								<FieldLabel htmlFor="last-name">Last Name</FieldLabel>
								<div className="relative">
									<UserIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="last-name"
										placeholder="Doe"
										autoComplete="family-name"
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
				</div>

				<FieldGroup className="flex flex-col gap-2">
					<form.Field name="tenant_name">
						{(field) => (
							<Field className="flex flex-col gap-2">
								<FieldLabel htmlFor="company-name">Company Name</FieldLabel>
								<div className="relative">
									<BuildingsIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="company-name"
										placeholder="Acme Inc."
										autoComplete="organization"
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

					<form.Field name="email">
						{(field) => (
							<Field className="flex flex-col gap-2">
								<FieldLabel htmlFor="email">Email Address</FieldLabel>
								<div className="relative">
									<EnvelopeSimpleIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="email"
										type="email"
										placeholder="john.doe@example.com"
										autoComplete="email"
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

					<form.Field name="password">
						{(field) => (
							<Field className="flex flex-col gap-2">
								<FieldLabel htmlFor="password">Password</FieldLabel>
								<div className="relative">
									<LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="password"
										type="password"
										placeholder="Enter your password"
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

				<div className="flex items-start gap-3">
					<Checkbox
						id="terms"
						checked={acceptedTerms}
						onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
					/>
					<Label
						htmlFor="terms"
						className="text-sm leading-relaxed font-normal text-muted-foreground"
					>
						By creating an account, I agree to VerifyAfrica&apos;s Terms of
						Service, Privacy Policy, and Cookie Policy.
					</Label>
				</div>

				<Field orientation="horizontal">
					<Button
						type="submit"
						className="w-full cursor-pointer"
						disabled={!acceptedTerms || registerMutation.isPending}
					>
						Create Account
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
