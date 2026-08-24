import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import {
	KycOnboardingQuestionnaireFormSchema,
	type KycOnboardingQuestionnaireFormValues,
} from "#/api/http/v1/kyc/kyc.types";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { KYC_TARGET_CLIENTS } from "../-constants";
import { SECTION_NAMES } from "../-data";
import {
	Input,
	KycFormGrid,
	KycSaveButton,
	KycSectionHeader,
	Textarea,
} from "./kyc-form-primitives";
import { useKyc } from "./kyc-provider";

function getDefaultValues(
	kycData: ReturnType<typeof useKyc>["kycData"],
): KycOnboardingQuestionnaireFormValues {
	const questionnaire = kycData.onboarding_questionnaire;

	return {
		purpose_of_account: questionnaire.purpose_of_account ?? "",
		target_clients: questionnaire.target_clients ?? KYC_TARGET_CLIENTS[0],
		average_client_transaction_size_eur:
			questionnaire.average_client_transaction_size_eur ?? 0,
		high_risk_jurisdictions_fatf_exposure:
			questionnaire.high_risk_jurisdictions_fatf_exposure ?? "",
		main_banking_payment_partners: questionnaire.main_banking_payment_partners ?? "",
		amlCtfOfficerName: questionnaire.aml_ctf_officer?.name ?? "",
		amlCtfOfficerEmail: questionnaire.aml_ctf_officer?.email ?? "",
	};
}

export function OnboardingQuestionnaireForm() {
	const { kycData, isReadOnly, isSaving, saveSection } = useKyc();

	const form = useForm({
		defaultValues: getDefaultValues(kycData),
		validators: {
			onSubmit: KycOnboardingQuestionnaireFormSchema,
		},
		onSubmit: async ({ value }) => {
			await saveSection(
				"onboarding-questionnaire",
				{
					purpose_of_account: value.purpose_of_account,
					target_clients: value.target_clients,
					average_client_transaction_size_eur:
						value.average_client_transaction_size_eur,
					high_risk_jurisdictions_fatf_exposure:
						value.high_risk_jurisdictions_fatf_exposure,
					main_banking_payment_partners: value.main_banking_payment_partners,
					aml_ctf_officer: {
						name: value.amlCtfOfficerName,
						email: value.amlCtfOfficerEmail,
					},
				},
				{ currentSection: SECTION_NAMES.ONBOARDING_QUESTIONNAIRE },
			);
		},
	});

	useEffect(() => {
		form.reset(getDefaultValues(kycData));
	}, [form, kycData]);

	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<KycSectionHeader
				title="Onboarding Questionnaire"
				description="Answer the onboarding questionnaire to get started."
			/>

			<FieldGroup className="flex flex-col gap-4">
				<form.Field name="purpose_of_account">
					{(field) => (
						<Field
							className="gap-1.5"
							data-invalid={field.state.meta.errors.length > 0}
						>
							<FieldLabel htmlFor="purposeOfAccount">
								Purpose of Account <span className="text-destructive">*</span>
							</FieldLabel>
							<Textarea
								id="purposeOfAccount"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								placeholder="Describe the purpose of your account"
								rows={3}
								disabled={isReadOnly}
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name="target_clients">
					{(field) => (
						<Field
							className="gap-1.5"
							data-invalid={field.state.meta.errors.length > 0}
						>
							<FieldLabel htmlFor="targetClients">
								Target Clients <span className="text-destructive">*</span>
							</FieldLabel>
							<Select
								value={field.state.value}
								onValueChange={field.handleChange}
								disabled={isReadOnly}
							>
								<SelectTrigger id="targetClients" className="w-full">
									<SelectValue placeholder="Select target clients" />
								</SelectTrigger>
								<SelectContent>
									{KYC_TARGET_CLIENTS.map((client) => (
										<SelectItem key={client} value={client}>
											{client}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<KycFormGrid>
					<form.Field name="average_client_transaction_size_eur">
						{(field) => (
							<Field
								className="gap-1.5"
								data-invalid={field.state.meta.errors.length > 0}
							>
								<FieldLabel htmlFor="averageTransactionSize">
									Average Client Transaction Size (EUR){" "}
									<span className="text-destructive">*</span>
								</FieldLabel>
								<Input
									id="averageTransactionSize"
									type="number"
									min={0}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) =>
										field.handleChange(Number(event.target.value))
									}
									disabled={isReadOnly}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
					<form.Field name="high_risk_jurisdictions_fatf_exposure">
						{(field) => (
							<Field
								className="gap-1.5"
								data-invalid={field.state.meta.errors.length > 0}
							>
								<FieldLabel htmlFor="highRiskJurisdictions">
									High Risk Jurisdictions (FATF){" "}
									<span className="text-destructive">*</span>
								</FieldLabel>
								<Input
									id="highRiskJurisdictions"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									disabled={isReadOnly}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
				</KycFormGrid>

				<form.Field name="main_banking_payment_partners">
					{(field) => (
						<Field
							className="gap-1.5"
							data-invalid={field.state.meta.errors.length > 0}
						>
							<FieldLabel htmlFor="bankingPartners">
								Main Banking/Payment Partners{" "}
								<span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="bankingPartners"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								disabled={isReadOnly}
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<div className="space-y-4">
					<p className="text-sm font-semibold">
						AML/CTF Officer <span className="text-destructive">*</span>
					</p>
					<KycFormGrid>
						<form.Field name="amlCtfOfficerName">
							{(field) => (
								<Field
									className="gap-1.5"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<FieldLabel htmlFor="amlOfficerName">Name</FieldLabel>
									<Input
										id="amlOfficerName"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										disabled={isReadOnly}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>
						<form.Field name="amlCtfOfficerEmail">
							{(field) => (
								<Field
									className="gap-1.5"
									data-invalid={field.state.meta.errors.length > 0}
								>
									<FieldLabel htmlFor="amlOfficerEmail">Email</FieldLabel>
									<Input
										id="amlOfficerEmail"
										type="email"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										disabled={isReadOnly}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>
					</KycFormGrid>
				</div>
			</FieldGroup>

			{!isReadOnly && <KycSaveButton isSaving={isSaving} />}
		</form>
	);
}
