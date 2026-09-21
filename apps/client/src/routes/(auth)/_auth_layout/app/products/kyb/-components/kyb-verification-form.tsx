import {
	FileTextIcon,
	LinkIcon,
	MagnifyingGlassIcon,
	PaperPlaneTiltIcon,
	SlidersHorizontalIcon,
	StorefrontIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
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
	documentLabelOptions,
	KYB_BASES,
	KYB_IDENTIFIER_LABELS,
	KYB_SEARCH_TYPES,
	purchaseDocumentOptions,
	type KybCoverageCountry,
	type KybFormValues,
} from "../-data";
import type { KybBase } from "@verifyafrica/api-client/http/v2/verifications/verifications.types";

const defaultValues: KybFormValues = {
	email: "",
	base: "search",
	businessJurisdiction: "",
	companyName: "",
	companyRegistrationNumber: "",
	searchType: "fuzzy",
	searchBy: "",
	searchWord: "",
	advancedSearch: true,
	aiBusinessInsights: false,
	documentProof: "",
	additionalProofLabels: [],
	validateDocument: false,
	requiredDocuments: [],
	urlLimit: DEFAULT_VERIFICATION_URL_LIMIT,
};

function kybFormSchema(mode: VerificationMode, base: KybBase) {
	return z
		.object({
			email: z.email("Enter a valid email address"),
			base: z.enum(["search", "document", "document_purchase"]),
			businessJurisdiction: z.string(),
			companyName: z.string(),
			companyRegistrationNumber: z.string(),
			searchType: z.string(),
			searchBy: z.string(),
			searchWord: z.string(),
			advancedSearch: z.boolean(),
			aiBusinessInsights: z.boolean(),
			documentProof: z.string(),
			additionalProofLabels: z.array(z.string()),
			validateDocument: z.boolean(),
			requiredDocuments: z.array(z.string()),
			urlLimit: z.string().min(1, "Select a verification URL limit"),
			consent: verificationConsentSchema,
		})
		.superRefine((value, ctx) => {
			if (mode === "link") {
				return;
			}
			if (!value.businessJurisdiction) {
				ctx.addIssue({
					code: "custom",
					path: ["businessJurisdiction"],
					message: "Business jurisdiction is required",
				});
			}
			if (base === "search") {
				const usesOtherIdentifier =
					value.searchBy &&
					value.searchBy !== "company_name" &&
					value.searchBy !== "registration_number";
				if (usesOtherIdentifier && !value.searchWord.trim()) {
					ctx.addIssue({
						code: "custom",
						path: ["searchWord"],
						message: "Enter the search value for this identifier",
					});
				}
				if (
					!usesOtherIdentifier &&
					!value.companyName.trim() &&
					!value.companyRegistrationNumber.trim()
				) {
					ctx.addIssue({
						code: "custom",
						path: ["companyName"],
						message: "Enter a company name or registration number",
					});
				}
			}
			if (base === "document" && !value.documentProof.trim()) {
				ctx.addIssue({
					code: "custom",
					path: ["documentProof"],
					message: "Document proof URL is required",
				});
			}
			if (base === "document_purchase" && !value.companyRegistrationNumber.trim()) {
				ctx.addIssue({
					code: "custom",
					path: ["companyRegistrationNumber"],
					message: "Company registration number is required",
				});
			}
		});
}

export function KybVerificationForm() {
	const [mode, setMode] = useState<VerificationMode>("link");
	const [base, setBase] = useState<KybBase>("search");
	const modeRef = useRef(mode);
	const baseRef = useRef(base);
	modeRef.current = mode;
	baseRef.current = base;
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
		useTenantSupportedCountries({
			verificationType: "kyb_screening",
			kybBase: base,
		});
	const coverageCountries = countries as KybCoverageCountry[];

	const form = useForm({
		defaultValues: {
			...defaultValues,
			consent: false,
		},
		validators: {
			onChange: z
				.object({
					email: z.email("Enter a valid email address"),
					consent: verificationConsentSchema,
				})
				.passthrough(),
		},
		onSubmit: async ({ value }) => {
			const parsed = kybFormSchema(modeRef.current, baseRef.current).safeParse(
				value,
			);
			if (!parsed.success) {
				toast.error(parsed.error.issues[0]?.message ?? "Check the required KYB fields.");
				return;
			}
			const payload =
				mode === "link"
					? buildKybVerificationLinkPayload(parsed.data)
					: buildKybVerificationPayload(parsed.data);
			const submitted = await submitVerification(payload, {
				mode,
				email: value.email,
				urlLimit: value.urlLimit,
			});
			if (submitted) {
				form.reset();
			}
		},
	});

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

					<div className="flex flex-col gap-3">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-sm font-medium text-muted-foreground">
								KYB base
							</p>
							<ToggleGroup
								type="single"
								value={base}
								onValueChange={(value) => {
									if (!value) {
										return;
									}
									const next = value as KybBase;
									setBase(next);
									form.setFieldValue("base", next);
									form.setFieldValue("businessJurisdiction", "");
									form.setFieldValue("searchBy", "");
									form.setFieldValue("additionalProofLabels", []);
									form.setFieldValue("requiredDocuments", []);
								}}
								variant="outline"
								spacing={0}
								className="w-full sm:w-auto"
							>
								{KYB_BASES.map((option) => {
									const Icon =
										option.value === "search"
											? MagnifyingGlassIcon
											: option.value === "document"
												? FileTextIcon
												: StorefrontIcon;
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
						<FieldDescription>
							{base === "search"
								? "Registry lookup using a country-supported search identifier."
								: base === "document"
									? "Upload or submit a supported business document for the selected country."
									: "Purchase official registry documents. Completion is delivered to your webhook."}
						</FieldDescription>
					</div>

					<FieldGroup className="gap-4">
						<form.Field name="email">
							{(field) => (
								<Field className="gap-1.5">
									<FieldLabel htmlFor="kyb-email">Email Address</FieldLabel>
									<Input
										id="kyb-email"
										type="email"
										autoComplete="email"
										placeholder="Email Address"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								</Field>
							)}
						</form.Field>

						{mode === "link" ? (
							<Accordion
								type="single"
								collapsible
								className="rounded-lg border bg-muted/60 px-4"
							>
								<AccordionItem
									value="optional-kyb-jurisdiction"
									className="border-0"
								>
									<AccordionTrigger className="py-3 hover:no-underline">
										Optional jurisdiction lock
									</AccordionTrigger>
									<AccordionContent className="flex flex-col gap-4">
										<FieldDescription>
											Leave this blank so the customer can pick a jurisdiction
											supported for this KYB base. If you set it, they cannot
											change it.
										</FieldDescription>
										<JurisdictionField
											form={form}
											countries={coverageCountries}
											isCountriesPending={isCountriesPending}
										/>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						) : (
							<JurisdictionField
								form={form}
								countries={coverageCountries}
								isCountriesPending={isCountriesPending}
								required
							/>
						)}

					<form.Subscribe
						selector={(state) =>
							[
								state.values.businessJurisdiction,
								state.values.searchBy,
							] as const
						}
					>
						{([jurisdiction, searchBy]) => {
							const selected = coverageCountries.find(
								(country) => country.code === jurisdiction,
							);
							const selectedIdentifiers = selected?.identifiers ?? [];
							const selectedDocumentOptions = documentLabelOptions(selected);
							const selectedPurchaseOptions = purchaseDocumentOptions(selected);
							const usesOtherIdentifier =
								Boolean(searchBy) &&
								searchBy !== "company_name" &&
								searchBy !== "registration_number";
							return (
								<>
									{base === "search" ? (
										<>
											{mode === "direct" && usesOtherIdentifier ? (
												<form.Field name="searchWord">
													{(field) => (
														<Field className="gap-1.5">
															<FieldLabel htmlFor="kyb-search-word">
																Search value
															</FieldLabel>
															<Input
																id="kyb-search-word"
																value={field.state.value}
																onBlur={field.handleBlur}
																onChange={(event) =>
																	field.handleChange(event.target.value)
																}
															/>
														</Field>
													)}
												</form.Field>
											) : null}
											{mode === "direct" && !usesOtherIdentifier ? (
												<>
													{!searchBy ||
													searchBy === "company_name" ||
													selectedIdentifiers.includes("company_name") ? (
														<form.Field name="companyName">
															{(field) => (
																<Field className="gap-1.5">
																	<FieldLabel htmlFor="kyb-company-name">
																		Company Name
																	</FieldLabel>
																	<Input
																		id="kyb-company-name"
																		value={field.state.value}
																		onBlur={field.handleBlur}
																		onChange={(event) =>
																			field.handleChange(event.target.value)
																		}
																	/>
																</Field>
															)}
														</form.Field>
													) : null}
													{!searchBy ||
													searchBy === "registration_number" ||
													selectedIdentifiers.includes("registration_number") ? (
														<form.Field name="companyRegistrationNumber">
															{(field) => (
																<Field className="gap-1.5">
																	<FieldLabel htmlFor="kyb-registration">
																		Company Registration Number
																	</FieldLabel>
																	<Input
																		id="kyb-registration"
																		value={field.state.value}
																		onBlur={field.handleBlur}
																		onChange={(event) =>
																			field.handleChange(event.target.value)
																		}
																	/>
																</Field>
															)}
														</form.Field>
													) : null}
												</>
											) : null}
											<KybOptionsAccordion
												title="Search options"
												description="Search type, identifier, and insights"
											>
												<form.Field name="searchType">
													{(field) => (
														<Field className="gap-1.5">
															<FieldLabel htmlFor="kyb-search-type">
																Search type
															</FieldLabel>
															<Select
																value={field.state.value}
																onValueChange={field.handleChange}
															>
																<SelectTrigger id="kyb-search-type" className="w-full">
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	{KYB_SEARCH_TYPES.map((option) => (
																		<SelectItem key={option.value} value={option.value}>
																			{option.label}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														</Field>
													)}
												</form.Field>
												{selectedIdentifiers.length > 0 ? (
													<form.Field name="searchBy">
														{(field) => (
															<Field className="gap-1.5">
																<FieldLabel htmlFor="kyb-search-by">
																	Search identifier
																</FieldLabel>
																<Select
																	value={field.state.value || undefined}
																	onValueChange={field.handleChange}
																>
																	<SelectTrigger id="kyb-search-by" className="w-full">
																		<SelectValue placeholder="Select an identifier" />
																	</SelectTrigger>
																	<SelectContent>
																		{selectedIdentifiers.map((identifier) => (
																			<SelectItem key={identifier} value={identifier}>
																				{KYB_IDENTIFIER_LABELS[identifier] ??
																					identifier.replaceAll("_", " ")}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
																<FieldDescription>
																	Only identifiers supported in the selected
																	jurisdiction are shown.
																</FieldDescription>
															</Field>
														)}
													</form.Field>
												) : null}
												<form.Field name="advancedSearch">
													{(field) => (
														<div className="flex items-center gap-2">
															<Checkbox
																id="kyb-advanced-search"
																checked={field.state.value}
																onCheckedChange={(checked) =>
																	field.handleChange(checked === true)
																}
															/>
															<Label htmlFor="kyb-advanced-search" className="font-normal">
																Enhanced registry search
															</Label>
														</div>
													)}
												</form.Field>
												<form.Field name="aiBusinessInsights">
													{(field) => (
														<div className="flex items-center gap-2">
															<Checkbox
																id="kyb-ai-insights"
																checked={field.state.value}
																onCheckedChange={(checked) =>
																	field.handleChange(checked === true)
																}
															/>
															<Label htmlFor="kyb-ai-insights" className="font-normal">
																AI business insights
															</Label>
														</div>
													)}
												</form.Field>
											</KybOptionsAccordion>
										</>
									) : null}

									{base === "document" ? (
										<>
											{mode === "direct" ? (
												<form.Field name="documentProof">
													{(field) => (
														<Field className="gap-1.5">
															<FieldLabel htmlFor="kyb-document-proof">
																Document proof URL
															</FieldLabel>
															<Input
																id="kyb-document-proof"
																placeholder="https://"
																value={field.state.value}
																onBlur={field.handleBlur}
																onChange={(event) =>
																	field.handleChange(event.target.value)
																}
															/>
														</Field>
													)}
												</form.Field>
											) : (
												<FieldDescription>
													The customer uploads the business document on the hosted
													link.
												</FieldDescription>
											)}
											<KybOptionsAccordion
												title="Document options"
												description="Proof labels and registry validation"
											>
												{selectedDocumentOptions.length > 0 ? (
													<form.Field name="additionalProofLabels">
														{(field) => (
															<Field className="gap-2">
																<FieldLabel>Supported documents</FieldLabel>
																<div className="grid gap-2">
																	{selectedDocumentOptions.map((option) => (
																		<div key={option.value} className="flex items-center gap-2">
																			<Checkbox
																				id={`kyb-doc-${option.value}`}
																				checked={field.state.value.includes(option.value)}
																				onCheckedChange={(checked) => {
																					const next = new Set(field.state.value);
																					if (checked === true) {
																						next.add(option.value);
																					} else {
																						next.delete(option.value);
																					}
																					field.handleChange([...next]);
																				}}
																			/>
																			<Label
																				htmlFor={`kyb-doc-${option.value}`}
																				className="font-normal capitalize"
																			>
																				{option.label}
																			</Label>
																		</div>
																	))}
																</div>
															</Field>
														)}
													</form.Field>
												) : (
													<FieldDescription>
														Select a jurisdiction to see the documents it
														supports.
													</FieldDescription>
												)}
												<form.Field name="validateDocument">
													{(field) => (
														<div className="flex items-center gap-2">
															<Checkbox
																id="kyb-validate-document"
																checked={field.state.value}
																onCheckedChange={(checked) =>
																	field.handleChange(checked === true)
																}
															/>
															<Label htmlFor="kyb-validate-document" className="font-normal">
																Validate extracted data against the registry
															</Label>
														</div>
													)}
												</form.Field>
											</KybOptionsAccordion>
										</>
									) : null}

									{base === "document_purchase" ? (
										<>
											{(mode === "direct" || jurisdiction) && (
												<form.Field name="companyRegistrationNumber">
													{(field) => (
														<Field className="gap-1.5">
															<FieldLabel htmlFor="kyb-purchase-registration">
																Company Registration Number
															</FieldLabel>
															<Input
																id="kyb-purchase-registration"
																value={field.state.value}
																onBlur={field.handleBlur}
																onChange={(event) =>
																	field.handleChange(event.target.value)
																}
															/>
														</Field>
													)}
												</form.Field>
											)}
											<KybOptionsAccordion
												title="Purchase options"
												description="Choose which registry documents to retrieve"
											>
												{selectedPurchaseOptions.length > 0 ? (
													<form.Field name="requiredDocuments">
														{(field) => (
															<Field className="gap-2">
																<FieldLabel>Documents to purchase</FieldLabel>
																<FieldDescription>
																	Leave empty to request every supported document for
																	this jurisdiction.
																</FieldDescription>
																<div className="grid gap-2">
																	{selectedPurchaseOptions.map((option) => (
																		<div key={option.value} className="flex items-center gap-2">
																			<Checkbox
																				id={`kyb-purchase-${option.value}`}
																				checked={field.state.value.includes(option.value)}
																				onCheckedChange={(checked) => {
																					const next = new Set(field.state.value);
																					if (checked === true) {
																						next.add(option.value);
																					} else {
																						next.delete(option.value);
																					}
																					field.handleChange([...next]);
																				}}
																			/>
																			<Label
																				htmlFor={`kyb-purchase-${option.value}`}
																				className="font-normal"
																			>
																				{option.label}
																			</Label>
																		</div>
																	))}
																</div>
															</Field>
														)}
													</form.Field>
												) : (
													<FieldDescription>
														Select a jurisdiction to see the documents available
														for purchase.
													</FieldDescription>
												)}
											</KybOptionsAccordion>
										</>
									) : null}
								</>
							);
						}}
					</form.Subscribe>
						{mode === "link" ? (
							<form.Field name="urlLimit">
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
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								)}
							</form.Field>
						) : null}
					</FieldGroup>

					<form.Field name="consent">
						{(field) => (
							<VerificationConsentCheckbox
								id="kyb-consent"
								checked={field.state.value}
								onCheckedChange={field.handleChange}
							/>
						)}
					</form.Field>

					<form.Subscribe selector={(state) => state.canSubmit}>
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
					</form.Subscribe>
				</form>
			</CardContent>

			<VerificationResultDialog
				open={isResultDialogOpen}
				onOpenChange={setIsResultDialogOpen}
				linkResult={linkResult}
				verification={verificationResult}
				onStartNew={() => handleStartNewVerification(() => form.reset())}
				description="Your KYB verification request was created successfully."
			/>
		</Card>
	);
}

function KybOptionsAccordion({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<Accordion type="single" collapsible className="rounded-lg border px-4">
			<AccordionItem value="kyb-options" className="border-none">
				<AccordionTrigger className="py-4 hover:no-underline">
					<div className="flex items-center gap-3 text-left">
						<SlidersHorizontalIcon className="size-5 shrink-0 text-secondary" />
						<div>
							<p className="text-sm font-medium">{title}</p>
							<p className="text-xs font-normal text-muted-foreground">
								{description}
							</p>
						</div>
					</div>
				</AccordionTrigger>
				<AccordionContent className="flex flex-col gap-4 pb-4">
					{children}
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}

function JurisdictionField({
	form,
	countries,
	isCountriesPending,
	required = false,
}: {
	form: ReturnType<typeof useForm>;
	countries: KybCoverageCountry[];
	isCountriesPending: boolean;
	required?: boolean;
}) {
	return (
		<form.Field name="businessJurisdiction">
			{(field) => (
				<Field className="gap-1.5">
					<FieldLabel htmlFor="kyb-jurisdiction">
						Business Jurisdiction{" "}
						{required ? <span className="text-destructive">*</span> : null}
					</FieldLabel>
					<Select
						value={field.state.value || undefined}
						onValueChange={(value) => {
							field.handleChange(value);
							form.setFieldValue("searchBy", "");
							form.setFieldValue("additionalProofLabels", []);
							form.setFieldValue("requiredDocuments", []);
						}}
						disabled={isCountriesPending}
					>
						<SelectTrigger id="kyb-jurisdiction" className="w-full">
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
								<SelectItem key={country.code} value={country.code}>
									<CountryOptionLabel
										name={country.name}
										countryCode={country.iso ?? country.code}
									/>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
			)}
		</form.Field>
	);
}
