import { ArrowRightIcon, LockIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useUserV2AdminLoginMutation } from "#/api/http/v2/users/users.hooks";
import {
	type UserLoginPayload,
	UserLoginSchema,
} from "#/api/http/v2/users/users.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { deleteAllCookies } from "@verifyafrica/ui/lib/cookies";
import { getPostLoginPath } from "@verifyafrica/ui/lib/redirect";
import { useAuthStore } from "#/stores/auth-store";
import { getV2FormErrors } from "#/api/http/shared";
import { Field, FieldError, FieldGroup } from "@verifyafrica/ui/components/ui/field";
import { AuthPageShell } from "../-components";

const loginSearchSchema = z.object({
	redirect_to: z.string().optional(),
});

export const Route = createFileRoute("/(unguarded)/_unguarded_layout/login/")({
	head: () => ({
		meta: [
			{ title: "Admin Login | VerifyAfrica" },
			{ name: "description", content: "Sign in to access your VerifyAfrica admin account." },
		],
	}),
	validateSearch: loginSearchSchema,
	component: LoginPage,
});

function LoginPage() {
	const { redirect_to } = Route.useSearch();
	const navigate = useNavigate();
	const userLoginMutation = useUserV2AdminLoginMutation();
	const [formErrors, setFormErrors] = useState<Array<{ message: string }>>([]);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		} satisfies UserLoginPayload,
		validators: {
			onSubmit: UserLoginSchema,
		},
		onSubmit: async ({ value }) => {
			setFormErrors([]);
			deleteAllCookies();

			await userLoginMutation.mutateAsync(
				{ payload: value },
				{
					onSuccess: () => {
						const user = useAuthStore.getState().user;

						if (!user?.is_active) {
							toast.error(
								"Your account is not active. Please contact support.",
								{
									duration: 10_000,
								},
							);
							return;
						}

						toast.success("Admin login successful");
						navigate({ to: getPostLoginPath(redirect_to) });
					},
					onError: (error) => {
						setFormErrors(getV2FormErrors(error));
					},
				},
			);
		},
	});

	return (
		<AuthPageShell
			title="Admin -Welcome back"
			subtitle="Sign in to your VerifyAfrica admin account"
			footer={
				<p className="mt-6 text-center text-sm text-muted-foreground">
					Forgot your password?{" "}
					<Link
						to="/forgot-password"
						className="font-semibold text-foreground hover:underline"
					>
						Reset it here
					</Link>
				</p>
			}
		>
			<form
				id="login-form"
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
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									autoComplete="email"
									placeholder="Enter your email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={
										field.state.meta.isTouched && !field.state.meta.isValid
									}
									aria-describedby={field.state.meta.errors?.join(" ")}
								/>
								{field.state.meta.isTouched && !field.state.meta.isValid && (
									<FieldError errors={field.state.meta.errors} />
								)}
							</Field>
						)}
					</form.Field>
				</FieldGroup>

				<form.Field name="password">
					{(field) => (
						<Field className="flex flex-col gap-2">
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id="password"
									type="password"
									placeholder="Enter your password"
									autoComplete="current-password"
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
				{formErrors.length > 0 && <FieldError errors={formErrors} />}
				<Field orientation="horizontal">
					<Button
						type="submit"
						className="w-full cursor-pointer"
						disabled={userLoginMutation.isPending}
					>
						Sign In
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
