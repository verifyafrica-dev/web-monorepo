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
import { Field, FieldLabel } from "@verifyafrica/ui/components/ui/field";
import { Input } from "@verifyafrica/ui/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";

import { KycDatePicker } from "../../../../../(auth)/_auth_layout/app/kyc/-components/kyc-form-primitives";
import {
	IdDocumentCapture,
	type IdDocumentCaptureResult,
} from "./id-document-capture";
import { MerchantPrefillCard } from "./merchant-prefill-card";
import { VerificationSubmittedDialog } from "./verification-submitted-dialog";

type GovernmentRegistryVerificationProps = {
	session: NewVerifySession;
};

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
	const requireSelfie = Boolean(session.require_selfie);
	const allowFileUpload = session.allow_file_upload !== false;

	const [step, setStep] = useState<"form" | "selfie" | "submitted">("form");
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

	const showValidationFields = useMemo(
		() =>
			visibleFields.some((field) =>
				["first_name", "last_name", "date_of_birth"].includes(field),
			),
		[visibleFields],
	);

	const formSchema = useMemo(() => {
		const shape: Record<string, z.ZodTypeAny> = {};
		for (const field of visibleFields) {
			if (requiredFields.includes(field)) {
				shape[field] = z.string().trim().min(1, `${fieldLabels[field] ?? field} is required`);
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
			if (allowSelfie && (requireSelfie || includeSelfie)) {
				setStep("selfie");
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

	async function handleSelfieComplete(result: IdDocumentCaptureResult) {
		if (isSubmitting) {
			return;
		}
		setIsSubmitting(true);
		try {
			const selfieUrl = await uploadNewVerifyProofFile(
				session.token,
				result.front,
			);
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

	if (step === "selfie") {
		return (
			<IdDocumentCapture
				country={session.country ?? "NG"}
				title="Selfie capture"
				requireBackside={false}
				isSubmitting={isSubmitting}
				allowFileUpload={allowFileUpload}
				onBack={() => setStep("form")}
				onComplete={(result) => void handleSelfieComplete(result)}
			/>
		);
	}

	return (
		<form
			className="flex flex-col gap-4 px-6 pb-8"
			onSubmit={(event) => {
				event.preventDefault();
				void form.handleSubmit();
			}}
		>
			<MerchantPrefillCard session={session} />

			<div className="space-y-1">
				<p className="text-base font-semibold text-foreground">
					Complete your registry check
				</p>
				<p className="text-sm text-muted-foreground">
					Fields marked with <span className="text-destructive">*</span> are
					required. Optional fields can improve match accuracy.
				</p>
			</div>

			{visibleFields.map((fieldName) => (
				<form.Field key={fieldName} name={fieldName}>
					{(field) => (
						<Field className="gap-1.5">
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
									<SelectTrigger id={`registry-${fieldName}`}>
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
									value={
										field.state.value
											? new Date(`${field.state.value}T00:00:00`)
											: undefined
									}
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
								/>
							)}
						</Field>
					)}
				</form.Field>
			))}

			{showValidationFields ? (
				<p className="text-xs text-muted-foreground">
					Name and date-of-birth fields are optional unless your merchant marked
					them as required.
				</p>
			) : null}

			{allowSelfie && !requireSelfie ? (
				<label className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
					<input
						type="checkbox"
						className="mt-1"
						checked={includeSelfie}
						onChange={(event) => setIncludeSelfie(event.target.checked)}
						disabled={isSubmitting}
					/>
					<span>
						Include a selfie for facial matching (optional).
					</span>
				</label>
			) : null}

			{allowSelfie && requireSelfie ? (
				<p className="text-sm text-muted-foreground">
					A selfie is required on the next step.
				</p>
			) : null}

			<Button type="submit" disabled={isSubmitting}>
				{allowSelfie ? "Continue" : isSubmitting ? "Submitting..." : "Submit"}
			</Button>
		</form>
	);
}
