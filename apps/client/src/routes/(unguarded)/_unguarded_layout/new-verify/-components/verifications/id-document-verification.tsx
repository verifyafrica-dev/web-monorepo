import {
	CarIcon,
	FileTextIcon,
	IdentificationCardIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";
import { useSubmitNewVerifyDocumentV2Mutation } from "#/api/http/v2/verifications/new-verify/new-verify.hooks";
import {
	createNewVerifyIdDocumentFormSchema,
	NEW_VERIFY_ID_DOCUMENT_FORM_DEFAULTS,
	type NewVerifyIdDocumentFormValues,
	type NewVerifySession,
	type ShuftiDocumentSupportedType,
} from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Field, FieldError, FieldLabel } from "@verifyafrica/ui/components/ui/field";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import documentVerificationCountries from "#/data/verification-countries/id_document_verification_countries.json";
import { uploadNewVerifyProofFile } from "@verifyafrica/api-client/lib/new-verify-proof-upload";
import { cn } from "@verifyafrica/ui/lib/utils";
import { KycDatePicker } from "../../../../../(auth)/_auth_layout/app/kyc/-components/kyc-form-primitives";

import {
	IdDocumentCapture,
	type IdDocumentCaptureResult,
} from "./id-document-capture";
import { VerificationInstructionsDialog } from "./verification-instructions-dialog";
import { VerificationSubmittedDialog } from "./verification-submitted-dialog";

const GENDER_OPTIONS = [
	{ value: "M", label: "Male" },
	{ value: "F", label: "Female" },
] as const;

const DOCUMENT_TYPE_OPTIONS = {
	id_card: {
		label: "ID card",
		captureTitle: "National ID",
		icon: IdentificationCardIcon,
	},
	passport: {
		label: "Passport",
		captureTitle: "Passport",
		icon: FileTextIcon,
	},
	driving_license: {
		label: "Driver's license",
		captureTitle: "Driver's license",
		icon: CarIcon,
	},
} as const satisfies Record<
	ShuftiDocumentSupportedType,
	{
		label: string;
		captureTitle: string;
		icon: typeof IdentificationCardIcon;
	}
>;

function isDocumentType(value: string): value is ShuftiDocumentSupportedType {
	return (
		value === "id_card" || value === "passport" || value === "driving_license"
	);
}

function getDocumentTypeOption(value: string) {
	if (!isDocumentType(value)) {
		return null;
	}

	return DOCUMENT_TYPE_OPTIONS[value];
}

type IdDocumentVerificationProps = {
	session: NewVerifySession;
};

export function IdDocumentVerification({
	session,
}: IdDocumentVerificationProps) {
	const [step, setStep] = useState<"select" | "capture" | "submitted">(
		"select",
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const submitDocumentMutation = useSubmitNewVerifyDocumentV2Mutation();
	const collect = session.collect;
	const verificationInstructions = collect.verification_instructions.trim();
	const needsPersonalDetails = collect.dob || collect.age || collect.gender;
	const formSchema = useMemo(
		() => createNewVerifyIdDocumentFormSchema(collect),
		[collect],
	);

	const documentTypes = useMemo(() => {
		const types = session.supported_types?.length
			? session.supported_types
			: (Object.keys(DOCUMENT_TYPE_OPTIONS) as ShuftiDocumentSupportedType[]);

		return types.filter((type) => type in DOCUMENT_TYPE_OPTIONS);
	}, [session.supported_types]);

	const form = useForm({
		defaultValues: NEW_VERIFY_ID_DOCUMENT_FORM_DEFAULTS,
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: () => {
			setStep("capture");
		},
	});

	function goToCaptureIfReady(nextValues: NewVerifyIdDocumentFormValues) {
		if (needsPersonalDetails) {
			return;
		}

		if (formSchema.safeParse(nextValues).success) {
			setStep("capture");
		}
	}

	async function handleProofComplete(
		result: IdDocumentCaptureResult,
		values: NewVerifyIdDocumentFormValues,
	) {
		if (!isDocumentType(values.documentType) || isSubmitting) {
			return;
		}

		setIsSubmitting(true);

		try {
			const proof = await uploadNewVerifyProofFile(
				session.token,
				result.front,
			);
			const additionalProof = result.back
				? await uploadNewVerifyProofFile(session.token, result.back)
				: undefined;

			await submitDocumentMutation.mutateAsync({
				token: session.token,
				payload: {
					country: values.country,
					supported_types: values.documentType,
					proof,
					additional_proof: additionalProof,
					dob: collect.dob ? values.dob : undefined,
					age: collect.age ? values.age : undefined,
					gender: collect.gender ? values.gender : undefined,
				},
			});
			setStep("submitted");
		} catch (error) {
			const axiosError = error as V2AxiosError;
			toast.error(
				axiosError.response?.data?.message ??
					(error instanceof Error
						? error.message
						: "Failed to submit verification"),
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			{verificationInstructions && step !== "submitted" ? (
				<VerificationInstructionsDialog
					instructions={verificationInstructions}
				/>
			) : null}
			{step === "submitted" ? <VerificationSubmittedDialog /> : null}
			<form.Subscribe selector={(state) => state.values}>
				{(values) => {
					const documentOption = getDocumentTypeOption(values.documentType);

					if (step === "capture" && documentOption) {
						return (
							<IdDocumentCapture
								country={values.country}
								title={documentOption.captureTitle}
								requireBackside={collect.backside_proof_required}
								isSubmitting={isSubmitting}
								onBack={() => setStep("select")}
								onComplete={(result) =>
									handleProofComplete(result, values)
								}
							/>
						);
					}

					if (step === "submitted") {
						return <div className="flex-1" />;
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
							<form.Field name="country">
								{(field) => (
									<Field className="gap-2">
										<FieldLabel
											htmlFor="new-verify-document-country"
											className="text-base font-semibold text-foreground"
										>
											Choose your document issuing country
										</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={(value) => {
												field.handleChange(value);
												goToCaptureIfReady({
													...values,
													country: value,
												});
											}}
										>
											<SelectTrigger
												id="new-verify-document-country"
												className="h-12 w-full rounded-xl"
											>
												<SelectValue placeholder="Country" />
											</SelectTrigger>
											<SelectContent className="max-h-72">
												{documentVerificationCountries.map((item) => (
													<SelectItem
														key={item.code}
														value={item.code}
													>
														<CountryOptionLabel
															name={item.name}
															countryCode={item.code}
															flagClassName="rounded-none"
														/>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>

							<form.Field name="documentType">
								{(field) => (
									<div className="space-y-3">
										<p className="text-base font-semibold text-foreground">
											Select document type for verification
										</p>
										<div className="grid grid-cols-3 gap-2.5">
											{documentTypes.map((type) => {
												const option = DOCUMENT_TYPE_OPTIONS[type];
												const Icon = option.icon;
												const isSelected = field.state.value === type;

												return (
													<Button
														key={type}
														type="button"
														onClick={() => {
															field.handleChange(type);
															goToCaptureIfReady({
																...values,
																documentType: type,
															});
														}}
														className={cn(
															"flex h-auto cursor-pointer flex-col items-center gap-3 rounded-2xl border bg-background px-2 py-5 text-center transition-[border-color,box-shadow,background-color]",
															isSelected
																? "border-primary shadow-[0_0_0_1px_var(--primary)] hover:bg-background"
																: "border-border hover:border-primary/40",
														)}
													>
														<span
															className={cn(
																"flex size-12 items-center justify-center rounded-full",
																isSelected
																	? "bg-primary/10 text-primary"
																	: "bg-muted text-muted-foreground",
															)}
														>
															<Icon
																className="size-6"
																weight="regular"
															/>
														</span>
														<span
															className={cn(
																"text-xs font-medium sm:text-sm",
																isSelected ? "text-primary" : "text-foreground",
															)}
														>
															{option.label}
														</span>
													</Button>
												);
											})}
										</div>
										<FieldError errors={field.state.meta.errors} />
									</div>
								)}
							</form.Field>

							{collect.dob ? (
								<form.Field name="dob">
									{(field) => (
										<Field className="gap-2">
											<FieldLabel htmlFor="new-verify-document-dob">
												Date of birth
											</FieldLabel>
											<KycDatePicker
												id="new-verify-document-dob"
												value={field.state.value}
												disableFutureDates
												onChange={(date: Date | undefined) =>
													field.handleChange(
														date ? format(date, "yyyy-MM-dd") : "",
													)
												}
											/>
											<FieldError errors={field.state.meta.errors} />
										</Field>
									)}
								</form.Field>
							) : null}

							{collect.age ? (
								<form.Field name="age">
									{(field) => (
										<Field className="gap-2">
											<FieldLabel htmlFor="new-verify-document-age">
												Age
											</FieldLabel>
											<Input
												id="new-verify-document-age"
												type="number"
												inputMode="numeric"
												min={1}
												max={150}
												placeholder="Age"
												className="h-9 rounded-xl"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
											/>
											<FieldError errors={field.state.meta.errors} />
										</Field>
									)}
								</form.Field>
							) : null}

							{collect.gender ? (
								<form.Field name="gender">
									{(field) => (
										<Field className="gap-2">
											<FieldLabel htmlFor="new-verify-document-gender">
												Gender
											</FieldLabel>
											<Select
												value={field.state.value}
												onValueChange={field.handleChange}
											>
												<SelectTrigger
													id="new-verify-document-gender"
													className="h-12 w-full rounded-xl"
												>
													<SelectValue placeholder="Select gender" />
												</SelectTrigger>
												<SelectContent>
													{GENDER_OPTIONS.map((option) => (
														<SelectItem
															key={option.value}
															value={option.value}
														>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FieldError errors={field.state.meta.errors} />
										</Field>
									)}
								</form.Field>
							) : null}

							{needsPersonalDetails ? (
								<form.Subscribe selector={(state) => state.canSubmit}>
									{(canSubmit) => (
										<div className="flex justify-end">
											<Button
												type="submit"
												className="rounded-full px-6"
												disabled={!canSubmit}
											>
												Continue
											</Button>
										</div>
									)}
								</form.Subscribe>
							) : null}
						</form>
					);
				}}
			</form.Subscribe>
		</>
	);
}
