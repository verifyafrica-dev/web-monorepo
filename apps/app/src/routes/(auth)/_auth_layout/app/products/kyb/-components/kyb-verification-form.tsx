import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
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
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { VerificationConsentCheckbox } from "../../../-components/VerificationConsentCheckbox";
import { VerificationResultDialog } from "../../-components/verification-result-dialog";
import { verificationConsentSchema } from "../../../-components/VerificationConsentCheckbox/data";
import { useTenantSupportedCountries } from "../../-countries";
import { useProductVerificationSubmit } from "../../-use-product-verification-submit";
import { buildKybVerificationPayload } from "../-data";
import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";

const kybFormSchema = z.object({
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
		useTenantSupportedCountries();

	const form = useForm({
		defaultValues: {
			email: "",
			businessJurisdiction: "",
			companyName: "",
			companyRegistrationNumber: "",
			consent: false,
		},
		validators: {
			onChange: kybFormSchema,
			onSubmit: kybFormSchema,
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
					<FieldGroup className="gap-4">
						<form.Field name="email">
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
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								</Field>
							)}
						</form.Field>

						<form.Field name="businessJurisdiction">
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
										Choose the jurisdiction where the company is registered
									</FieldDescription>
								</Field>
							)}
						</form.Field>

						<form.Field name="companyName">
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
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								</Field>
							)}
						</form.Field>

						<form.Field name="companyRegistrationNumber">
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
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								</Field>
							)}
						</form.Field>
					</FieldGroup>

					<form.Field name="consent">
						{(field) => (
							<VerificationConsentCheckbox
								id="kyb-verification-consent"
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
				onStartNew={() => handleStartNewVerification(resetForms)}
				description="Your KYB verification request was created successfully."
			/>
		</Card>
	);
}
