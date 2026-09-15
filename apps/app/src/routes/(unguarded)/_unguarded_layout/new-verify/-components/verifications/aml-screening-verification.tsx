import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";
import { useSubmitNewVerifyAmlV2Mutation } from "#/api/http/v2/verifications/new-verify/new-verify.hooks";
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
import { KycDatePicker } from "../../../../../(auth)/_auth_layout/app/kyc/-components/kyc-form-primitives";

import { MerchantPrefillCard } from "./merchant-prefill-card";
import { VerificationSubmittedDialog } from "./verification-submitted-dialog";

type AmlScreeningVerificationProps = {
	session: NewVerifySession;
};

export function AmlScreeningVerification({
	session,
}: AmlScreeningVerificationProps) {
	const [submitted, setSubmitted] = useState(false);
	const mutation = useSubmitNewVerifyAmlV2Mutation();
	const countryLocked = Boolean(session.collect?.country_locked);
	const dobLocked = Boolean(session.collect?.dob_locked);
	const countries = session.countries ?? [];

	const form = useForm({
		defaultValues: {
			fullName: session.prefilled?.full_name ?? "",
			country: countryLocked ? (session.prefilled?.country ?? "") : "",
			dob: dobLocked ? (session.prefilled?.dob ?? "") : "",
		},
		validators: {
			onSubmit: z.object({
				fullName: z.string().trim().min(1, "Full name is required"),
				country: z.string(),
				dob: z.string(),
			}),
		},
		onSubmit: async ({ value }) => {
			try {
				await mutation.mutateAsync({
					token: session.token,
					payload: {
						full_name: value.fullName.trim(),
						country: countryLocked ? undefined : value.country || undefined,
						dob: dobLocked ? undefined : value.dob || undefined,
					},
				});
				setSubmitted(true);
			} catch (error) {
				const message = (error as V2AxiosError).response?.data?.message;
				toast.error(message ?? "Failed to submit AML screening.");
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
			<form.Field name="fullName">
				{(field) => (
					<Field className="gap-1.5">
						<FieldLabel htmlFor="aml-full-name">Full name</FieldLabel>
						<Input
							id="aml-full-name"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
						/>
					</Field>
				)}
			</form.Field>
			{countryLocked ? null : (
				<form.Field name="country">
					{(field) => (
						<Field className="gap-1.5">
							<FieldLabel htmlFor="aml-country">Country (optional)</FieldLabel>
							<Select
								value={field.state.value || undefined}
								onValueChange={field.handleChange}
							>
								<SelectTrigger id="aml-country" className="w-full">
									<SelectValue placeholder="Select a country" />
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
			{dobLocked ? null : (
				<form.Field name="dob">
					{(field) => (
						<Field className="gap-1.5">
							<FieldLabel htmlFor="aml-dob">Date of birth (optional)</FieldLabel>
							<KycDatePicker
								id="aml-dob"
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
