import { CaretLeftIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";
import { useSubmitNewVerifyGovernmentRegistryV2Mutation } from "#/api/http/v2/verifications/new-verify/new-verify.hooks";
import type { NewVerifySession } from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";
import { uploadNewVerifyProofFile } from "@verifyafrica/api-client/lib/new-verify-proof-upload";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
import {
	Field,
	FieldError,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";

import { KycDatePicker } from "../../../../../(auth)/_auth_layout/app/kyc/-components/kyc-form-primitives";
import { FacialCapture } from "./facial-biometrics/facial-capture";
import { FacialReadyInstructions } from "./facial-biometrics/facial-ready-instructions";
import { MerchantPrefillCard } from "./merchant-prefill-card";
import { VerificationSubmittedDialog } from "./verification-submitted-dialog";

type GovernmentRegistryVerificationProps = {
	session: NewVerifySession;
};

type Step = "form" | "selfie-ready" | "selfie-capture" | "submitted";

function RequiredMark() {
	return <span className="text-destructive"> *</span>;
}

export function GovernmentRegistryVerification({
	session,
}: GovernmentRegistryVerificationProps) {
	const registryFields = session.registry_fields;
	const lockedFields = new Set(session.locked_fields ?? []);
	const requiredFields = registryFields?.required_fields ?? [];
	const optionalFields = registryFields?.optional_fields ?? [];
	const fieldLabels = registryFields?.field_labels ?? {};
	const allowSelfie = registryFields?.selfie_supported === true;
	const requireSelfie = Boolean(session.require_selfie) && allowSelfie;
	const allowFileUpload = session.allow_file_upload !== false;

	const [step, setStep] = useState<Step>("form");
	const [includeSelfie, setIncludeSelfie] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const mutation = useSubmitNewVerifyGovernmentRegistryV2Mutation();

	const visibleFields = useMemo(
		() =>
			[...requiredFields, ...optionalFields].filter(
				(field) => field !== "selfie" && !lockedFields.has(field),
			),
		[lockedFields, optionalFields, requiredFields],
	);

	const needsSelfieStep = allowSelfie && (requireSelfie || includeSelfie);

	const formSchema = useMemo(() => {
		const shape: Record<string, z.ZodTypeAny> = {};
		for (const field of visibleFields) {
			if (requiredFields.includes(field)) {
				shape[field] = z
					.string()
					.trim()
					.min(1, `${fieldLabels[field] ?? field} is required`);
			} else {
				shape[field] = z.string();
			}
		}
		return z.object(shape);
	}, [fieldLabels, requiredFields, visibleFields]);

	const defaultValues = useMemo(() => {
		const values: Record<string, string> = {};
		for (const field of visibleFields) {
			values[field] =
				(session.prefilled?.[field as keyof typeof session.prefilled] as
					| string
					| undefined) ?? "";
		}
		return values;
	}, [session.prefilled, visibleFields]);

	const form = useForm({
		defaultValues,
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			const shouldCaptureSelfie =
				allowSelfie && (requireSelfie || includeSelfie);
			if (shouldCaptureSelfie) {
				setStep("selfie-ready");
				return;
			}
			await submitPayload(value);
		},
	});

	async function submitPayload(
		values: Record<string, string>,
		selfieUrl?: string,
	) {
		setIsSubmitting(true);
		try {
			const payload: Record<string, string> = {};
			for (const [key, raw] of Object.entries(values)) {
				const trimmed = raw.trim();
				if (trimmed) {
					payload[key] = trimmed;
				}
			}
			if (selfieUrl) {
				payload.selfie = selfieUrl;
			}

			await mutation.mutateAsync({
				token: session.token,
				payload,
			});
			setStep("submitted");
		} catch (error) {
			const message = (error as V2AxiosError).response?.data?.message;
			toast.error(message ?? "Failed to submit government registry check.");
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleSelfieComplete(file: File) {
		if (isSubmitting) {
			return;
		}
		setIsSubmitting(true);
		try {
			const selfieUrl = await uploadNewVerifyProofFile(session.token, file);
			await submitPayload(form.state.values, selfieUrl);
		} catch (error) {
			const message = (error as V2AxiosError).response?.data?.message;
			toast.error(
				message ??
					(error instanceof Error ? error.message : "Failed to upload selfie"),
			);
			setIsSubmitting(false);
		}
	}

	if (step === "submitted") {
		return (
			<VerificationSubmittedDialog description="We've received your details. You can close this page now." />
		);
	}

	if (step === "selfie-ready") {
		return (
			<div className="flex min-h-0 flex-1 flex-col">
				<div className="flex items-center justify-between gap-3 px-4 pt-1 pb-3 md:px-5">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						className="-ml-1"
						onClick={() => setStep("form")}
						disabled={isSubmitting}
						aria-label="Go back"
					>
						<CaretLeftIcon
							className="size-5"
							weight="bold"
						/>
					</Button>
					<h2 className="truncate text-lg font-semibold tracking-tight">
						Selfie
					</h2>
					<span className="size-8" />
				</div>
				<FacialReadyInstructions
					verificationMode="image_only"
					onContinue={() => setStep("selfie-capture")}
				/>
			</div>
		);
	}

	if (step === "selfie-capture") {
		return (
			<div className="flex min-h-0 flex-1 flex-col">
				<div className="flex items-center justify-between gap-3 px-4 pt-1 pb-3 md:px-5">
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						className="-ml-1"
						onClick={() => setStep("selfie-ready")}
						disabled={isSubmitting}
						aria-label="Go back"
					>
						<CaretLeftIcon
							className="size-5"
							weight="bold"
						/>
					</Button>
					<h2 className="truncate text-lg font-semibold tracking-tight">
						Selfie capture
					</h2>
					<span className="size-8" />
				</div>
				<FacialCapture
					verificationMode="image_only"
					allowFileUpload={allowFileUpload}
					isSubmitting={isSubmitting}
					onComplete={(file) => void handleSelfieComplete(file)}
				/>
			</div>
		);
	}

	return (
		<form
			className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-6"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<MerchantPrefillCard session={session} />

			<div className="space-y-1">
				<p className="text-base font-semibold text-foreground">
					Complete your registry check
				</p>
				<p className="text-sm text-muted-foreground text-pretty">
					Fields marked with <span className="text-destructive">*</span> are
					required. Optional fields can improve match accuracy.
				</p>
			</div>

			{visibleFields.length === 0 && !needsSelfieStep ? (
				<p className="text-sm text-muted-foreground text-pretty">
					Your merchant already provided the required details. Submit to
					continue.
				</p>
			) : null}

			{visibleFields.map((fieldName) => (
				<form.Field
					key={fieldName}
					name={fieldName}
				>
					{(field) => (
						<Field className="gap-2">
							<FieldLabel htmlFor={`registry-${fieldName}`}>
								{fieldLabels[fieldName] ?? fieldName}
								{requiredFields.includes(fieldName) ? <RequiredMark /> : null}
							</FieldLabel>
							{fieldName === "type" ? (
								<Select
									value={field.state.value || undefined}
									onValueChange={field.handleChange}
									disabled={isSubmitting}
								>
									<SelectTrigger
										id={`registry-${fieldName}`}
										className="h-12 w-full rounded-xl"
									>
										<SelectValue placeholder="Select identity type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="national_id">National ID</SelectItem>
										<SelectItem value="passport">Passport</SelectItem>
									</SelectContent>
								</Select>
							) : fieldName === "date_of_birth" ? (
								<KycDatePicker
									id={`registry-${fieldName}`}
									value={field.state.value || undefined}
									disableFutureDates
									onChange={(date) =>
										field.handleChange(date ? format(date, "yyyy-MM-dd") : "")
									}
									disabled={isSubmitting}
								/>
							) : (
								<Input
									id={`registry-${fieldName}`}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									disabled={isSubmitting}
									className="h-9 rounded-xl"
									placeholder={fieldLabels[fieldName] ?? fieldName}
								/>
							)}
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>
			))}

			{allowSelfie && !requireSelfie ? (
				<div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
					<Checkbox
						id="registry-include-selfie"
						checked={includeSelfie}
						onCheckedChange={(checked) => setIncludeSelfie(checked === true)}
						disabled={isSubmitting}
					/>
					<div className="space-y-1">
						<Label
							htmlFor="registry-include-selfie"
							className="font-medium"
						>
							Include a selfie for facial matching
						</Label>
						<p className="text-sm text-muted-foreground text-pretty">
							{allowFileUpload
								? "Optional. You can use your camera or upload a photo on the next step."
								: "Optional. You will capture a selfie with your camera on the next step."}
						</p>
					</div>
				</div>
			) : null}

			{requireSelfie ? (
				<p className="text-sm text-muted-foreground text-pretty">
					{allowFileUpload
						? "A selfie is required next. You can use your camera or upload a photo."
						: "A selfie is required next. Camera capture only — file upload is not available for this check."}
				</p>
			) : null}

			<form.Subscribe selector={(state) => state.canSubmit}>
				{(canSubmit) => (
					<div className="flex justify-end pt-1">
						<Button
							type="submit"
							className="rounded-full px-6"
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting
								? "Submitting…"
								: needsSelfieStep
									? "Continue"
									: "Submit"}
						</Button>
					</div>
				)}
			</form.Subscribe>
		</form>
	);
}
