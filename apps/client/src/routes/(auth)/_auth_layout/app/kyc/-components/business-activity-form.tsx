import { PlusIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import {
	KycBusinessActivityFormSchema,
	type KycBusinessActivityFormValues,
} from "#/api/http/v2/kyc/kyc.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
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
import {
	KYC_CLIENT_GEOGRAPHIES,
	KYC_VERIFICATION_VOLUMES,
} from "../-constants";
import { SECTION_NAMES } from "../-data";
import {
	CountrySelect,
	Input,
	KycEntryCard,
	KycFormGrid,
	KycSaveButton,
	KycSectionHeader,
	Textarea,
} from "./kyc-form-primitives";
import { useKyc } from "./kyc-provider";

function getDefaultValues(
	kycData: ReturnType<typeof useKyc>["kycData"],
): KycBusinessActivityFormValues {
	const activity = kycData.company.business_activity;

	return {
		nature_of_business: activity.nature_of_business ?? "",
		description_of_products_services:
			activity.description_of_products_services ?? "",
		expected_monthly_verification_volume:
			activity.expected_monthly_verification_volume ?? "",
		main_geographies_of_clients: activity.main_geographies_of_clients?.length
			? activity.main_geographies_of_clients
			: [],
		regulatory_licenses_held: activity.regulatory_licenses_held ?? [],
	};
}

export function BusinessActivityForm() {
	const { kycData, isReadOnly, isSaving, saveSection } = useKyc();

	const form = useForm({
		defaultValues: getDefaultValues(kycData),
		validators: {
			onSubmit: KycBusinessActivityFormSchema,
		},
		onSubmit: async ({ value }) => {
			await saveSection("business-activity", value, {
				currentSection: SECTION_NAMES.BUSINESS_ACTIVITY,
			});
		},
	});

	useEffect(() => {
		form.reset(getDefaultValues(kycData));
	}, [form, kycData]);

	const selectedGeography =
		form.state.values.main_geographies_of_clients[0] ?? "";

	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<KycSectionHeader
				title="Business Activity"
				description="Provide your business activity details."
			/>

			<FieldGroup className="flex flex-col gap-4">
				<form.Field name="nature_of_business">
					{(field) => (
						<Field
							className="gap-1.5"
							data-invalid={field.state.meta.errors.length > 0}
						>
							<FieldLabel htmlFor="natureOfBusiness">
								Nature of Business <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="natureOfBusiness"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								disabled={isReadOnly}
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<form.Field name="description_of_products_services">
					{(field) => (
						<Field
							className="gap-1.5"
							data-invalid={field.state.meta.errors.length > 0}
						>
							<FieldLabel htmlFor="productsDescription">
								Description of Products/Services{" "}
								<span className="text-destructive">*</span>
							</FieldLabel>
							<Textarea
								id="productsDescription"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								rows={4}
								disabled={isReadOnly}
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				<KycFormGrid>
					<form.Field name="expected_monthly_verification_volume">
						{(field) => (
							<Field
								className="gap-1.5"
								data-invalid={field.state.meta.errors.length > 0}
							>
								<FieldLabel htmlFor="verificationVolume">
									Expected Monthly Verification Volume{" "}
									<span className="text-destructive">*</span>
								</FieldLabel>
								<Select
									value={field.state.value}
									onValueChange={field.handleChange}
									disabled={isReadOnly}
								>
									<SelectTrigger
										id="verificationVolume"
										className="w-full"
									>
										<SelectValue placeholder="Select volume range" />
									</SelectTrigger>
									<SelectContent>
										{KYC_VERIFICATION_VOLUMES.map((volume) => (
											<SelectItem
												key={volume}
												value={volume}
											>
												{volume}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>

					<form.Field name="main_geographies_of_clients">
						{(field) => (
							<Field
								className="gap-1.5"
								data-invalid={field.state.meta.errors.length > 0}
							>
								<FieldLabel htmlFor="clientGeographies">
									Main Geographies of Clients{" "}
									<span className="text-destructive">*</span>
								</FieldLabel>
								<Select
									value={selectedGeography}
									onValueChange={(value) => field.handleChange([value])}
									disabled={isReadOnly}
								>
									<SelectTrigger
										id="clientGeographies"
										className="w-full"
									>
										<SelectValue placeholder="Select geography" />
									</SelectTrigger>
									<SelectContent>
										{KYC_CLIENT_GEOGRAPHIES.map((geography) => (
											<SelectItem
												key={geography}
												value={geography}
											>
												{geography}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>
				</KycFormGrid>
			</FieldGroup>

			<form.Field
				name="regulatory_licenses_held"
				mode="array"
			>
				{(licensesField) => (
					<section className="space-y-4">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<h3 className="text-base font-semibold">
								Regulatory Licenses Held
							</h3>
							{!isReadOnly && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="tracking-wide"
									onClick={() =>
										licensesField.pushValue({
											license_name: "",
											license_number: "",
											country: "",
										})
									}
								>
									<PlusIcon
										className="size-4"
										weight="bold"
									/>
									Add License
								</Button>
							)}
						</div>

						{licensesField.state.value.map((license, index) => (
							<KycEntryCard
								key={[
									license.license_name,
									license.license_number,
									license.country,
								].join("|")}
								title={`License ${index + 1}`}
								onRemove={
									!isReadOnly
										? () => licensesField.removeValue(index)
										: undefined
								}
							>
								<div className="space-y-4">
									<form.Field
										name={`regulatory_licenses_held[${index}].license_name`}
									>
										{(field) => (
											<Field
												className="gap-1.5"
												data-invalid={field.state.meta.errors.length > 0}
											>
												<FieldLabel>License Name</FieldLabel>
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
										<form.Field
											name={`regulatory_licenses_held[${index}].license_number`}
										>
											{(field) => (
												<Field
													className="gap-1.5"
													data-invalid={field.state.meta.errors.length > 0}
												>
													<FieldLabel>License Number</FieldLabel>
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
										<form.Field
											name={`regulatory_licenses_held[${index}].country`}
										>
											{(field) => (
												<Field
													className="gap-1.5"
													data-invalid={field.state.meta.errors.length > 0}
												>
													<FieldLabel>Country</FieldLabel>
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
								</div>
							</KycEntryCard>
						))}
					</section>
				)}
			</form.Field>

			{!isReadOnly && <KycSaveButton isSaving={isSaving} />}
		</form>
	);
}
