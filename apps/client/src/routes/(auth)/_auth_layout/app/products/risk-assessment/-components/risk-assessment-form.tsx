import {
	ChartBarIcon,
	InfoIcon,
	PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { Input } from "@verifyafrica/ui/components/ui/input";
import {
	RadioGroup,
	RadioGroupItem,
} from "@verifyafrica/ui/components/ui/radio-group";
import { PhoneInput } from "@verifyafrica/ui/components/ui-extended/phone-input";
import { cn } from "@verifyafrica/ui/lib/utils";
import { z } from "zod";
import { VerificationConsentCheckbox } from "../../../-components/VerificationConsentCheckbox";
import { verificationConsentSchema } from "../../../-components/VerificationConsentCheckbox/data";
import { isTestWalletEnvironment } from "../../../billing/-data";
import { VerificationResultDialog } from "../../-components/verification-result-dialog";
import { useProductVerificationSubmit } from "../../-use-product-verification-submit";
import { buildRiskAssessmentPayload, RISK_ASSESSMENT_CHECKS } from "../-data";

const riskAssessmentFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	phone: z.string().trim().min(1, "Phone number is required"),
	selectedCheck: z.string().min(1, "Select a risk profile"),
	consent: verificationConsentSchema,
});

const HOW_IT_WORKS = [
	"We create a Shufti-hosted questionnaire link for your customer.",
	"The customer answers the questions for the selected profile. Shufti may also ask for a quick face check.",
	"Shufti scores the answers, and the report shows the risk range, score breakdown and every answer.",
];

export function RiskAssessmentForm() {
	const isTestEnvironment = isTestWalletEnvironment();
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
			const submitted = await submitVerification(
				buildRiskAssessmentPayload(value),
				{ mode: "provider_link", email: value.email },
			);

			if (submitted) {
				resetForms();
			}
		},
	});

	function resetForms() {
		form.reset();
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
					<div className="flex gap-3 rounded-lg border bg-muted/60 p-4">
						<InfoIcon className="mt-0.5 size-5 shrink-0 text-secondary" />
						<div className="flex flex-col gap-2">
							<p className="text-sm font-medium">
								Risk assessment is link-only
							</p>
							<p className="text-sm text-pretty text-muted-foreground">
								The risk score is built from the customer's own answers, so
								there is no direct mode. Shufti hosts the questionnaire.
							</p>
							<ol className="flex list-decimal flex-col gap-1 pl-4 text-sm text-pretty text-muted-foreground">
								{HOW_IT_WORKS.map((step) => (
									<li key={step}>{step}</li>
								))}
							</ol>
						</div>
					</div>

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
										The customer's phone number, including the country code.
									</FieldDescription>
								</Field>
							)}
						</form.Field>
					</FieldGroup>

					<form.Field name="selectedCheck">
						{(field) => (
							<Field className="gap-3">
								<div className="flex flex-wrap items-center gap-2">
									<FieldLabel>Risk Profile</FieldLabel>
									{isTestEnvironment ? (
										<Badge variant="outline">Test profiles</Badge>
									) : null}
								</div>
								<FieldDescription>
									{isTestEnvironment
										? "This environment uses Shufti test credentials, so only test profiles are available."
										: "Each profile asks industry-specific questions and has its own scoring thresholds."}
								</FieldDescription>
								<RadioGroup
									aria-label="Risk profile"
									value={field.state.value}
									onValueChange={field.handleChange}
									className="sm:grid-cols-2"
								>
									{RISK_ASSESSMENT_CHECKS.map((check) => {
										const id = `risk-assessment-profile-${check.risk_reference}`;
										return (
											<label
												key={check.id}
												htmlFor={id}
												className={cn(
													"flex h-full cursor-pointer flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/60",
													"has-data-[state=checked]:border-primary has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-primary",
												)}
											>
												<span className="flex items-center justify-between gap-2">
													<span className="flex items-center gap-2 text-sm font-medium">
														<ChartBarIcon className="size-4 shrink-0 text-secondary" />
														{check.title}
													</span>
													<RadioGroupItem
														id={id}
														value={check.risk_reference}
													/>
												</span>
												<span className="text-xs text-pretty text-muted-foreground">
													{check.description}
												</span>
											</label>
										);
									})}
								</RadioGroup>
								{field.state.meta.isTouched && !field.state.meta.isValid ? (
									<FieldError errors={field.state.meta.errors} />
								) : null}
							</Field>
						)}
					</form.Field>

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
								disabled={!canSubmit || isSubmitting}
							>
								<PaperPlaneTiltIcon className="size-4" />
								{isSubmitting
									? "Creating link..."
									: "Create Questionnaire Link"}
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
				description="Your risk assessment questionnaire link was created successfully."
			/>
		</Card>
	);
}
