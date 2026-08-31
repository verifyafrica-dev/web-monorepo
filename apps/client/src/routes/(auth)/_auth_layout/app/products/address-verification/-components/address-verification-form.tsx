import {
	LinkIcon,
	MagnifyingGlassIcon,
	PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { Textarea } from "@verifyafrica/ui/components/ui/textarea";
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
import { useProductVerificationSubmit } from "../../-use-product-verification-submit";
import { PRODUCT_UPLOAD_VERIFICATIONS } from "../../-upload-utils";
import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";
import {
	buildAddressVerificationDirectPayload,
	buildAddressVerificationLinkPayload,
	DEFAULT_ADDRESS_DOCUMENT_TYPES,
} from "../-data";
import { AddressDocumentTypesMultiCombobox } from "@verifyafrica/ui/components/ui-extended/address-document-types-combobox";
import {
	SHUFTI_ADDRESS_SUPPORTED_TYPES,
	type ShuftiAddressSupportedType,
} from "@verifyafrica/ui/lib/constants";
import {
	DEFAULT_VERIFICATION_URL_LIMIT,
	VERIFICATION_MODES,
	VERIFICATION_URL_LIMITS,
	type VerificationMode,
	verificationConsentSchema,
} from "../../../-components/VerificationConsentCheckbox/data";

const addressDocumentTypesSchema = z
	.array(z.enum(SHUFTI_ADDRESS_SUPPORTED_TYPES))
	.min(1, "Select at least one document type");

const linkFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	country: z.string().min(1, "Select a country"),
	address: z.string().trim().min(1, "Address is required"),
	urlLimit: z.string().min(1, "Select a verification URL limit"),
	documentTypes: addressDocumentTypesSchema,
	consent: verificationConsentSchema,
});

const directFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	country: z.string().min(1, "Select a country"),
	address: z.string().trim().min(1, "Address is required"),
	documentTypes: addressDocumentTypesSchema,
	consent: verificationConsentSchema,
});

export function AddressVerificationForm() {
	const [mode, setMode] = useState<VerificationMode>("link");
	const [proofOfAddressUrl, setProofOfAddressUrl] = useState<string | null>(
		null,
	);
	const [isProofUploading, setIsProofUploading] = useState(false);
	const {
		submitVerification,
		linkResult,
		verificationResult,
		isResultDialogOpen,
		setIsResultDialogOpen,
		isSubmitting,
		handleStartNewVerification,
	} = useProductVerificationSubmit({
		errorMessage: "Failed to submit address verification.",
	});
	const { countries, isPending: isCountriesPending } =
		useTenantSupportedCountries();

	const linkForm = useForm({
		defaultValues: {
			email: "",
			country: "",
			address: "",
			urlLimit: DEFAULT_VERIFICATION_URL_LIMIT,
			documentTypes: DEFAULT_ADDRESS_DOCUMENT_TYPES,
			consent: false,
		},
		validators: {
			onChange: linkFormSchema,
			onSubmit: linkFormSchema,
		},
		onSubmit: async ({ value }) => {
			const submitted = await submitVerification(
				buildAddressVerificationLinkPayload(value),
				{
					mode: "link",
					email: value.email,
					urlLimit: value.urlLimit,
				},
			);

			if (submitted) {
				resetForms();
			}
		},
	});

	const directForm = useForm({
		defaultValues: {
			email: "",
			country: "",
			address: "",
			documentTypes: DEFAULT_ADDRESS_DOCUMENT_TYPES,
			consent: false,
		},
		validators: {
			onChange: directFormSchema,
			onSubmit: directFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (!proofOfAddressUrl) {
				toast.error("Please upload a proof-of-address document");
				return;
			}

			const submitted = await submitVerification(
				buildAddressVerificationDirectPayload(value, proofOfAddressUrl),
				{ mode: "direct" },
			);

			if (submitted) {
				resetForms();
			}
		},
	});

	function resetForms() {
		linkForm.reset();
		directForm.reset();
		setProofOfAddressUrl(null);
		setIsProofUploading(false);
	}

	const activeForm = mode === "link" ? linkForm : directForm;

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
						<p className="text-sm font-medium text-muted-foreground">Mode</p>
						<ToggleGroup
							type="single"
							value={mode}
							onValueChange={(value) => {
								if (value) {
									setMode(value as VerificationMode);
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

					{mode === "link" ? (
						<FieldGroup className="gap-4">
							<linkForm.Field name="email">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="address-verification-link-email">
											Email Address
										</FieldLabel>
										<Input
											id="address-verification-link-email"
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

							<linkForm.Field name="country">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="address-verification-link-country">
											Country
										</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
											disabled={isCountriesPending}
										>
											<SelectTrigger
												id="address-verification-link-country"
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
													<SelectItem key={country.code} value={country.code}>
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
							</linkForm.Field>

							<linkForm.Field name="address">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="address-verification-link-address">
											Address
										</FieldLabel>
										<Textarea
											id="address-verification-link-address"
											placeholder="Address"
											rows={3}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</Field>
								)}
							</linkForm.Field>

							<linkForm.Field name="documentTypes">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="address-verification-link-document-types">
											Allowed document types
										</FieldLabel>
										<AddressDocumentTypesMultiCombobox
											id="address-verification-link-document-types"
											value={field.state.value}
											onValueChange={(next) =>
												field.handleChange(
													next as ShuftiAddressSupportedType[],
												)
											}
										/>
										<FieldDescription>
											Customers can only submit proofs from this list.
											Recommended types are shown first.
										</FieldDescription>
									</Field>
								)}
							</linkForm.Field>

							<linkForm.Field name="urlLimit">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="address-verification-url-limit">
											Verification URL Limit
										</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
										>
											<SelectTrigger
												id="address-verification-url-limit"
												className="w-full"
											>
												<SelectValue placeholder="Select duration" />
											</SelectTrigger>
											<SelectContent>
												{VERIFICATION_URL_LIMITS.map((option) => (
													<SelectItem key={option.value} value={option.value}>
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
						</FieldGroup>
					) : (
						<>
							<FieldGroup className="gap-4">
								<directForm.Field name="email">
									{(field) => (
										<Field className="gap-1.5">
											<FieldLabel htmlFor="address-verification-direct-email">
												Email Address
											</FieldLabel>
											<Input
												id="address-verification-direct-email"
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
											<FieldLabel htmlFor="address-verification-direct-country">
												Country
											</FieldLabel>
											<Select
												value={field.state.value}
												onValueChange={field.handleChange}
												disabled={isCountriesPending}
											>
												<SelectTrigger
													id="address-verification-direct-country"
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
														<SelectItem key={country.code} value={country.code}>
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

								<directForm.Field name="address">
									{(field) => (
										<Field className="gap-1.5">
											<FieldLabel htmlFor="address-verification-direct-address">
												Address
											</FieldLabel>
											<Textarea
												id="address-verification-direct-address"
												placeholder="Address"
												rows={3}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
											/>
										</Field>
									)}
								</directForm.Field>
							</FieldGroup>

							<directForm.Field name="documentTypes">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="address-verification-direct-document-types">
											Allowed document types
										</FieldLabel>
										<AddressDocumentTypesMultiCombobox
											id="address-verification-direct-document-types"
											value={field.state.value}
											onValueChange={(next) =>
												field.handleChange(
													next as ShuftiAddressSupportedType[],
												)
											}
										/>
										<FieldDescription>
											Tell the provider which proof types this document may
											match. Recommended types are shown first.
										</FieldDescription>
									</Field>
								)}
							</directForm.Field>

							<ProductProofUpload
								label="Proof of Address"
								verificationName={
									PRODUCT_UPLOAD_VERIFICATIONS.addressVerification
								}
								proofUrl={proofOfAddressUrl}
								onProofUrlChange={setProofOfAddressUrl}
								onUploadingChange={setIsProofUploading}
								emptyStateText="Click to upload proof-of-address document (image or PDF)"
								disabled={isSubmitting}
							/>
						</>
					)}

					{mode === "link" ? (
						<linkForm.Field name="consent">
							{(field) => (
								<VerificationConsentCheckbox
									id="address-verification-link-consent"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
							)}
						</linkForm.Field>
					) : (
						<directForm.Field name="consent">
							{(field) => (
								<VerificationConsentCheckbox
									id="address-verification-direct-consent"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
							)}
						</directForm.Field>
					)}

					{mode === "link" ? (
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
										!proofOfAddressUrl ||
										isProofUploading ||
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
				onStartNew={() => handleStartNewVerification(resetForms)}
				description="Your address verification request was created successfully."
			/>
		</Card>
	);
}
