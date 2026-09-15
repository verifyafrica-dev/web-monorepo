import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";
import { useSubmitNewVerifyKybV2Mutation } from "#/api/http/v2/verifications/new-verify/new-verify.hooks";
import type { NewVerifySession } from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Field, FieldLabel } from "@verifyafrica/ui/components/ui/field";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";

import { MerchantPrefillCard } from "./merchant-prefill-card";
import { VerificationSubmittedDialog } from "./verification-submitted-dialog";

type KybScreeningVerificationProps = {
	session: NewVerifySession;
};

export function KybScreeningVerification({
	session,
}: KybScreeningVerificationProps) {
	const [submitted, setSubmitted] = useState(false);
	const mutation = useSubmitNewVerifyKybV2Mutation();
	const jurisdictionLocked = Boolean(
		session.collect?.jurisdiction_locked || session.collect?.country_locked,
	);
	const countries = session.countries ?? [];

	const form = useForm({
		defaultValues: {
			companyName: session.prefilled?.company_name ?? "",
			companyRegistrationNumber:
				session.prefilled?.company_registration_number ?? "",
			country: jurisdictionLocked
				? (session.prefilled?.jurisdiction_code || session.prefilled?.country || "")
				: "",
		},
		validators: {
			onSubmit: z.object({
				companyName: z.string().trim().min(1, "Company name is required"),
				companyRegistrationNumber: z
					.string()
					.trim()
					.min(1, "Company registration number is required"),
				country: jurisdictionLocked
					? z.string()
					: z.string().min(1, "Business jurisdiction is required"),
			}),
		},
		onSubmit: async ({ value }) => {
			try {
				await mutation.mutateAsync({
					token: session.token,
					payload: {
						company_name: value.companyName.trim(),
						company_registration_number: value.companyRegistrationNumber.trim(),
						country: jurisdictionLocked ? undefined : value.country,
					},
				});
				setSubmitted(true);
			} catch (error) {
				const message = (error as V2AxiosError).response?.data?.message;
				toast.error(message ?? "Failed to submit KYB screening.");
			}
		},
	});

	if (submitted) {
		return (
			<VerificationSubmittedDialog description="We've received your company details. You can close this page now." />
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
			<form.Field name="companyName">
				{(field) => (
					<Field className="gap-1.5">
						<FieldLabel htmlFor="kyb-company-name">Company name</FieldLabel>
						<Input
							id="kyb-company-name"
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
						<FieldLabel htmlFor="kyb-registration">
							Company registration number
						</FieldLabel>
						<Input
							id="kyb-registration"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
						/>
					</Field>
				)}
			</form.Field>
			{jurisdictionLocked ? null : (
				<form.Field name="country">
					{(field) => (
						<Field className="gap-1.5">
							<FieldLabel htmlFor="kyb-jurisdiction">
								Business jurisdiction
							</FieldLabel>
							<Select
								value={field.state.value || undefined}
								onValueChange={field.handleChange}
							>
								<SelectTrigger id="kyb-jurisdiction" className="w-full">
									<SelectValue placeholder="Select a jurisdiction" />
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
