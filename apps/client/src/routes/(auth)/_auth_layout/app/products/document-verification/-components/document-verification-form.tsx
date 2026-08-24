import {
	LinkIcon,
	LinkSimpleIcon,
	MagnifyingGlassIcon,
	PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useCreateNewVerifyV2Mutation } from "#/api/http/v2/verifications/new-verify/new-verify.hooks";
import { useCreateVerificationRequestV2Mutation } from "#/api/http/v2/verifications/verifications.hooks";
import type { VerificationRequest } from "#/api/http/v2/verifications/verifications.types";
import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";
import type { HostedLinkResult } from "@verifyafrica/api-client/lib/verification-links";
import { buildLinkResult } from "@verifyafrica/api-client/lib/verification-links";
import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { Textarea } from "@verifyafrica/ui/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@verifyafrica/ui/components/ui/toggle-group";
import { cn } from "@verifyafrica/ui/lib/utils";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { VerificationConsentCheckbox } from "../../../-components/VerificationConsentCheckbox";
import { useTenantSupportedCountries } from "../../-countries";
import { ProductProofUpload } from "../../-components/product-proof-upload";
import { VerificationResultDialog } from "../../-components/verification-result-dialog";
import { PRODUCT_UPLOAD_VERIFICATIONS } from "../../-upload-utils";
import { useCurrentTenant } from "../../../team/-data";
import {
	buildDocumentVerificationDirectPayload,
	buildDocumentVerificationLinkPayload,
	buildDocumentVerificationNewLinkPayload,
} from "../-data";
import {
	DEFAULT_VERIFICATION_URL_LIMIT,
	VERIFICATION_MODES,
	VERIFICATION_URL_LIMITS,
	type VerificationMode,
	verificationConsentSchema,
} from "../../../-components/VerificationConsentCheckbox/data";

type DocumentVerificationMode = VerificationMode | "newLink";

const DOCUMENT_VERIFICATION_MODES = [
	...VERIFICATION_MODES,
	{ value: "newLink" as const, label: "New Link" },
] satisfies Array<{ value: DocumentVerificationMode; label: string }>;

const newLinkCollectFieldsSchema = z.object({
	dob: z.boolean(),
	age: z.boolean(),
	gender: z.boolean(),
	backsideProofRequired: z.boolean(),
});

const NEW_LINK_COLLECT_FIELD_LABELS = {
	dob: "Date of birth",
	age: "Age",
	gender: "Gender",
	backsideProofRequired: "Require Backside",
} as const satisfies Record<
	keyof z.infer<typeof newLinkCollectFieldsSchema>,
	string
>;

const NEW_LINK_COLLECT_FIELDS = (
	Object.keys(newLinkCollectFieldsSchema.shape) as Array<
		keyof z.infer<typeof newLinkCollectFieldsSchema>
	>
).map((name) => ({
	name,
	label: NEW_LINK_COLLECT_FIELD_LABELS[name],
}));

const linkFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	urlLimit: z.string().min(1, "Select a verification URL limit"),
	consent: verificationConsentSchema,
	...newLinkCollectFieldsSchema.shape,
	verificationInstructions: z.string(),
});

const directFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	country: z.string().min(1, "Select a country"),
	firstName: z.string().trim().min(1, "First name is required"),
	lastName: z.string().trim().min(1, "Last name is required"),
	consent: verificationConsentSchema,
});

export function DocumentVerificationForm() {
	const [mode, setMode] = useState<DocumentVerificationMode>("link");
	const modeRef = useRef(mode);
	modeRef.current = mode;
	const [documentProofUrl, setDocumentProofUrl] = useState<string | null>(null);
	const [isDocumentUploading, setIsDocumentUploading] = useState(false);
	const [linkResult, setLinkResult] = useState<HostedLinkResult | null>(null);
	const [verificationResult, setVerificationResult] =
		useState<VerificationRequest | null>(null);
	const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
	const { tenantId } = useCurrentTenant();
	const createVerificationMutation = useCreateVerificationRequestV2Mutation();
	const createNewVerifyMutation = useCreateNewVerifyV2Mutation();
	const { countries, isPending: isCountriesPending } =
		useTenantSupportedCountries();
	const isSubmitting =
		createVerificationMutation.isPending || createNewVerifyMutation.isPending;

	async function submitVerification(
		payload: ReturnType<typeof buildDocumentVerificationLinkPayload>,
		options:
			| {
					mode: "link" | "newLink";
					email: string;
					urlLimit: string;
			  }
			| {
					mode: "direct";
			  },
	) {
		if (!tenantId) {
			toast.error("No tenant selected.");
			return;
		}

		try {
			const verification =
				options.mode === "newLink"
					? await createNewVerifyMutation.mutateAsync({
							tenantId,
							payload,
						})
					: await createVerificationMutation.mutateAsync({
							tenantId,
							payload,
						});

			if (options.mode === "link" || options.mode === "newLink") {
				setLinkResult(
					buildLinkResult(
						verification,
						options.email,
						Number(options.urlLimit),
					),
				);
				setVerificationResult(null);
			} else {
				setVerificationResult(verification);
				setLinkResult(null);
			}

			setIsResultDialogOpen(true);
			resetForms();
		} catch (error) {
			const message = (error as V2AxiosError).response?.data?.message;
			toast.error(message ?? "Failed to submit document verification.");
		}
	}

	const linkForm = useForm({
		defaultValues: {
			email: "",
			urlLimit: DEFAULT_VERIFICATION_URL_LIMIT,
			consent: false,
			dob: false,
			age: false,
			gender: false,
			backsideProofRequired: false,
			verificationInstructions: "",
		},
		validators: {
			onChange: linkFormSchema,
			onSubmit: linkFormSchema,
		},
		onSubmit: async ({ value }) => {
			const currentMode = modeRef.current === "newLink" ? "newLink" : "link";
			await submitVerification(
				currentMode === "newLink"
					? buildDocumentVerificationNewLinkPayload(value)
					: buildDocumentVerificationLinkPayload(value),
				{
					mode: currentMode,
					email: value.email,
					urlLimit: value.urlLimit,
				},
			);
		},
	});

	const directForm = useForm({
		defaultValues: {
			email: "",
			country: "",
			firstName: "",
			lastName: "",
			consent: false,
		},
		validators: {
			onChange: directFormSchema,
			onSubmit: directFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (!documentProofUrl) {
				toast.error("Please upload a document");
				return;
			}

			await submitVerification(
				buildDocumentVerificationDirectPayload(value, documentProofUrl),
				{ mode: "direct" },
			);
		},
	});

	function resetForms() {
		linkForm.reset();
		directForm.reset();
		setDocumentProofUrl(null);
		setIsDocumentUploading(false);
	}

	function handleStartNewVerification() {
		setIsResultDialogOpen(false);
		setLinkResult(null);
		setVerificationResult(null);
		resetForms();
	}

	const activeForm = mode === "direct" ? directForm : linkForm;

	useEffect(() => {
		if (mode !== "direct") {
			return;
		}

		const selectedCountry = directForm.getFieldValue("country");
		if (!selectedCountry) {
			return;
		}

		const isSelectedCountryEnabled = countries.some(
			(country) => country.code === selectedCountry,
		);

		if (!isSelectedCountryEnabled) {
			directForm.setFieldValue("country", "");
		}
	}, [countries, mode, directForm]);

	return (
		<Card>
			<CardContent className="pt-0">
				<form
					className="flex flex-col gap-6"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void activeForm.handleSubmit();
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
								if (!value) {
									return;
								}

								setMode(value as DocumentVerificationMode);

								if (value !== "direct") {
									setDocumentProofUrl(null);
									setIsDocumentUploading(false);
								}
							}}
							variant="outline"
							spacing={0}
							className="w-full sm:w-auto"
						>
							{DOCUMENT_VERIFICATION_MODES.map((option) => {
								const Icon =
									option.value === "link"
										? LinkIcon
										: option.value === "newLink"
											? LinkSimpleIcon
											: MagnifyingGlassIcon;

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

					{mode !== "direct" ? (
						<FieldGroup>
							<linkForm.Field name="email">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="document-verification-email">
											Email Address
										</FieldLabel>
										<Input
											id="document-verification-email"
											type="email"
											autoComplete="email"
											placeholder="Email Address"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</Field>
								)}
							</linkForm.Field>

							<linkForm.Field name="urlLimit">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="document-verification-url-limit">
											Verification URL Limit
										</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
										>
											<SelectTrigger
												id="document-verification-url-limit"
												className="w-full"
											>
												<SelectValue placeholder="Select duration" />
											</SelectTrigger>
											<SelectContent>
												{VERIFICATION_URL_LIMITS.map((option) => (
													<SelectItem
														key={option.value}
														value={option.value}
													>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FieldDescription>
											How long the verification link stays active
										</FieldDescription>
									</Field>
								)}
							</linkForm.Field>

							{mode === "newLink" ? (
								<>
									<Field className="gap-3">
										<FieldLabel>Collect additional fields</FieldLabel>
										<FieldDescription>
											End users will be asked for any fields you enable. Front
											of document is always required.
										</FieldDescription>
										<div className="grid gap-3 sm:grid-cols-2">
											{NEW_LINK_COLLECT_FIELDS.map(({ name, label }) => (
												<linkForm.Field
													key={name}
													name={name}
												>
													{(field) => (
														<div className="flex items-center gap-2">
															<Checkbox
																id={`new-link-${name}`}
																checked={field.state.value}
																onCheckedChange={(checked) =>
																	field.handleChange(checked === true)
																}
															/>
															<Label
																htmlFor={`new-link-${name}`}
																className="text-sm font-normal"
															>
																{label}
															</Label>
														</div>
													)}
												</linkForm.Field>
											))}
										</div>
									</Field>
									<linkForm.Field name="verificationInstructions">
										{(field) => (
											<Field className="gap-1.5">
												<FieldLabel htmlFor="new-link-verification-instructions">
													Verification instructions
												</FieldLabel>
												<Textarea
													id="new-link-verification-instructions"
													placeholder="Optional instructions shown to the end user"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
												/>
											</Field>
										)}
									</linkForm.Field>
								</>
							) : null}
						</FieldGroup>
					) : (
						<FieldGroup className="gap-4">
							<directForm.Field name="email">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="document-verification-direct-email">
											Email Address
										</FieldLabel>
										<Input
											id="document-verification-direct-email"
											type="email"
											autoComplete="email"
											placeholder="Email Address"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</Field>
								)}
							</directForm.Field>

							<directForm.Field name="country">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="document-verification-country">
											Country
										</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
											disabled={isCountriesPending}
										>
											<SelectTrigger
												id="document-verification-country"
												className="w-full"
											>
												<SelectValue
													placeholder={
														isCountriesPending
															? "Loading countries..."
															: "Select a country"
													}
												/>
											</SelectTrigger>
											<SelectContent className="max-h-60">
												{countries.map((country) => (
													<SelectItem
														key={country.code}
														value={country.code}
													>
														<CountryOptionLabel
															name={country.name}
															countryCode={country.code}
														/>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								)}
							</directForm.Field>

							<div className="grid gap-4 sm:grid-cols-2">
								<directForm.Field name="firstName">
									{(field) => (
										<Field className="gap-1.5">
											<FieldLabel htmlFor="document-verification-first-name">
												First Name
											</FieldLabel>
											<Input
												id="document-verification-first-name"
												autoComplete="given-name"
												placeholder="First Name"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
											/>
										</Field>
									)}
								</directForm.Field>

								<directForm.Field name="lastName">
									{(field) => (
										<Field className="gap-1.5">
											<FieldLabel htmlFor="document-verification-last-name">
												Last Name
											</FieldLabel>
											<Input
												id="document-verification-last-name"
												autoComplete="family-name"
												placeholder="Last Name"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
											/>
										</Field>
									)}
								</directForm.Field>
							</div>

							<ProductProofUpload
								label="Document"
								verificationName={
									PRODUCT_UPLOAD_VERIFICATIONS.documentVerification
								}
								proofUrl={documentProofUrl}
								onProofUrlChange={setDocumentProofUrl}
								onUploadingChange={setIsDocumentUploading}
								emptyStateText="Click to upload a document (image or PDF)"
								disabled={isSubmitting}
							/>
						</FieldGroup>
					)}

					{mode !== "direct" ? (
						<linkForm.Field name="consent">
							{(field) => (
								<VerificationConsentCheckbox
									id="document-verification-link-consent"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
							)}
						</linkForm.Field>
					) : (
						<directForm.Field name="consent">
							{(field) => (
								<VerificationConsentCheckbox
									id="document-verification-direct-consent"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
							)}
						</directForm.Field>
					)}

					{mode !== "direct" ? (
						<linkForm.Subscribe selector={(state) => state.canSubmit}>
							{(canSubmit) => (
								<Button
									type="submit"
									className="w-full cursor-pointer"
									disabled={!canSubmit || isSubmitting}
								>
									<PaperPlaneTiltIcon className="size-4" />
									{isSubmitting ? "Submitting..." : "Submit Verification"}
								</Button>
							)}
						</linkForm.Subscribe>
					) : (
						<directForm.Subscribe selector={(state) => state.canSubmit}>
							{(canSubmit) => (
								<Button
									type="submit"
									className="w-full cursor-pointer"
									disabled={
										!canSubmit ||
										!documentProofUrl ||
										isDocumentUploading ||
										isSubmitting
									}
								>
									<PaperPlaneTiltIcon className="size-4" />
									{isSubmitting ? "Submitting..." : "Submit Verification"}
								</Button>
							)}
						</directForm.Subscribe>
					)}
				</form>
			</CardContent>

			<VerificationResultDialog
				open={isResultDialogOpen}
				onOpenChange={setIsResultDialogOpen}
				linkResult={linkResult}
				verification={verificationResult}
				onStartNew={handleStartNewVerification}
			/>
		</Card>
	);
}
