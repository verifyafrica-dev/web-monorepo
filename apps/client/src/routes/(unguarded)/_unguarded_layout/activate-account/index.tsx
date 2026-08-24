import { ArrowRightIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	Link,
	Navigate,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
	useUserV2ActivateAccountMutation,
	useUserV2ResendActivationCodeMutation,
} from "#/api/http/v2/users/users.hooks";
import {
	type UserActivateAccountPayload,
	UserActivateAccountSchema,
	UserActivateAccountSearchSchema,
} from "#/api/http/v2/users/users.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@verifyafrica/ui/components/ui/input-otp";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { getPostLoginPath } from "#/lib/redirect";
import type { V2AxiosError } from "#/api/http/shared";
import { Field, FieldError } from "@verifyafrica/ui/components/ui/field";
import { AuthPageShell } from "../-components";

export const Route = createFileRoute(
	"/(unguarded)/_unguarded_layout/activate-account/",
)({
	head: () => ({
		meta: [
			{ title: "Activate Account | VerifyAfrica" },
			{ name: "description", content: "Activate your account to start using VerifyAfrica services." },
		],
	}),
	validateSearch: UserActivateAccountSearchSchema,
	component: ActivateAccountPage,
});

const RESEND_COOLDOWN_SECONDS = 60;

function maskEmail(email: string) {
	const [localPart, domain] = email.split("@");
	if (!localPart || !domain) {
		return email;
	}

	return `${localPart.slice(0, 2)}***@${domain}`;
}

function ActivateAccountPage() {
	const navigate = useNavigate();
	const { email } = Route.useSearch();
	const activateAccountMutation = useUserV2ActivateAccountMutation();
	const resendActivationCodeMutation = useUserV2ResendActivationCodeMutation();
	const [formErrors, setFormErrors] = useState<Array<{ message: string }>>([]);
	const [resendErrors, setResendErrors] = useState<Array<{ message: string }>>(
		[],
	);
	const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

	useEffect(() => {
		if (resendCooldown <= 0) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setResendCooldown((seconds) => seconds - 1);
		}, 1000);

		return () => window.clearTimeout(timeoutId);
	}, [resendCooldown]);

	const form = useForm({
		defaultValues: {
			email,
			code: "",
		} satisfies UserActivateAccountPayload,
		validators: {
			onSubmit: UserActivateAccountSchema,
		},
		onSubmit: async ({ value }) => {
			setFormErrors([]);

			await activateAccountMutation.mutateAsync(value, {
				onSuccess: () => {
					toast.success("Account activated successfully");
					navigate({ to: getPostLoginPath(undefined) });
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

	const handleResendCode = async () => {
		setResendErrors([]);

		await resendActivationCodeMutation.mutateAsync(
			{ email },
			{
				onSuccess: () => {
					setResendCooldown(RESEND_COOLDOWN_SECONDS);
					toast.success("Verification code resent");
				},
				onError: (error) => {
					const axiosError = error as V2AxiosError;
					const data = axiosError.response?.data;

					if (data?.errors?.length) {
						setResendErrors(data.errors.map((message) => ({ message })));
						return;
					}

					if (data?.message) {
						setResendErrors([{ message: data.message }]);
						return;
					}

					setResendErrors([
						{ message: axiosError.message || "Something went wrong" },
					]);
				},
			},
		);
	};

	if (!email) {
		return <Navigate to="/register" />;
	}

	return (
		<AuthPageShell
			title="Check your email"
			subtitle={`We sent a verification code to ${maskEmail(email)}`}
			footer={
				<p className="mt-6 text-center text-sm text-muted-foreground">
					Already verified?{" "}
					<Link
						to="/login"
						className="font-semibold text-foreground hover:underline"
					>
						Sign in here
					</Link>
				</p>
			}
		>
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
					<EnvelopeSimpleIcon
						className="size-7"
						weight="duotone"
					/>
				</div>
			</div>

			<form
				id="activate-account-form"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="flex flex-col gap-4"
			>
				<form.Field name="code">
					{(field) => (
						<Field className="flex flex-col gap-2">
							<Label
								htmlFor="verification-code"
								className="text-muted-foreground"
							>
								Enter verification code
							</Label>
							<InputOTP
								id="verification-code"
								maxLength={5}
								value={field.state.value}
								onChange={field.handleChange}
								onBlur={field.handleBlur}
								containerClassName="justify-center"
							>
								<InputOTPGroup>
									<InputOTPSlot
										index={0}
										className="size-12 text-base"
									/>
									<InputOTPSlot
										index={1}
										className="size-12 text-base"
									/>
									<InputOTPSlot
										index={2}
										className="size-12 text-base"
									/>
									<InputOTPSlot
										index={3}
										className="size-12 text-base"
									/>
									<InputOTPSlot
										index={4}
										className="size-12 text-base"
									/>
								</InputOTPGroup>
							</InputOTP>
							{field.state.meta.isTouched && !field.state.meta.isValid && (
								<FieldError errors={field.state.meta.errors} />
							)}
						</Field>
					)}
				</form.Field>

				{formErrors.length > 0 && <FieldError errors={formErrors} />}

				{resendErrors.length > 0 && <FieldError errors={resendErrors} />}

				<Field orientation="horizontal">
					<Button
						type="submit"
						className="w-full cursor-pointer"
						disabled={activateAccountMutation.isPending}
					>
						Verify Code
						<ArrowRightIcon
							className="size-4"
							weight="bold"
						/>
					</Button>
				</Field>

				<div className="space-y-1.5 text-center">
					<p className="text-sm text-muted-foreground">
						Didn&apos;t receive the code?
					</p>
					<Button
						type="button"
						variant="link"
						className="h-auto p-0 font-semibold text-primary tabular-nums"
						disabled={
							resendCooldown > 0 || resendActivationCodeMutation.isPending
						}
						onClick={handleResendCode}
					>
						{resendCooldown > 0
							? `Resend Code in ${resendCooldown}s`
							: "Resend Code"}
					</Button>
				</div>
			</form>
		</AuthPageShell>
	);
}
