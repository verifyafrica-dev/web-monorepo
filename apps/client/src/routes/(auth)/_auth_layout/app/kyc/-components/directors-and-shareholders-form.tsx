import { PlusIcon } from "@phosphor-icons/react";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { useEffect } from "react";

import {
	KycDirectorsAndShareholdersFormSchema,
	type KycDirectorsAndShareholdersFormValues,
} from "#/api/http/v2/kyc/kyc.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { SECTION_NAMES } from "../-data";
import {
	CountrySelect,
	Input,
	KycDatePicker,
	KycEntryCard,
	KycFormGrid,
	KycSaveButton,
	KycSectionHeader,
	Textarea,
} from "./kyc-form-primitives";
import { useKyc } from "./kyc-provider";

function normalizeDirectorAddress(
	address: KycDirectorsAndShareholdersFormValues["directors"][number]["address"],
) {
	if (typeof address === "string") {
		return { address, postal_code: "", country: "" };
	}

	return address;
}

function getDefaultValues(
	kycData: ReturnType<typeof useKyc>["kycData"],
): KycDirectorsAndShareholdersFormValues {
	const directors =
		kycData.company.directors.length > 0
			? kycData.company.directors.map((director) => ({
					name: director.name,
					date_of_birth: director.date_of_birth,
					nationality: director.nationality,
					address: normalizeDirectorAddress(
						director.address as KycDirectorsAndShareholdersFormValues["directors"][number]["address"],
					),
					id_number: director.id_number,
				}))
			: [
					{
						name: "",
						date_of_birth: "",
						nationality: "",
						address: { address: "", postal_code: "", country: "" },
						id_number: "",
					},
				];

	const ubos =
		kycData.company.ubos.length > 0
			? kycData.company.ubos.map((ubo) => ({
					name: ubo.name,
					ownership_percentage: ubo.ownership_percentage,
					id_number: ubo.id_number,
				}))
			: [{ name: "", ownership_percentage: 0, id_number: "" }];

	return { directors, ubos };
}

export function DirectorsAndShareholdersForm() {
	const { kycData, isReadOnly, isSaving, saveSection } = useKyc();

	const form = useForm({
		defaultValues: getDefaultValues(kycData),
		validationLogic: revalidateLogic(),
		validators: {
			// Revalidate on change after the first submit so form-level errors
			// (e.g. ownership total) clear and canSubmit can recover.
			onDynamic: KycDirectorsAndShareholdersFormSchema as never,
		},
		onSubmit: async ({ value }) => {
			await saveSection("directors-and-shareholders", value, {
				currentSection: SECTION_NAMES.DIRECTORS_AND_SHAREHOLDERS,
			});
		},
	});

	useEffect(() => {
		form.reset(getDefaultValues(kycData));
	}, [form, kycData]);

	return (
		<form
			className="flex flex-col gap-8"
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<KycSectionHeader
				title="Directors and Shareholders"
				description="Provide your directors and shareholders details."
			/>

			<form.Field
				name="directors"
				mode="array"
			>
				{(directorsField) => (
					<section className="flex flex-col gap-4">
						<h3 className="text-base font-semibold">Directors</h3>
						{directorsField.state.value.map((director, index) => (
							<KycEntryCard
								key={`director-${director.name}`}
								title={`Director ${index + 1}`}
								onRemove={
									!isReadOnly && directorsField.state.value.length > 1
										? () => directorsField.removeValue(index)
										: undefined
								}
							>
								<FieldGroup className="flex flex-col gap-4">
									<form.Field name={`directors[${index}].name`}>
										{(field) => (
											<Field
												className="gap-1.5"
												data-invalid={field.state.meta.errors.length > 0}
											>
												<FieldLabel>
													Full Name <span className="text-destructive">*</span>
												</FieldLabel>
												<Input
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
													disabled={isReadOnly}
												/>
												<FieldError errors={field.state.meta.errors} />
											</Field>
										)}
									</form.Field>
									<KycFormGrid>
										<form.Field name={`directors[${index}].date_of_birth`}>
											{(field) => (
												<Field
													className="gap-1.5"
													data-invalid={field.state.meta.errors.length > 0}
												>
													<FieldLabel>
														Date of Birth{" "}
														<span className="text-destructive">*</span>
													</FieldLabel>
													<KycDatePicker
														value={field.state.value}
														disableFutureDates
														onChange={(date) =>
															field.handleChange(
																date ? format(date, "yyyy-MM-dd") : "",
															)
														}
														disabled={isReadOnly}
													/>
													<FieldError errors={field.state.meta.errors} />
												</Field>
											)}
										</form.Field>
										<form.Field name={`directors[${index}].nationality`}>
											{(field) => (
												<Field
													className="gap-1.5"
													data-invalid={field.state.meta.errors.length > 0}
												>
													<FieldLabel>
														Nationality{" "}
														<span className="text-destructive">*</span>
													</FieldLabel>
													<CountrySelect
														value={field.state.value}
														onValueChange={field.handleChange}
														placeholder="Select nationality"
														disabled={isReadOnly}
													/>
													<FieldError errors={field.state.meta.errors} />
												</Field>
											)}
										</form.Field>
									</KycFormGrid>
									<form.Field name={`directors[${index}].address.address`}>
										{(field) => (
											<Field
												className="gap-1.5"
												data-invalid={field.state.meta.errors.length > 0}
											>
												<FieldLabel>
													Address <span className="text-destructive">*</span>
												</FieldLabel>
												<Textarea
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
													rows={3}
													disabled={isReadOnly}
												/>
												<FieldError errors={field.state.meta.errors} />
											</Field>
										)}
									</form.Field>
									<KycFormGrid>
										<form.Field
											name={`directors[${index}].address.postal_code`}
										>
											{(field) => (
												<Field
													className="gap-1.5"
													data-invalid={field.state.meta.errors.length > 0}
												>
													<FieldLabel>
														Postal Code{" "}
														<span className="text-destructive">*</span>
													</FieldLabel>
													<Input
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(event) =>
															field.handleChange(event.target.value)
														}
														disabled={isReadOnly}
													/>
													<FieldError errors={field.state.meta.errors} />
												</Field>
											)}
										</form.Field>
										<form.Field name={`directors[${index}].address.country`}>
											{(field) => (
												<Field
													className="gap-1.5"
													data-invalid={field.state.meta.errors.length > 0}
												>
													<FieldLabel>
														Country <span className="text-destructive">*</span>
													</FieldLabel>
													<CountrySelect
														value={field.state.value}
														onValueChange={field.handleChange}
														disabled={isReadOnly}
													/>
													<FieldError errors={field.state.meta.errors} />
												</Field>
											)}
										</form.Field>
									</KycFormGrid>
									<form.Field name={`directors[${index}].id_number`}>
										{(field) => (
											<Field
												className="gap-1.5"
												data-invalid={field.state.meta.errors.length > 0}
											>
												<FieldLabel>
													ID Number <span className="text-destructive">*</span>
												</FieldLabel>
												<Input
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
													disabled={isReadOnly}
												/>
												<FieldError errors={field.state.meta.errors} />
											</Field>
										)}
									</form.Field>
								</FieldGroup>
							</KycEntryCard>
						))}
						{!isReadOnly && (
							<Button
								type="button"
								variant="outline"
								className="tracking-wide"
								onClick={() =>
									directorsField.pushValue({
										name: "",
										date_of_birth: "",
										nationality: "",
										address: { address: "", postal_code: "", country: "" },
										id_number: "",
									})
								}
							>
								<PlusIcon
									className="size-4"
									weight="bold"
								/>
								Add Another Director
							</Button>
						)}
					</section>
				)}
			</form.Field>

			<form.Field
				name="ubos"
				mode="array"
			>
				{(ubosField) => (
					<section className="space-y-4">
						<div className="space-y-1">
							<h3 className="text-base font-semibold">
								Ultimate Beneficial Owners (UBOs)
							</h3>
							{ubosField.state.meta.errors.length > 0 && (
								<FieldError errors={ubosField.state.meta.errors} />
							)}
						</div>
						{ubosField.state.value.map((ubo, index) => (
							<KycEntryCard
								key={`ubo-${ubo.name}`}
								title={`UBO ${ubo.name}`}
								onRemove={
									!isReadOnly && ubosField.state.value.length > 1
										? () => ubosField.removeValue(index)
										: undefined
								}
							>
								<FieldGroup className="flex flex-col gap-4">
									<form.Field name={`ubos[${index}].name`}>
										{(field) => (
											<Field
												className="gap-1.5"
												data-invalid={field.state.meta.errors.length > 0}
											>
												<FieldLabel>
													Full Name <span className="text-destructive">*</span>
												</FieldLabel>
												<Input
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
													disabled={isReadOnly}
												/>
												<FieldError errors={field.state.meta.errors} />
											</Field>
										)}
									</form.Field>
									<KycFormGrid>
										<form.Field name={`ubos[${index}].ownership_percentage`}>
											{(field) => (
												<Field
													className="gap-1.5"
													data-invalid={field.state.meta.errors.length > 0}
												>
													<FieldLabel>
														Ownership Percentage{" "}
														<span className="text-destructive">*</span>
													</FieldLabel>
													<Input
														type="number"
														min={0}
														max={100}
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
										<form.Field name={`ubos[${index}].id_number`}>
											{(field) => (
												<Field
													className="gap-1.5"
													data-invalid={field.state.meta.errors.length > 0}
												>
													<FieldLabel>
														ID Number{" "}
														<span className="text-destructive">*</span>
													</FieldLabel>
													<Input
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(event) =>
															field.handleChange(event.target.value)
														}
														disabled={isReadOnly}
													/>
													<FieldError errors={field.state.meta.errors} />
												</Field>
											)}
										</form.Field>
									</KycFormGrid>
								</FieldGroup>
							</KycEntryCard>
						))}
						{!isReadOnly && (
							<Button
								type="button"
								variant="outline"
								className="tracking-wide"
								onClick={() =>
									ubosField.pushValue({
										name: "",
										ownership_percentage: 0,
										id_number: "",
									})
								}
							>
								<PlusIcon
									className="size-4"
									weight="bold"
								/>
								Add Another UBO
							</Button>
						)}
					</section>
				)}
			</form.Field>

			{!isReadOnly && <KycSaveButton isSaving={isSaving} />}
		</form>
	);
}
