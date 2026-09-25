import {
	GlobeHemisphereWestIcon,
	LinkIcon,
	MagnifyingGlassIcon,
	PaperPlaneTiltIcon,
	UserCircleCheckIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@verifyafrica/ui/components/ui/accordion";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@verifyafrica/ui/components/ui/toggle-group";
import { cn } from "@verifyafrica/ui/lib/utils";
import { VerificationConsentCheckbox } from "../../../-components/VerificationConsentCheckbox";
import {
	DEFAULT_VERIFICATION_URL_LIMIT,
	VERIFICATION_MODES,
	VERIFICATION_URL_LIMITS,
	type VerificationMode,
	verificationConsentSchema,
} from "../../../-components/VerificationConsentCheckbox/data";
import { useTenantSupportedCountries } from "../../-countries";
import { ProductProofUpload } from "../../-components/product-proof-upload";
import { VerificationResultDialog } from "../../-components/verification-result-dialog";
import { useProductVerificationSubmit } from "../../-use-product-verification-submit";
import {
	IMAGE_UPLOAD_MIME_TYPES,
	PRODUCT_UPLOAD_VERIFICATIONS,
} from "../../-upload-utils";
import { KycDatePicker } from "../../../kyc/-components/kyc-form-primitives";
import {
	allowsCustomerDataValidation,
	buildGovernmentRegistryDirectPayload,
	buildGovernmentRegistryLinkPayload,
	filterToRegistryCountries,
	getPrimaryInputLabel,
	getPrimaryInputParameter,
	getRegistryVerificationTypes,
	isCiIdentityIdParameter,
	isValidCiIdentityId,
	normalizeCiIdentityId,
	registryTypeSupportsSelfie,
	requiresLastNameField,
} from "../-data";
import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";

const baseFormSchema = z.object({
	country: z.string().min(1, "Country is required"),
	verificationType: z.string().min(1, "Verification type is required"),
	email: z.string(),
	urlLimit: z.string(),
	requireSelfie: z.boolean(),
	input: z.string(),
	lastName: z.string(),
	includeValidation: z.boolean(),
	validationFirstName: z.string(),
	validationLastName: z.string(),
	validationDateOfBirth: z.string(),
	includeSelfie: z.boolean(),
	consent: z.boolean(),
});

function buildGovernmentRegistryFormSchema(mode: VerificationMode) {
	return baseFormSchema.superRefine((values, context) => {
		const showFullForm = Boolean(values.country && values.verificationType);

		if (!showFullForm) {
			return;
		}

		if (mode === "link") {
			const emailResult = z.email().safeParse(values.email.trim());
			if (!emailResult.success) {
				context.addIssue({
					code: "custom",
					path: ["email"],
					message: "Enter a valid email address",
				});
			}
			if (!values.urlLimit.trim()) {
				context.addIssue({
					code: "custom",
					path: ["urlLimit"],
					message: "Select a verification URL limit",
				});
			}
		} else if (!values.input.trim()) {
			context.addIssue({
				code: "custom",
				path: ["input"],
				message: "Input data is required",
			});
		}

		if (values.input.trim()) {
			const inputField = getPrimaryInputParameter(values.verificationType);
			if (
				isCiIdentityIdParameter(inputField) &&
				!isValidCiIdentityId(values.input)
			) {
				context.addIssue({
					code: "custom",
					path: ["input"],
					message: "Must be 7 to 12 alphanumeric characters",
				});
			}
		}

		if (
			requiresLastNameField(values.verificationType) &&
			!values.lastName.trim()
		) {
			context.addIssue({
				code: "custom",
				path: ["lastName"],
				message: "Last name is required",
			});
		}

		const consentResult = verificationConsentSchema.safeParse(values.consent);
		if (!consentResult.success) {
			context.addIssue({
				code: "custom",
				path: ["consent"],
				message:
					consentResult.error.issues[0]?.message ?? "Consent is required",
			});
		}
	});
}

const defaultValues = {
	country: "",
	verificationType: "",
	email: "",
	urlLimit: DEFAULT_VERIFICATION_URL_LIMIT,
	requireSelfie: false,
	input: "",
	lastName: "",
	includeValidation: false,
	validationFirstName: "",
	validationLastName: "",
	validationDateOfBirth: "",
	includeSelfie: false,
	consent: false,
};

type GovernmentRegistryChecksFormProps = {
	verificationType: string;
	onVerificationTypeChange: (verificationType: string) => void;
};

export function GovernmentRegistryChecksForm({
	verificationType,
	onVerificationTypeChange,
}: GovernmentRegistryChecksFormProps) {
	const [mode, setMode] = useState<VerificationMode>("link");
	const [selfieProofUrl, setSelfieProofUrl] = useState<string | null>(null);
	const [isProofUploading, setIsProofUploading] = useState(false);
	const [country, setCountry] = useState("");
	const [includeSelfie, setIncludeSelfie] = useState(false);
	const {
		submitVerification,
		linkResult,
		verificationResult,
		isResultDialogOpen,
		setIsResultDialogOpen,
		isSubmitting,
		handleStartNewVerification,
	} = useProductVerificationSubmit({
		errorMessage: "Failed to submit government registry verification.",
	});
	const { countries, isPending: isCountriesPending } =
		useTenantSupportedCountries({ filter: filterToRegistryCountries });
	console.log(countries);
	const verificationTypes = useMemo(
		() => (country ? getRegistryVerificationTypes(country) : []),
		[country],
	);

	const showFullForm = Boolean(country && verificationType);
	const isLinkMode = mode === "link";
	const showLastName = requiresLastNameField(verificationType);
	const allowValidation = allowsCustomerDataValidation(verificationType);
	const supportsSelfie = registryTypeSupportsSelfie(verificationType);
	const inputLabel = verificationType
		? getPrimaryInputLabel(verificationType)
		: "Input Data";
	const formSchema = useMemo(
		() => buildGovernmentRegistryFormSchema(mode),
		[mode],
	);

	const form = useForm({
		defaultValues,
		validators: {
			onChange: formSchema,
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			if (mode === "direct" && includeSelfie && !selfieProofUrl) {
				toast.error("Selfie image is required for facial matching");
				return;
			}

			const payload =
				mode === "link"
					? buildGovernmentRegistryLinkPayload({
							...value,
							requireSelfie: value.requireSelfie,
						})
					: buildGovernmentRegistryDirectPayload(value, { selfieProofUrl });

			const submitted = await submitVerification(
				payload,
				mode === "link"
					? {
							mode: "link",
							email: value.email,
							urlLimit: value.urlLimit,
						}
					: { mode: "direct" },
			);

			if (submitted) {
				resetForms();
			}
		},
	});

	const resetDependentFields = () => {
		form.setFieldValue("input", "");
		form.setFieldValue("lastName", "");
		form.setFieldValue("includeValidation", false);
		form.setFieldValue("validationFirstName", "");
		form.setFieldValue("validationLastName", "");
		form.setFieldValue("validationDateOfBirth", "");
		form.setFieldValue("includeSelfie", false);
		form.setFieldValue("consent", false);
		setIncludeSelfie(false);
		setSelfieProofUrl(null);
	};

	function resetForms() {
		form.reset();
		setCountry("");
		onVerificationTypeChange("");
		setIncludeSelfie(false);
		setSelfieProofUrl(null);
		setIsProofUploading(false);
	}

	const handleReset = () => {
		resetForms();
	};

	return (
		<Card>
			<CardContent className="pt-0">
				<form
					className="flex flex-col gap-6"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm font-medium text-muted-foreground">
							Verification Mode
						</p>
						<ToggleGroup
							type="single"
							value={mode}
							onValueChange={(value) => {
								if (value === "link" || value === "direct") {
									setMode(value);
								}
							}}
							variant="outline"
							spacing={0}
							className="w-full sm:w-auto"
						>
							{VERIFICATION_MODES.map((option) => {
								const Icon =
									option.value === "link" ? LinkIcon : MagnifyingGlassIcon;

								return (
									<ToggleGroupItem
										key={option.value}
										value={option.value}
										className={cn("flex-1 sm:flex-none")}
									>
										<Icon className="size-4" />
										{option.label}
									</ToggleGroupItem>
								);
							})}
						</ToggleGroup>
					</div>

					<FieldGroup className="gap-4">
						<form.Field name="country">
							{(field) => (
								<Field className="gap-1.5">
									<FieldLabel htmlFor="government-registry-checks-country">
										Select Country <span className="text-destructive">*</span>
									</FieldLabel>
									<Select
										value={field.state.value || undefined}
										onValueChange={(value) => {
											field.handleChange(value);
											setCountry(value);
											onVerificationTypeChange("");
											form.setFieldValue("verificationType", "");
											resetDependentFields();
										}}
										disabled={isCountriesPending || isSubmitting}
									>
										<SelectTrigger
											id="government-registry-checks-country"
											className="w-full"
										>
											<div className="flex items-center gap-2">
												<GlobeHemisphereWestIcon className="size-4 text-muted-foreground" />
												<SelectValue
													placeholder={
														isCountriesPending
															? "Loading countries..."
															: "Select a country"
													}
												/>
											</div>
										</SelectTrigger>
										<SelectContent>
											{countries.map((countryOption) => (
												<SelectItem
													key={countryOption.code}
													value={countryOption.code}
												>
													<CountryOptionLabel
														name={countryOption.name}
														countryCode={countryOption.code}
													/>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							)}
						</form.Field>

						{country ? (
							<form.Field name="verificationType">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="government-registry-checks-type">
											Select Verification Type{" "}
											<span className="text-destructive">*</span>
										</FieldLabel>
										<Select
											value={field.state.value || undefined}
											onValueChange={(value) => {
												field.handleChange(value);
												onVerificationTypeChange(value);
												resetDependentFields();
											}}
											disabled={isSubmitting || verificationTypes.length === 0}
										>
											<SelectTrigger
												id="government-registry-checks-type"
												className="w-full"
											>
												<SelectValue placeholder="Select verification type" />
											</SelectTrigger>
											<SelectContent>
												{verificationTypes.map((type) => (
													<SelectItem
														key={type.value}
														value={type.value}
													>
														{type.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FieldDescription>
											Select a verification type from the available options
										</FieldDescription>
									</Field>
								)}
							</form.Field>
						) : null}

						{showLastName ? (
							<form.Field name="lastName">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="government-registry-checks-last-name">
											Last Name <span className="text-destructive">*</span>
										</FieldLabel>
										<Input
											id="government-registry-checks-last-name"
											placeholder="Enter last name"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											disabled={isSubmitting}
										/>
									</Field>
								)}
							</form.Field>
						) : null}

						{showFullForm && isLinkMode ? (
							<>
								<form.Field name="email">
									{(field) => (
										<Field className="gap-1.5">
											<FieldLabel htmlFor="government-registry-checks-link-email">
												Customer email{" "}
												<span className="text-destructive">*</span>
											</FieldLabel>
											<Input
												id="government-registry-checks-link-email"
												type="email"
												placeholder="customer@example.com"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												disabled={isSubmitting}
											/>
										</Field>
									)}
								</form.Field>
								<form.Field name="urlLimit">
									{(field) => (
										<Field className="gap-1.5">
											<FieldLabel htmlFor="government-registry-checks-url-limit">
												Verification URL limit{" "}
												<span className="text-destructive">*</span>
											</FieldLabel>
											<Select
												value={field.state.value || undefined}
												onValueChange={field.handleChange}
												disabled={isSubmitting}
											>
												<SelectTrigger id="government-registry-checks-url-limit">
													<SelectValue placeholder="Select link expiry" />
												</SelectTrigger>
												<SelectContent>
													{VERIFICATION_URL_LIMITS.map((limit) => (
														<SelectItem
															key={limit.value}
															value={limit.value}
														>
															{limit.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</Field>
									)}
								</form.Field>
							</>
						) : null}

						{showFullForm ? (
							<form.Field name="input">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="government-registry-checks-input">
											{inputLabel}{" "}
											{!isLinkMode ? (
												<span className="text-destructive">*</span>
											) : null}
										</FieldLabel>
										<Input
											id="government-registry-checks-input"
											placeholder="Enter document number"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => {
												const next = event.target.value;
												const inputField =
													getPrimaryInputParameter(verificationType);
												field.handleChange(
													isCiIdentityIdParameter(inputField)
														? normalizeCiIdentityId(next)
														: next,
												);
											}}
											disabled={isSubmitting}
											autoCapitalize={
												isCiIdentityIdParameter(
													getPrimaryInputParameter(verificationType),
												)
													? "characters"
													: undefined
											}
										/>
									</Field>
								)}
							</form.Field>
						) : null}
					</FieldGroup>

					{showFullForm && allowValidation ? (
						<Accordion
							type="single"
							collapsible
							className="rounded-lg border px-4"
						>
							<AccordionItem
								value="customer-data-validation"
								className="border-none"
							>
								<AccordionTrigger className="py-4 hover:no-underline">
									<div className="flex items-center gap-3 text-left">
										<UserCircleCheckIcon className="size-5 shrink-0 text-secondary" />
										<div>
											<p className="text-sm font-medium">
												Customer data validation
											</p>
											<p className="text-xs font-normal text-muted-foreground">
												Optional first name, last name, and date of birth
											</p>
										</div>
									</div>
								</AccordionTrigger>
								<AccordionContent className="space-y-4 pb-4">
									<p className="text-sm text-muted-foreground text-pretty">
										{isLinkMode
											? "Prefill any of these fields to lock them on the hosted link. Leave them blank so the customer enters their own details. Values you send are compared against the registry response when present."
											: "Optionally include name and date of birth to compare against the registry response. Leave blank to run the check with the primary identifier only."}
									</p>
									<div className="grid gap-4 md:grid-cols-3">
										<form.Field name="validationFirstName">
											{(field) => (
												<Field className="gap-1.5">
													<FieldLabel htmlFor="government-registry-checks-validation-first-name">
														First Name
													</FieldLabel>
													<Input
														id="government-registry-checks-validation-first-name"
														placeholder="Optional"
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(event) =>
															field.handleChange(event.target.value)
														}
														disabled={isSubmitting}
													/>
												</Field>
											)}
										</form.Field>

										<form.Field name="validationLastName">
											{(field) => (
												<Field className="gap-1.5">
													<FieldLabel htmlFor="government-registry-checks-validation-last-name">
														Last Name
													</FieldLabel>
													<Input
														id="government-registry-checks-validation-last-name"
														placeholder="Optional"
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(event) =>
															field.handleChange(event.target.value)
														}
														disabled={isSubmitting}
													/>
												</Field>
											)}
										</form.Field>

										<form.Field name="validationDateOfBirth">
											{(field) => (
												<Field className="gap-1.5">
													<FieldLabel htmlFor="government-registry-checks-validation-dob">
														Date of Birth
													</FieldLabel>
													<KycDatePicker
														id="government-registry-checks-validation-dob"
														value={field.state.value || undefined}
														disableFutureDates
														onChange={(date) => {
															field.handleChange(
																date ? format(date, "yyyy-MM-dd") : "",
															);
														}}
														disabled={isSubmitting}
													/>
												</Field>
											)}
										</form.Field>
									</div>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					) : null}

					{showFullForm && isLinkMode && supportsSelfie && verificationType ? (
						<form.Field name="requireSelfie">
							{(field) => (
								<div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
									<Checkbox
										id="government-registry-checks-require-selfie"
										checked={field.state.value}
										onCheckedChange={(checked) =>
											field.handleChange(checked === true)
										}
										disabled={isSubmitting}
									/>
									<div className="space-y-1">
										<Label
											htmlFor="government-registry-checks-require-selfie"
											className="font-medium"
										>
											Require customer selfie
										</Label>
										<p className="text-sm text-muted-foreground">
											When enabled, the customer must capture or upload a selfie
											on the hosted link.
										</p>
									</div>
								</div>
							)}
						</form.Field>
					) : null}

					{showFullForm && !isLinkMode ? (
						<form.Field name="includeSelfie">
							{(field) => (
								<div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
									<Checkbox
										id="government-registry-checks-include-selfie"
										checked={field.state.value}
										onCheckedChange={(checked) => {
											const isChecked = checked === true;
											field.handleChange(isChecked);
											setIncludeSelfie(isChecked);

											if (!isChecked) {
												setSelfieProofUrl(null);
											}
										}}
										disabled={isSubmitting}
									/>
									<div className="space-y-1">
										<Label
											htmlFor="government-registry-checks-include-selfie"
											className="font-medium"
										>
											Include Selfie Validation
										</Label>
										<p className="text-sm text-muted-foreground">
											Compare the submitted selfie against registry identity
											data.
										</p>
									</div>
								</div>
							)}
						</form.Field>
					) : null}

					{showFullForm && !isLinkMode && includeSelfie ? (
						<ProductProofUpload
							label="Selfie Image"
							verificationName={
								PRODUCT_UPLOAD_VERIFICATIONS.governmentRegistryChecks
							}
							proofUrl={selfieProofUrl}
							onProofUrlChange={setSelfieProofUrl}
							onUploadingChange={setIsProofUploading}
							accept="image/*"
							allowedMimeTypes={IMAGE_UPLOAD_MIME_TYPES}
							emptyStateText="Click to upload a selfie image"
							disabled={isSubmitting}
						/>
					) : null}

					{showFullForm ? (
						<form.Field name="consent">
							{(field) => (
								<VerificationConsentCheckbox
									id="government-registry-checks-consent"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
							)}
						</form.Field>
					) : null}

					{showFullForm ? (
						<div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
							<Button
								type="button"
								variant="outline"
								onClick={handleReset}
								disabled={isSubmitting}
							>
								Reset
							</Button>

							<form.Subscribe selector={(state) => state.canSubmit}>
								{(canSubmit) => (
									<Button
										type="submit"
										className="cursor-pointer sm:min-w-48"
										disabled={
											!canSubmit ||
											(includeSelfie && !selfieProofUrl) ||
											isProofUploading ||
											isSubmitting
										}
									>
										<PaperPlaneTiltIcon className="size-4" />
										{isSubmitting
											? "Submitting..."
											: isLinkMode
												? "Create Verification Link"
												: "Submit Verification"}
									</Button>
								)}
							</form.Subscribe>
						</div>
					) : null}
				</form>
			</CardContent>

			<VerificationResultDialog
				open={isResultDialogOpen}
				onOpenChange={setIsResultDialogOpen}
				linkResult={linkResult}
				verification={verificationResult}
				onStartNew={() => handleStartNewVerification(resetForms)}
				description="Your government registry verification request was created successfully."
			/>
		</Card>
	);
}
