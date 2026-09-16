import {
	LinkIcon,
	MagnifyingGlassIcon,
	PaperPlaneTiltIcon,
	SlidersHorizontalIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { format, isValid, parse } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@verifyafrica/ui/components/ui/accordion";
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
import { Textarea } from "@verifyafrica/ui/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@verifyafrica/ui/components/ui/toggle-group";
import { cn } from "@verifyafrica/ui/lib/utils";
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
import { ProductProofUpload } from "../../-components/product-proof-upload";
import { PRODUCT_UPLOAD_VERIFICATIONS } from "../../-upload-utils";
import { ScreeningCountriesMultiSelect } from "@verifyafrica/ui/components/ui-extended/screening-countries-multi-select";
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
} from "../../aml-screening/-data";
import {
	buildBusinessAmlScreeningDirectPayload,
	buildBusinessAmlScreeningLinkPayload,
} from "../-data";

const businessFieldsSchema = {
	screeningCountries: z.array(z.string()),
	businessName: z.string().trim().min(1, "Business name is required"),
	incorporationDate: z.string(),
};

const linkFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	screeningCountries: z.array(z.string()),
	businessName: z.string(),
	incorporationDate: z.string(),
	urlLimit: z.string().min(1, "Select a verification URL limit"),
	consent: verificationConsentSchema,
});

const directFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	...businessFieldsSchema,
	consent: verificationConsentSchema,
});

function parseIncorporationDate(value: string) {
	if (!value) {
		return undefined;
	}

	const parsed = parse(value, "yyyy-MM-dd", new Date());
	return isValid(parsed) ? parsed : undefined;
}

const AML_BIOMETRIC_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"] as const;
const AML_BIOMETRIC_MAX_BYTES = 5 * 1024 * 1024;
const AML_INDIVIDUAL_FACE_MIME_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"application/pdf",
] as const;
const AML_INDIVIDUAL_FACE_MAX_BYTES = 16 * 1024 * 1024;

export function BusinessAmlScreeningForm() {
	const [mode, setMode] = useState<VerificationMode>("link");
	const [filters, setFilters] = useState(DEFAULT_AML_SCREENING_FILTERS);
	const [matchScore, setMatchScore] = useState(DEFAULT_MATCH_SCORE);
	const [rcaSearch, setRcaSearch] = useState(true);
	const [aliasSearch, setAliasSearch] = useState(true);
	const [context, setContext] = useState("");
	const [biometricUrl, setBiometricUrl] = useState<string | null>(null);
	const [individualFaceUrl, setIndividualFaceUrl] = useState<string | null>(null);
	const [isBiometricUploading, setIsBiometricUploading] = useState(false);
	const [isFaceUploading, setIsFaceUploading] = useState(false);
	const {
		submitVerification,
		linkResult,
		verificationResult,
		isResultDialogOpen,
		setIsResultDialogOpen,
		isSubmitting,
		handleStartNewVerification,
	} = useProductVerificationSubmit({
		errorMessage: "Failed to submit business AML screening verification.",
	});
	const { countries, isPending: isCountriesPending } =
		useTenantSupportedCountries({
			verificationType: "business_aml_screening",
		});

	const hasSelectedFilters = useMemo(
		() => Object.values(filters).some(Boolean),
		[filters],
	);

	const screeningOptions = {
		filters,
		matchScore,
		rcaSearch,
		aliasSearch,
		context,
		biometricSearchImage: biometricUrl,
		individualFace: individualFaceUrl,
	};

	const linkForm = useForm({
		defaultValues: {
			email: "",
			screeningCountries: [] as string[],
			businessName: "",
			incorporationDate: "",
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
				buildBusinessAmlScreeningLinkPayload(value, screeningOptions),
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
			screeningCountries: [] as string[],
			businessName: "",
			incorporationDate: "",
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
				buildBusinessAmlScreeningDirectPayload(value, screeningOptions),
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
		setRcaSearch(true);
		setAliasSearch(true);
		setContext("");
		setBiometricUrl(null);
		setIndividualFaceUrl(null);
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

					<FieldGroup className="gap-4">
						{mode === "link" ? (
							<linkForm.Field name="email">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="business-aml-link-email">
											Email Address
										</FieldLabel>
										<Input
											id="business-aml-link-email"
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
						) : (
							<directForm.Field name="email">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="business-aml-direct-email">
											Email Address
										</FieldLabel>
										<Input
											id="business-aml-direct-email"
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
						)}

						{mode === "link" ? (
							<Accordion
								type="single"
								collapsible
								className="rounded-lg border bg-muted/60 px-4"
							>
								<AccordionItem
									value="optional-business-aml-fields"
									className="border-0"
								>
									<AccordionTrigger className="py-3 hover:no-underline">
										Optional country, business name, and incorporation date
									</AccordionTrigger>
									<AccordionContent className="flex flex-col gap-4">
										<FieldDescription>
											Leave these blank so the customer can enter them. A
											country or incorporation date you set here cannot be
											changed by the customer. A business name is shown to the
											customer and can still be edited.
										</FieldDescription>
										<linkForm.Field name="screeningCountries">
											{(field) => (
												<ScreeningCountriesMultiSelect
													id="business-aml-link-country"
													value={field.state.value}
													onValueChange={field.handleChange}
													countries={countries}
													isLoading={isCountriesPending}
												/>
											)}
										</linkForm.Field>
										<div className="grid gap-4 sm:grid-cols-2">
											<linkForm.Field name="businessName">
												{(field) => (
													<Field className="gap-1.5">
														<FieldLabel htmlFor="business-aml-link-name">
															Business Name
														</FieldLabel>
														<Input
															id="business-aml-link-name"
															placeholder="Business Name"
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(event) =>
																field.handleChange(event.target.value)
															}
														/>
													</Field>
												)}
											</linkForm.Field>
											<linkForm.Field name="incorporationDate">
												{(field) => (
													<Field className="gap-1.5">
														<FieldLabel htmlFor="business-aml-link-incorporation-date">
															Business Incorporation Date
														</FieldLabel>
														<KycDatePicker
															id="business-aml-link-incorporation-date"
															value={parseIncorporationDate(field.state.value)}
															onChange={(date) =>
																field.handleChange(
																	date ? format(date, "yyyy-MM-dd") : "",
																)
															}
														/>
													</Field>
												)}
											</linkForm.Field>
										</div>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						) : (
							<>
								<directForm.Field name="screeningCountries">
									{(field) => (
										<ScreeningCountriesMultiSelect
											id="business-aml-direct-country"
											value={field.state.value}
											onValueChange={field.handleChange}
											countries={countries}
											isLoading={isCountriesPending}
										/>
									)}
								</directForm.Field>
								<div className="grid gap-4 sm:grid-cols-2">
									<directForm.Field name="businessName">
										{(field) => (
											<Field className="gap-1.5">
												<FieldLabel htmlFor="business-aml-direct-name">
													Business Name
												</FieldLabel>
												<Input
													id="business-aml-direct-name"
													placeholder="Business Name"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
												/>
											</Field>
										)}
									</directForm.Field>
									<directForm.Field name="incorporationDate">
										{(field) => (
											<Field className="gap-1.5">
												<FieldLabel htmlFor="business-aml-direct-incorporation-date">
													Business Incorporation Date (Optional)
												</FieldLabel>
												<KycDatePicker
													id="business-aml-direct-incorporation-date"
													value={parseIncorporationDate(field.state.value)}
													onChange={(date) =>
														field.handleChange(
															date ? format(date, "yyyy-MM-dd") : "",
														)
													}
												/>
											</Field>
										)}
									</directForm.Field>
								</div>
							</>
						)}

						{mode === "link" && (
							<linkForm.Field name="urlLimit">
								{(field) => (
									<Field className="gap-1.5">
										<FieldLabel htmlFor="business-aml-url-limit">
											Verification URL Limit
										</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={field.handleChange}
										>
											<SelectTrigger
												id="business-aml-url-limit"
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
						)}
					</FieldGroup>

					<ProductProofUpload
						label="Biometric search image (optional)"
						verificationName={PRODUCT_UPLOAD_VERIFICATIONS.businessAmlScreening}
						proofUrl={biometricUrl}
						onProofUrlChange={setBiometricUrl}
						onUploadingChange={setIsBiometricUploading}
						accept="image/jpeg,image/jpg,image/png"
						allowedMimeTypes={AML_BIOMETRIC_MIME_TYPES}
						maxSize={AML_BIOMETRIC_MAX_BYTES}
						emptyStateText="Upload a JPEG or PNG up to 5MB for biometric matching"
						disabled={isSubmitting}
					/>
					<ProductProofUpload
						label="Individual face (optional)"
						verificationName={PRODUCT_UPLOAD_VERIFICATIONS.businessAmlScreening}
						proofUrl={individualFaceUrl}
						onProofUrlChange={setIndividualFaceUrl}
						onUploadingChange={setIsFaceUploading}
						accept="image/jpeg,image/jpg,image/png,application/pdf"
						allowedMimeTypes={AML_INDIVIDUAL_FACE_MIME_TYPES}
						maxSize={AML_INDIVIDUAL_FACE_MAX_BYTES}
						emptyStateText="Upload a JPEG, PNG, or PDF up to 16MB"
						disabled={isSubmitting}
					/>

					<Accordion type="single" collapsible className="rounded-lg border px-4">
						<AccordionItem value="advanced" className="border-none">
							<AccordionTrigger className="py-4 hover:no-underline">
								<div className="flex items-center gap-3 text-left">
									<SlidersHorizontalIcon className="size-5 shrink-0 text-secondary" />
									<div>
										<p className="text-sm font-medium">Advanced Settings</p>
										<p className="text-xs font-normal text-muted-foreground">
											Filters, match score, RCA, aliases, and context
										</p>
									</div>
								</div>
							</AccordionTrigger>
							<AccordionContent className="space-y-6 pb-4">
								<Field className="gap-3">
									<FieldLabel>Filters</FieldLabel>
									<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
										{AML_SCREENING_FILTERS.map((filter) => (
											<div key={filter.key} className="flex items-center gap-2">
												<Checkbox
													id={`business-aml-filter-${filter.key}`}
													checked={filters[filter.key]}
													onCheckedChange={(checked) =>
														toggleFilter(filter.key, checked === true)
													}
												/>
												<Label
													htmlFor={`business-aml-filter-${filter.key}`}
													className="text-sm font-normal"
												>
													{filter.label}
												</Label>
											</div>
										))}
									</div>
								</Field>

								<Field className="gap-3">
									<FieldLabel htmlFor="business-aml-match-score">
										Match Score
									</FieldLabel>
									<div className="flex items-center gap-3">
										<span className="text-sm text-muted-foreground">0</span>
										<Slider
											id="business-aml-match-score"
											value={[matchScore]}
											onValueChange={(value) => setMatchScore(value[0] ?? 0)}
											min={0}
											max={100}
											step={1}
											className="flex-1"
										/>
										<span className="min-w-8 text-sm font-medium">
											{matchScore}
										</span>
									</div>
									<FieldDescription>
										Set the matching threshold from 0 to 100. A score of 100
										applies the strictest accuracy.
									</FieldDescription>
								</Field>
								<div className="flex items-center gap-2">
									<Checkbox
										id="business-aml-rca-search"
										checked={rcaSearch}
										onCheckedChange={(checked) =>
											setRcaSearch(checked === true)
										}
									/>
									<Label
										htmlFor="business-aml-rca-search"
										className="text-sm font-normal"
									>
										RCA search
									</Label>
								</div>
								<div className="flex items-center gap-2">
									<Checkbox
										id="business-aml-alias-search"
										checked={aliasSearch}
										onCheckedChange={(checked) =>
											setAliasSearch(checked === true)
										}
									/>
									<Label
										htmlFor="business-aml-alias-search"
										className="text-sm font-normal"
									>
										Alias search
									</Label>
								</div>
								<Field className="gap-1.5">
									<FieldLabel htmlFor="business-aml-context">
										Context (optional)
									</FieldLabel>
									<Textarea
										id="business-aml-context"
										placeholder="Extra context for match assessment"
										value={context}
										onChange={(event) => setContext(event.target.value)}
									/>
								</Field>
							</AccordionContent>
						</AccordionItem>
					</Accordion>

					{mode === "link" ? (
						<linkForm.Field name="consent">
							{(field) => (
								<VerificationConsentCheckbox
									id="business-aml-link-consent"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
							)}
						</linkForm.Field>
					) : (
						<directForm.Field name="consent">
							{(field) => (
								<VerificationConsentCheckbox
									id="business-aml-direct-consent"
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
										!canSubmit ||
										!hasSelectedFilters ||
										isSubmitting ||
										isBiometricUploading ||
										isFaceUploading
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
										!canSubmit ||
										!hasSelectedFilters ||
										isSubmitting ||
										isBiometricUploading ||
										isFaceUploading
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
				description="Your business AML screening verification request was created successfully."
			/>
		</Card>
	);
}
