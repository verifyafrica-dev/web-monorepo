import { ArrowRightIcon, LockIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useUserV2LoginMutation } from "#/api/http/v2/users/users.hooks";
import {
	type UserLoginPayload,
	UserLoginSchema,
} from "#/api/http/v2/users/users.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { deleteAllCookies } from "#/lib/cookies";
import { getPostLoginPath } from "#/lib/redirect";
import { normalizeUserTenants } from "#/routes/(auth)/_auth_layout/app/team/-data";
import { useAuthStore } from "#/stores/auth-store";
import type { V2AxiosError } from "#/api/http/shared";
import { Field, FieldError, FieldGroup } from "@verifyafrica/ui/components/ui/field";
import { AuthPageShell } from "../-components";

const SUPPORT_EMAIL = "support@verifyafrica.io";

const loginSearchSchema = z.object({
	redirect_to: z.string().optional(),
});

export const Route = createFileRoute("/(unguarded)/_unguarded_layout/login/")({
	head: () => ({
		meta: [
			{ title: "Login | VerifyAfrica" },
			{
				name: "description",
				content: "Sign in to access your VerifyAfrica account and tools.",
			},
		],
	}),
	validateSearch: loginSearchSchema,
	component: LoginPage,
});

function LoginPage() {
	const { redirect_to } = Route.useSearch();
	const navigate = useNavigate();
	const userLoginMutation = useUserV2LoginMutation();
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

						const tenants = normalizeUserTenants(user.tenants);
						if (tenants.length === 0) {
							toast.message("Membership deactivated", {
								description: `Your organization access is no longer active. Contact ${SUPPORT_EMAIL} or create your own organization to continue.`,
								descriptionClassName: "!text-foreground",
								duration: 12_000,
							});
							navigate({ to: "/app", replace: true });
							return;
						}

						toast.success("Login successful");
						navigate({ to: getPostLoginPath(redirect_to) });
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
			title="Welcome back"
			subtitle="Sign in to your VerifyAfrica account"
			footer={
				<p className="mt-6 text-center text-sm text-muted-foreground">
					Don&apos;t have an account?{" "}
					<Link
						to="/register"
						className="font-semibold text-foreground hover:underline"
					>
						Create an account
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
				<div className="flex justify-end">
					<Link
						to="/forgot-password"
						className="text-sm font-semibold text-foreground hover:underline"
					>
						Forgot password?
					</Link>
				</div>
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
