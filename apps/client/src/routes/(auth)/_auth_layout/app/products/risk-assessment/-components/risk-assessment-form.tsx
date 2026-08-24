import {
	CaretRightIcon,
	ChartBarIcon,
	PaperPlaneTiltIcon,
	SlidersHorizontalIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@verifyafrica/ui/components/ui/accordion";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@verifyafrica/ui/components/ui/dialog";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { Slider } from "@verifyafrica/ui/components/ui/slider";
import { Switch } from "@verifyafrica/ui/components/ui/switch";
import { PhoneInput } from "@verifyafrica/ui/components/ui-extended/phone-input";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { VerificationConsentCheckbox } from "../../../-components/VerificationConsentCheckbox";
import {
	DEFAULT_VERIFICATION_URL_LIMIT,
	verificationConsentSchema,
} from "../../../-components/VerificationConsentCheckbox/data";
import { VerificationResultDialog } from "../../-components/verification-result-dialog";
import { useProductVerificationSubmit } from "../../-use-product-verification-submit";
import {
	AML_SCREENING_FILTERS,
	DEFAULT_AML_SCREENING_FILTERS,
	type AmlScreeningFilterKey,
} from "../../aml-screening/-data";
import {
	DEFAULT_RISK_RANGES,
	RISK_ASSESSMENT_CHECKS,
	RISK_LEVELS,
	buildRiskAssessmentPayload,
	type RiskLevelKey,
	type RiskRange,
} from "../-data";

const riskAssessmentFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	phone: z.string().trim().min(1, "Phone number is required"),
	selectedCheck: z.string().min(1, "Select a configured check"),
	consent: verificationConsentSchema,
});

function clamp(value: number, min = 0, max = 100) {
	return Math.min(Math.max(value, min), max);
}

export function RiskAssessmentForm() {
	const [filters, setFilters] = useState(DEFAULT_AML_SCREENING_FILTERS);
	const [riskRanges, setRiskRanges] = useState(DEFAULT_RISK_RANGES);
	const [isCheckDialogOpen, setIsCheckDialogOpen] = useState(false);
	const {
		submitVerification,
		linkResult,
		verificationResult,
		isResultDialogOpen,
		setIsResultDialogOpen,
		isSubmitting,
		handleStartNewVerification,
	} = useProductVerificationSubmit({
		errorMessage: "Failed to submit risk assessment verification.",
	});

	const hasSelectedFilters = useMemo(
		() => Object.values(filters).some(Boolean),
		[filters],
	);

	const form = useForm({
		defaultValues: {
			email: "",
			phone: "",
			selectedCheck: "",
			consent: false,
		},
		validators: {
			onChange: riskAssessmentFormSchema,
			onSubmit: riskAssessmentFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (!hasSelectedFilters) {
				toast.error("Select at least one filter");
				return;
			}

			const submitted = await submitVerification(
				buildRiskAssessmentPayload(value),
				{
					mode: "link",
					email: value.email,
					urlLimit: DEFAULT_VERIFICATION_URL_LIMIT,
				},
			);

			if (submitted) {
				resetForms();
			}
		},
	});

	function resetForms() {
		form.reset();
		setFilters(DEFAULT_AML_SCREENING_FILTERS);
		setRiskRanges(DEFAULT_RISK_RANGES);
	}

	const selectedCheckTitle = RISK_ASSESSMENT_CHECKS.find(
		(check) => check.risk_reference === form.state.values.selectedCheck,
	)?.title;

	function toggleFilter(key: AmlScreeningFilterKey, checked: boolean) {
		setFilters((current) => ({ ...current, [key]: checked }));
	}

	function updateRiskRange(key: RiskLevelKey, updates: Partial<RiskRange>) {
		setRiskRanges((current) => ({
			...current,
			[key]: { ...current[key], ...updates },
		}));
	}

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
					<FieldGroup className="gap-4">
						<form.Field name="email">
							{(field) => (
								<Field className="gap-1.5">
									<FieldLabel htmlFor="risk-assessment-email">
										Email Address
									</FieldLabel>
									<Input
										id="risk-assessment-email"
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

						<form.Field name="phone">
							{(field) => (
								<Field className="gap-1.5">
									<FieldLabel htmlFor="risk-assessment-phone">
										Phone Number
									</FieldLabel>
									<PhoneInput
										id="risk-assessment-phone"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={field.handleChange}
									/>
									<FieldDescription>
										Enter the phone number to use for the risk assessment flow
									</FieldDescription>
								</Field>
							)}
						</form.Field>
					</FieldGroup>

					<form.Field name="selectedCheck">
						{(field) => (
							<div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
								<div className="space-y-1">
									<p className="text-sm font-medium">Selected Check</p>
									<p className="text-sm text-muted-foreground">
										Choose one configured check to use for this request.
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									className="w-full shrink-0 sm:w-auto"
									onClick={() => setIsCheckDialogOpen(true)}
								>
									<ChartBarIcon className="size-4" />
									{selectedCheckTitle ?? "Select check"}
									<CaretRightIcon className="size-4" />
								</Button>

								<Dialog
									open={isCheckDialogOpen}
									onOpenChange={setIsCheckDialogOpen}
								>
									<DialogContent className="sm:max-w-md">
										<DialogHeader>
											<DialogTitle className="font-semibold">
												Select check
											</DialogTitle>
										</DialogHeader>
										<div className="flex flex-col gap-2">
											{RISK_ASSESSMENT_CHECKS.map((check) => (
												<Button
													key={check.id}
													type="button"
													variant={
														field.state.value === check.risk_reference
															? "default"
															: "outline"
													}
													className="h-auto justify-start px-4 py-3"
													onClick={() => {
														field.handleChange(check.risk_reference);
													}}
												>
													<ChartBarIcon className="size-4" />
													{check.title}
												</Button>
											))}
										</div>
									</DialogContent>
								</Dialog>
							</div>
						)}
					</form.Field>

					<Accordion
						type="single"
						collapsible
						defaultValue="advanced"
						className="rounded-lg border px-4"
					>
						<AccordionItem
							value="advanced"
							className="border-none"
						>
							<AccordionTrigger className="py-4 hover:no-underline">
								<div className="flex items-center gap-3 text-left">
									<SlidersHorizontalIcon className="size-5 shrink-0 text-secondary" />
									<div>
										<p className="text-sm font-medium">Advanced Settings</p>
										<p className="text-xs font-normal text-muted-foreground">
											Filters and risk ranges
										</p>
									</div>
								</div>
							</AccordionTrigger>
							<AccordionContent className="space-y-6 pb-4">
								<div className="space-y-4">
									<div className="space-y-1">
										<p className="text-sm font-medium">Risk Ranges</p>
										<p className="text-sm text-muted-foreground">
											Set the risk ranges with linear scale adjuster.
										</p>
									</div>

									<div className="space-y-4">
										{RISK_LEVELS.map((level) => (
											<RiskRangeRow
												key={level.key}
												label={level.label}
												badgeClassName={level.badgeClassName}
												range={riskRanges[level.key]}
												onChange={(updates) =>
													updateRiskRange(level.key, updates)
												}
											/>
										))}
									</div>
								</div>

								<Field className="gap-3">
									<FieldLabel>Filters</FieldLabel>
									<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
										{AML_SCREENING_FILTERS.map((filter) => (
											<div
												key={filter.key}
												className="flex items-center gap-2"
											>
												<Checkbox
													id={`risk-assessment-filter-${filter.key}`}
													checked={filters[filter.key]}
													onCheckedChange={(checked) =>
														toggleFilter(filter.key, checked === true)
													}
												/>
												<Label
													htmlFor={`risk-assessment-filter-${filter.key}`}
													className="text-sm font-normal"
												>
													{filter.label}
												</Label>
											</div>
										))}
									</div>
								</Field>
							</AccordionContent>
						</AccordionItem>
					</Accordion>

					<form.Field name="consent">
						{(field) => (
							<VerificationConsentCheckbox
								id="risk-assessment-consent"
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
								disabled={!canSubmit || !hasSelectedFilters || isSubmitting}
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
				onStartNew={() => handleStartNewVerification(resetForms)}
				description="Your risk assessment verification request was created successfully."
			/>
		</Card>
	);
}

function RiskRangeRow({
	label,
	badgeClassName,
	range,
	onChange,
}: {
	label: string;
	badgeClassName: string;
	range: RiskRange;
	onChange: (updates: Partial<RiskRange>) => void;
}) {
	const isFixedRange = range.min === range.max;

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
			<div className="flex items-center gap-3 sm:w-36">
				<Switch
					checked={range.enabled}
					onCheckedChange={(enabled) => onChange({ enabled })}
					aria-label={`Toggle ${label} risk range`}
				/>
				<Badge
					variant="outline"
					className={badgeClassName}
				>
					{label}
				</Badge>
			</div>

			<div className="flex min-w-0 flex-1 items-center gap-3">
				<Slider
					value={[range.min, range.max]}
					onValueChange={([min, max]) =>
						onChange({
							min: clamp(min ?? range.min),
							max: clamp(max ?? range.max),
						})
					}
					min={0}
					max={100}
					step={1}
					disabled={!range.enabled || isFixedRange}
					className="flex-1"
				/>
				<div className="flex items-center gap-2">
					<Input
						type="number"
						min={0}
						max={100}
						value={range.min}
						disabled={!range.enabled || isFixedRange}
						className="w-16 px-2"
						onChange={(event) => {
							const min = clamp(Number(event.target.value));
							onChange({ min: Math.min(min, range.max) });
						}}
					/>
					<Input
						type="number"
						min={0}
						max={100}
						value={range.max}
						disabled={!range.enabled || isFixedRange}
						className="w-16 px-2"
						onChange={(event) => {
							const max = clamp(Number(event.target.value));
							onChange({ max: Math.max(max, range.min) });
						}}
					/>
				</div>
			</div>
		</div>
	);
}
