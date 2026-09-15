import {
	LinkIcon,
	MagnifyingGlassIcon,
	PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";

import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@verifyafrica/ui/components/ui/accordion";
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
import { ToggleGroup, ToggleGroupItem } from "@verifyafrica/ui/components/ui/toggle-group";
import { cn } from "@verifyafrica/ui/lib/utils";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { VerificationConsentCheckbox } from "../../../-components/VerificationConsentCheckbox";
import { VerificationResultDialog } from "../../-components/verification-result-dialog";
import {
	DEFAULT_VERIFICATION_URL_LIMIT,
	VERIFICATION_MODES,
	VERIFICATION_URL_LIMITS,
	type VerificationMode,
	verificationConsentSchema,
} from "../../../-components/VerificationConsentCheckbox/data";
import { useTenantSupportedCountries } from "../../-countries";
import { useProductVerificationSubmit } from "../../-use-product-verification-submit";
import {
	buildKybVerificationLinkPayload,
	buildKybVerificationPayload,
} from "../-data";

const linkFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	businessJurisdiction: z.string(),
	urlLimit: z.string().min(1, "Select a verification URL limit"),
	consent: verificationConsentSchema,
});

const directFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	businessJurisdiction: z.string().min(1, "Business jurisdiction is required"),
	companyName: z.string().trim().min(1, "Company name is required"),
	companyRegistrationNumber: z
		.string()
		.trim()
		.min(1, "Company registration number is required"),
	consent: verificationConsentSchema,
});

export function KybVerificationForm() {
	const [mode, setMode] = useState<VerificationMode>("link");
	const {
		submitVerification,
		linkResult,
		verificationResult,
		isResultDialogOpen,
		setIsResultDialogOpen,
		isSubmitting,
		handleStartNewVerification,
	} = useProductVerificationSubmit({
		errorMessage: "Failed to submit KYB verification.",
	});
	const { countries, isPending: isCountriesPending } =
		useTenantSupportedCountries({ verificationType: "kyb_screening" });

	const linkForm = useForm({
		defaultValues: {
			email: "",
			businessJurisdiction: "",
			urlLimit: DEFAULT_VERIFICATION_URL_LIMIT,
			consent: false,
		},
		validators: {
			onChange: linkFormSchema,
			onSubmit: linkFormSchema,
		},
		onSubmit: async ({ value }) => {
			const submitted = await submitVerification(
				buildKybVerificationLinkPayload(value),
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
			businessJurisdiction: "",
			companyName: "",
			companyRegistrationNumber: "",
			consent: false,
		},
		validators: {
			onChange: directFormSchema,
			onSubmit: directFormSchema,
		},
		onSubmit: async ({ value }) => {
			const submitted = await submitVerification(
				buildKybVerificationPayload(value),
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
	}

	const activeForm = mode === "direct" ? directForm : linkForm;

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
								if (value) {
									setMode(value as VerificationMode);
								}
							}}
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
										<FieldLabel htmlFor="kyb-link-email">
											Email Address
										</FieldLabel>
										<Input
											id="kyb-link-email"
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
							<Accordion type="single" collapsible>
								<AccordionItem value="optional-kyb-jurisdiction">
									<AccordionTrigger>
										Optional jurisdiction lock
									</AccordionTrigger>
									<AccordionContent className="flex flex-col gap-4">
										<FieldDescription>
											Leave this blank so the customer can pick a jurisdiction
											from the countries you have access to. If you set it, the
											customer cannot change it.
										</FieldDescription>
										<linkForm.Field name="businessJurisdiction">
											{(field) => (
												<Field className="gap-1.5">
													<FieldLabel htmlFor="kyb-link-jurisdiction">
														Business Jurisdiction
													</FieldLabel>
													<Select
														value={field.state.value || undefined}
														onValueChange={field.handleChange}
														disabled={isCountriesPending}
													>
														<SelectTrigger
															id="kyb-link-jurisdiction"
															className="w-full"
														>
															<SelectValue
																placeholder={
																	isCountriesPending
																		? "Loading jurisdictions..."
																		: "Select a jurisdiction"
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
										</linkForm.Field>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
							<linkForm.Field name="urlLimit">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="kyb-url-limit">
											Verification URL Limit
										</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
										>
											<SelectTrigger id="kyb-url-limit" className="w-full">
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
						</FieldGroup>
					) : (
						<FieldGroup className="gap-4">
							<directForm.Field name="email">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="kyb-verification-email">
											Email Address
										</FieldLabel>
										<Input
											id="kyb-verification-email"
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
							<directForm.Field name="businessJurisdiction">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="kyb-verification-jurisdiction">
											Business Jurisdiction{" "}
											<span className="text-destructive">*</span>
										</FieldLabel>
										<Select
											value={field.state.value || undefined}
											onValueChange={field.handleChange}
											disabled={isCountriesPending}
										>
											<SelectTrigger
												id="kyb-verification-jurisdiction"
												className="w-full"
											>
												<SelectValue
													placeholder={
														isCountriesPending
															? "Loading jurisdictions..."
															: "Select a jurisdiction"
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
							<directForm.Field name="companyName">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="kyb-verification-company-name">
											Company Name{" "}
											<span className="text-destructive">*</span>
										</FieldLabel>
										<Input
											id="kyb-verification-company-name"
											placeholder="Company Name"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</Field>
								)}
							</directForm.Field>
							<directForm.Field name="companyRegistrationNumber">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="kyb-verification-registration-number">
											Company Registration Number{" "}
											<span className="text-destructive">*</span>
										</FieldLabel>
										<Input
											id="kyb-verification-registration-number"
											placeholder="Company Registration Number"
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
					)}

					{mode === "link" ? (
						<linkForm.Field name="consent">
							{(field) => (
								<VerificationConsentCheckbox
									id="kyb-link-consent"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
							)}
						</linkForm.Field>
					) : (
						<directForm.Field name="consent">
							{(field) => (
								<VerificationConsentCheckbox
									id="kyb-direct-consent"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
							)}
						</directForm.Field>
					)}

					<activeForm.Subscribe selector={(state) => state.canSubmit}>
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
					</activeForm.Subscribe>
				</form>
			</CardContent>

			<VerificationResultDialog
				open={isResultDialogOpen}
				onOpenChange={setIsResultDialogOpen}
				linkResult={linkResult}
				verification={verificationResult}
				onStartNew={() => handleStartNewVerification(resetForms)}
				description="Your KYB verification request was created successfully."
			/>
		</Card>
	);
}
