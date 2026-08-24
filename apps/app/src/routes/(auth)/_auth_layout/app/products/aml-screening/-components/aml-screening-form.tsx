import { LinkIcon, MagnifyingGlassIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { format, isValid, parse } from "date-fns";
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
import { Slider } from "@verifyafrica/ui/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@verifyafrica/ui/components/ui/toggle-group";
import { cn } from "#/lib/utils.ts";
import { KycDatePicker } from "../../../kyc/-components/kyc-form-primitives";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { VerificationConsentCheckbox } from "../../../-components/VerificationConsentCheckbox";
import { VerificationResultDialog } from "../../-components/verification-result-dialog";
import { useTenantSupportedCountries } from "../../-countries";
import { useProductVerificationSubmit } from "../../-use-product-verification-submit";
import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";
import {
	DEFAULT_VERIFICATION_URL_LIMIT,
	VERIFICATION_MODES,
	VERIFICATION_URL_LIMITS,
	type VerificationMode,
	verificationConsentSchema,
} from "../../../-components/VerificationConsentCheckbox/data";
import {
	AML_SCREENING_FILTERS,
	DEFAULT_AML_SCREENING_FILTERS,
	DEFAULT_MATCH_SCORE,
	type AmlScreeningFilterKey,
	buildAmlScreeningDirectPayload,
	buildAmlScreeningLinkPayload,
} from "../-data";

const linkFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	screeningCountry: z.string(),
	urlLimit: z.string().min(1, "Select a verification URL limit"),
	consent: verificationConsentSchema,
});

const directFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	screeningCountry: z.string(),
	fullName: z.string().trim().min(1, "Full name is required"),
	dateOfBirth: z.string(),
	consent: verificationConsentSchema,
});

function parseDateOfBirth(value: string) {
	if (!value) {
		return undefined;
	}

	const parsed = parse(value, "yyyy-MM-dd", new Date());
	return isValid(parsed) ? parsed : undefined;
}

export function AmlScreeningForm() {
	const [mode, setMode] = useState<VerificationMode>("link");
	const [filters, setFilters] = useState(DEFAULT_AML_SCREENING_FILTERS);
	const [matchScore, setMatchScore] = useState(DEFAULT_MATCH_SCORE);
	const {
		submitVerification,
		linkResult,
		verificationResult,
		isResultDialogOpen,
		setIsResultDialogOpen,
		isSubmitting,
		handleStartNewVerification,
	} = useProductVerificationSubmit({
		errorMessage: "Failed to submit AML screening verification.",
	});
	const { countries, isPending: isCountriesPending } =
		useTenantSupportedCountries();

	const hasSelectedFilters = useMemo(
		() => Object.values(filters).some(Boolean),
		[filters],
	);

	const linkForm = useForm({
		defaultValues: {
			email: "",
			screeningCountry: "",
			urlLimit: DEFAULT_VERIFICATION_URL_LIMIT,
			consent: false,
		},
		validators: {
			onChange: linkFormSchema,
			onSubmit: linkFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (!hasSelectedFilters) {
				toast.error("Select at least one filter");
				return;
			}

			const submitted = await submitVerification(
				buildAmlScreeningLinkPayload(value, { filters, matchScore }),
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
			screeningCountry: "",
			fullName: "",
			dateOfBirth: "",
			consent: false,
		},
		validators: {
			onChange: directFormSchema,
			onSubmit: directFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (!hasSelectedFilters) {
				toast.error("Select at least one filter");
				return;
			}

			const submitted = await submitVerification(
				buildAmlScreeningDirectPayload(value, { filters, matchScore }),
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
		setFilters(DEFAULT_AML_SCREENING_FILTERS);
		setMatchScore(DEFAULT_MATCH_SCORE);
	}

	const activeForm = mode === "link" ? linkForm : directForm;

	function toggleFilter(key: AmlScreeningFilterKey, checked: boolean) {
		setFilters((current) => ({ ...current, [key]: checked }));
	}

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
										<FieldLabel htmlFor="aml-screening-link-email">
											Email Address
										</FieldLabel>
										<Input
											id="aml-screening-link-email"
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

							<linkForm.Field name="screeningCountry">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="aml-screening-link-country">
											Screening Countries
										</FieldLabel>
										<Select
											value={field.state.value || undefined}
											onValueChange={field.handleChange}
											disabled={isCountriesPending}
										>
											<SelectTrigger
												id="aml-screening-link-country"
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
										<FieldDescription>
											Choose the country to screen against
										</FieldDescription>
									</Field>
								)}
							</linkForm.Field>

							<linkForm.Field name="urlLimit">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="aml-screening-url-limit">
											Verification URL Limit
										</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
										>
											<SelectTrigger
												id="aml-screening-url-limit"
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
						<FieldGroup className="gap-4">
							<directForm.Field name="email">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="aml-screening-direct-email">
											Email Address
										</FieldLabel>
										<Input
											id="aml-screening-direct-email"
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

							<directForm.Field name="screeningCountry">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="aml-screening-direct-country">
											Screening Countries
										</FieldLabel>
										<Select
											value={field.state.value || undefined}
											onValueChange={field.handleChange}
											disabled={isCountriesPending}
										>
											<SelectTrigger
												id="aml-screening-direct-country"
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
										<FieldDescription>
											Choose the country to screen against
										</FieldDescription>
									</Field>
								)}
							</directForm.Field>

							<directForm.Field name="fullName">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="aml-screening-full-name">
											Full Name
										</FieldLabel>
										<Input
											id="aml-screening-full-name"
											placeholder="Full Name"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</Field>
								)}
							</directForm.Field>

							<directForm.Field name="dateOfBirth">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="aml-screening-date-of-birth">
											Date of Birth (Optional)
										</FieldLabel>
										<KycDatePicker
											id="aml-screening-date-of-birth"
											value={parseDateOfBirth(field.state.value)}
											onChange={(date) =>
												field.handleChange(
													date ? format(date, "yyyy-MM-dd") : "",
												)
											}
										/>
									</Field>
								)}
							</directForm.Field>
						</FieldGroup>
					)}

					<Field className="gap-3">
						<FieldLabel>Filters</FieldLabel>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{AML_SCREENING_FILTERS.map((filter) => (
								<div key={filter.key} className="flex items-center gap-2">
									<Checkbox
										id={`aml-screening-filter-${filter.key}`}
										checked={filters[filter.key]}
										onCheckedChange={(checked) =>
											toggleFilter(filter.key, checked === true)
										}
									/>
									<Label
										htmlFor={`aml-screening-filter-${filter.key}`}
										className="text-sm font-normal"
									>
										{filter.label}
									</Label>
								</div>
							))}
						</div>
					</Field>

					<Field className="gap-3">
						<FieldLabel htmlFor="aml-screening-match-score">
							Match Score
						</FieldLabel>
						<div className="flex items-center gap-3">
							<span className="text-sm text-muted-foreground">0</span>
							<Slider
								id="aml-screening-match-score"
								value={[matchScore]}
								onValueChange={(value) => setMatchScore(value[0] ?? 0)}
								min={0}
								max={100}
								step={1}
								className="flex-1"
							/>
							<span className="min-w-8 text-sm font-medium">{matchScore}</span>
						</div>
						<FieldDescription>
							Set the matching threshold from 0 to 100. A score of 100 applies
							the strictest accuracy.
						</FieldDescription>
					</Field>

					{mode === "link" ? (
						<linkForm.Field name="consent">
							{(field) => (
								<VerificationConsentCheckbox
									id="aml-screening-link-consent"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
							)}
						</linkForm.Field>
					) : (
						<directForm.Field name="consent">
							{(field) => (
								<VerificationConsentCheckbox
									id="aml-screening-direct-consent"
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
									disabled={
										!canSubmit || !hasSelectedFilters || isSubmitting
									}
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
										!canSubmit || !hasSelectedFilters || isSubmitting
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
				description="Your AML screening verification request was created successfully."
			/>
		</Card>
	);
}
