import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import {
	KycComplianceDeclarationsFormSchema,
	type KycComplianceDeclarationsFormValues,
} from "#/api/http/v2/kyc/kyc.types";
import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { Field, FieldError, FieldGroup } from "@verifyafrica/ui/components/ui/field";
import { KYC_DECLARATIONS } from "../-constants";
import { SECTION_NAMES } from "../-data";
import { useKyc } from "./kyc-provider";
import { KycSaveButton, KycSectionHeader } from "./kyc-form-primitives";

function getDefaultValues(
	kycData: ReturnType<typeof useKyc>["kycData"],
): KycComplianceDeclarationsFormValues {
	const declarations = kycData.compliance_declarations;

	return {
		not_engaged_in_prohibited_activities:
			declarations.not_engaged_in_prohibited_activities ?? false,
		no_directors_ubos_on_sanctions_lists:
			declarations.no_directors_ubos_on_sanctions_lists ?? false,
		information_true_and_complete:
			declarations.information_true_and_complete ?? false,
		agree_to_provide_supporting_documents:
			declarations.agree_to_provide_supporting_documents ?? false,
	};
}

export function ComplianceDeclarationsForm() {
	const { kycData, isReadOnly, isSaving, saveSection } = useKyc();

	const form = useForm({
		defaultValues: getDefaultValues(kycData),
		validators: {
			onSubmit: KycComplianceDeclarationsFormSchema,
		},
		onSubmit: async ({ value }) => {
			await saveSection("compliance-declarations", value, {
				currentSection: SECTION_NAMES.COMPLIANCE_DECLARATIONS,
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
				title="Compliance Declarations"
				description="Please confirm the following declarations by checking the boxes below:"
			/>

			<FieldGroup className="space-y-5">
				{KYC_DECLARATIONS.map((declaration) => (
					<form.Field key={declaration.key} name={declaration.key}>
						{(field) => (
							<Field className="gap-1.5" data-invalid={field.state.meta.errors.length > 0}>
								<div className="flex items-start gap-3">
									<Checkbox
										id={declaration.key}
										checked={field.state.value}
										onCheckedChange={(checked) =>
											field.handleChange(checked === true)
										}
										disabled={isReadOnly}
									/>
									<Label
										htmlFor={declaration.key}
										className="text-sm leading-relaxed font-normal"
									>
										{declaration.label}
										<span className="text-destructive"> *</span>
									</Label>
								</div>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
				))}
			</FieldGroup>

			{!isReadOnly && <KycSaveButton isSaving={isSaving} />}
		</form>
	);
}
