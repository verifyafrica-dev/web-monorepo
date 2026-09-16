import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";
import { useSubmitNewVerifyBusinessAmlV2Mutation } from "#/api/http/v2/verifications/new-verify/new-verify.hooks";
import type { NewVerifySession } from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Field, FieldLabel } from "@verifyafrica/ui/components/ui/field";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { ScreeningCountriesMultiSelect } from "@verifyafrica/ui/components/ui-extended/screening-countries-multi-select";
import { KycDatePicker } from "../../../../../(auth)/_auth_layout/app/kyc/-components/kyc-form-primitives";

import { MerchantPrefillCard } from "./merchant-prefill-card";
import { VerificationSubmittedDialog } from "./verification-submitted-dialog";

type BusinessAmlScreeningVerificationProps = {
	session: NewVerifySession;
};

export function BusinessAmlScreeningVerification({
	session,
}: BusinessAmlScreeningVerificationProps) {
	const [submitted, setSubmitted] = useState(false);
	const mutation = useSubmitNewVerifyBusinessAmlV2Mutation();
	const countryLocked = Boolean(session.collect?.country_locked);
	const dateLocked = Boolean(session.collect?.incorporation_date_locked);
	const countries = session.countries ?? [];

	const form = useForm({
		defaultValues: {
			businessName: session.prefilled?.business_name ?? "",
			countries: [] as string[],
			incorporationDate: dateLocked
				? (session.prefilled?.incorporation_date ?? "")
				: "",
		},
		validators: {
			onSubmit: z.object({
				businessName: z.string().trim().min(1, "Business name is required"),
				countries: z.array(z.string()),
				incorporationDate: z.string(),
			}),
		},
		onSubmit: async ({ value }) => {
			try {
				await mutation.mutateAsync({
					token: session.token,
					payload: {
						business_name: value.businessName.trim(),
						countries: countryLocked ? undefined : value.countries,
						incorporation_date: dateLocked
							? undefined
							: value.incorporationDate || undefined,
					},
				});
				setSubmitted(true);
			} catch (error) {
				const message = (error as V2AxiosError).response?.data?.message;
				toast.error(message ?? "Failed to submit business AML screening.");
			}
		},
	});

	if (submitted) {
		return (
			<VerificationSubmittedDialog description="We've received your details. You can close this page now." />
		);
	}

	return (
		<form
			className="flex flex-col gap-4 px-6 pb-8"
			onSubmit={(event) => {
				event.preventDefault();
				void form.handleSubmit();
			}}
		>
			<MerchantPrefillCard session={session} />
			<form.Field name="businessName">
				{(field) => (
					<Field className="gap-1.5">
						<FieldLabel htmlFor="business-aml-name">Business name</FieldLabel>
						<Input
							id="business-aml-name"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
						/>
					</Field>
				)}
			</form.Field>
			{countryLocked ? null : (
				<form.Field name="countries">
					{(field) => (
						<ScreeningCountriesMultiSelect
							id="business-aml-country"
							label="Countries (optional)"
							value={field.state.value}
							onValueChange={field.handleChange}
							countries={countries}
						/>
					)}
				</form.Field>
			)}
			{dateLocked ? null : (
				<form.Field name="incorporationDate">
					{(field) => (
						<Field className="gap-1.5">
							<FieldLabel htmlFor="business-aml-date">
								Incorporation date (optional)
							</FieldLabel>
							<KycDatePicker
								id="business-aml-date"
								value={
									field.state.value
										? new Date(`${field.state.value}T00:00:00`)
										: undefined
								}
								onChange={(date) =>
									field.handleChange(date ? format(date, "yyyy-MM-dd") : "")
								}
							/>
						</Field>
					)}
				</form.Field>
			)}
			<Button type="submit" disabled={mutation.isPending}>
				{mutation.isPending ? "Submitting..." : "Continue"}
			</Button>
		</form>
	);
}
