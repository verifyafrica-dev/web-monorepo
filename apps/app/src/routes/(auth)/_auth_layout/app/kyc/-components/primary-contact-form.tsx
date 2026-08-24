import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import {
	KycPrimaryContactFormSchema,
	type KycPrimaryContactFormValues,
} from "#/api/http/v1/kyc/kyc.types";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { PhoneInput } from "@verifyafrica/ui/components/ui-extended/phone-input";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { KYC_CONTACT_POSITIONS } from "../-constants";
import { SECTION_NAMES } from "../-data";
import {
	Input,
	KycFormGrid,
	KycSaveButton,
	KycSectionHeader,
} from "./kyc-form-primitives";
import { useKyc } from "./kyc-provider";

function getDefaultValues(
	kycData: ReturnType<typeof useKyc>["kycData"],
): KycPrimaryContactFormValues {
	return {
		name: kycData.company.primary_contact?.name ?? "",
		position: kycData.company.primary_contact?.position ?? "",
		email: kycData.company.primary_contact?.email ?? "",
		phone: kycData.company.primary_contact?.phone ?? "",
	};
}

export function PrimaryContactForm() {
	const { kycData, isReadOnly, isSaving, saveSection } = useKyc();

	const form = useForm({
		defaultValues: getDefaultValues(kycData),
		validators: {
			onSubmit: KycPrimaryContactFormSchema,
		},
		onSubmit: async ({ value }) => {
			await saveSection("primary-contact", value, {
				currentSection: SECTION_NAMES.PRIMARY_CONTACT,
			});
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
				title="Primary Contact"
				description="Provide your primary contact details."
			/>

			<FieldGroup className="flex flex-col gap-4">
				<form.Field name="name">
					{(field) => (
						<Field
							data-invalid={field.state.meta.errors.length > 0}
							className="gap-1.5"
						>
							<FieldLabel htmlFor="contactName">
								Name <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="contactName"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								placeholder="Enter the primary contact's full name"
								disabled={isReadOnly}
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name="position">
					{(field) => (
						<Field
							data-invalid={field.state.meta.errors.length > 0}
							className="gap-1.5"
						>
							<FieldLabel htmlFor="contactPosition">
								Position <span className="text-destructive">*</span>
							</FieldLabel>
							<Select
								value={field.state.value}
								onValueChange={field.handleChange}
								disabled={isReadOnly}
							>
								<SelectTrigger id="contactPosition" className="w-full">
									<SelectValue placeholder="Select position" />
								</SelectTrigger>
								<SelectContent>
									{KYC_CONTACT_POSITIONS.map((position) => (
										<SelectItem key={position} value={position}>
											{position}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<KycFormGrid>
					<form.Field name="email">
						{(field) => (
							<Field
								data-invalid={field.state.meta.errors.length > 0}
								className="gap-1.5"
							>
								<FieldLabel htmlFor="contactEmail">
									Email <span className="text-destructive">*</span>
								</FieldLabel>
								<Input
									id="contactEmail"
									type="email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="Enter the primary contact's email address"
									disabled={isReadOnly}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
					<form.Field name="phone">
						{(field) => (
							<Field
								data-invalid={field.state.meta.errors.length > 0}
								className="gap-1.5"
							>
								<FieldLabel htmlFor="contactPhone">
									Phone <span className="text-destructive">*</span>
								</FieldLabel>
								<PhoneInput
									id="contactPhone"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={field.handleChange}
									disabled={isReadOnly}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
				</KycFormGrid>
			</FieldGroup>

			{!isReadOnly && <KycSaveButton isSaving={isSaving} />}
		</form>
	);
}
