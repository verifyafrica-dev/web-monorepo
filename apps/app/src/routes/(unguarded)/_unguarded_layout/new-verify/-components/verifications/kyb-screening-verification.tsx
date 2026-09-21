import { useForm } from "@tanstack/react-form";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";
import { useSubmitNewVerifyKybV2Mutation } from "#/api/http/v2/verifications/new-verify/new-verify.hooks";
import type { NewVerifySession } from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";
import { uploadNewVerifyProofFile } from "@verifyafrica/api-client/lib/new-verify-proof-upload";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
import {
	Field,
	FieldDescription,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
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

const IDENTIFIER_LABELS: Record<string, string> = {
	company_name: "Company name",
	registration_number: "Company registration number",
	vat_number: "VAT number",
	freelance_number: "Freelance number",
	tax_identification_number: "Tax identification number",
	commercial_registration_number: "Commercial registration number",
	cnpj_number: "CNPJ number",
	trn_number: "TRN number",
	iban_number: "IBAN number",
	license_number: "License number",
	vat_certificate_number: "VAT certificate number",
};

type KybScreeningVerificationProps = {
	session: NewVerifySession;
};

function documentLabels(session: NewVerifySession, countryCode: string) {
	const selected = session.countries?.find(
		(country) => country.code === countryCode,
	);
	const docs = selected?.documents ?? session.documents ?? [];
	return docs
		.map((item) =>
			typeof item === "string" ? item : (item.payload_name ?? ""),
		)
		.filter(Boolean);
}

export function KybScreeningVerification({
	session,
}: KybScreeningVerificationProps) {
	const [submitted, setSubmitted] = useState(false);
	const [proofFile, setProofFile] = useState<File | null>(null);
	const mutation = useSubmitNewVerifyKybV2Mutation();
	const kybBase = session.kyb_base ?? "search";
	const jurisdictionLocked = Boolean(
		session.collect?.jurisdiction_locked || session.collect?.country_locked,
	);
	const searchByLocked = Boolean(session.collect?.search_by_locked);
	const countries = session.countries ?? [];
	const lockedSearchBy = session.prefilled?.search_by ?? "";

	const form = useForm({
		defaultValues: {
			companyName: session.prefilled?.company_name ?? "",
			companyRegistrationNumber:
				session.prefilled?.company_registration_number ?? "",
			country: jurisdictionLocked
				? session.prefilled?.jurisdiction_code ||
					session.prefilled?.country ||
					""
				: "",
			searchBy: lockedSearchBy,
			searchWord: session.prefilled?.search_word ?? "",
			requiredDocuments: [] as string[],
		},
		validators: {
			onSubmit: z.object({
				companyName: z.string(),
				companyRegistrationNumber: z.string(),
				country: jurisdictionLocked
					? z.string()
					: z.string().min(1, "Business jurisdiction is required"),
				searchBy: z.string(),
				searchWord: z.string(),
				requiredDocuments: z.array(z.string()),
			}),
		},
		onSubmit: async ({ value }) => {
			try {
				const country = jurisdictionLocked ? undefined : value.country;
				if (kybBase === "document") {
					if (!proofFile) {
						toast.error("Upload a business document.");
						return;
					}
					const proof = await uploadNewVerifyProofFile(
						session.token,
						proofFile,
					);
					const labels = documentLabels(
						session,
						value.country || session.prefilled?.jurisdiction_code || "",
					);
					await mutation.mutateAsync({
						token: session.token,
						payload: {
							country,
							document_proof: proof,
							additional_proof_labels: labels.slice(0, 1),
							proofs: labels[0]
								? [{ label: labels[0], file: proof }]
								: [{ label: "document_proof", file: proof }],
						},
					});
				} else if (kybBase === "document_purchase") {
					await mutation.mutateAsync({
						token: session.token,
						payload: {
							country,
							company_registration_number:
								value.companyRegistrationNumber.trim(),
							required_documents: value.requiredDocuments,
						},
					});
				} else {
					await mutation.mutateAsync({
						token: session.token,
						payload: {
							company_name: value.companyName.trim() || undefined,
							company_registration_number:
								value.companyRegistrationNumber.trim() || undefined,
							country,
							search_by: searchByLocked
								? undefined
								: value.searchBy || undefined,
							search_word: value.searchWord.trim() || undefined,
						},
					});
				}
				setSubmitted(true);
			} catch (error) {
				const message = (error as V2AxiosError).response?.data?.message;
				toast.error(message ?? "Failed to submit KYB screening.");
			}
		},
	});

	const selectedCountry = form.state.values.country;
	const identifiers = useMemo(() => {
		const country = countries.find((item) => item.code === selectedCountry);
		return country?.identifiers ?? session.identifiers ?? [];
	}, [countries, selectedCountry, session.identifiers]);

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
								<SelectTrigger
									id="kyb-jurisdiction"
									className="w-full"
								>
									<SelectValue placeholder="Select a jurisdiction" />
								</SelectTrigger>
								<SelectContent className="max-h-60">
									{countries.map((country) => (
										<SelectItem
											key={country.code}
											value={country.code}
										>
											<CountryOptionLabel
												name={country.name}
												countryCode={country.iso ?? country.code}
											/>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
					)}
				</form.Field>
			)}

			{kybBase === "search" ? (
				<>
					{searchByLocked ? null : identifiers.length > 0 ? (
						<form.Field name="searchBy">
							{(field) => (
								<Field className="gap-1.5">
									<FieldLabel htmlFor="kyb-search-by">
										Search identifier
									</FieldLabel>
									<Select
										value={field.state.value || undefined}
										onValueChange={field.handleChange}
									>
										<SelectTrigger
											id="kyb-search-by"
											className="w-full"
										>
											<SelectValue placeholder="Select an identifier" />
										</SelectTrigger>
										<SelectContent>
											{identifiers.map((identifier) => (
												<SelectItem
													key={identifier}
													value={identifier}
												>
													{IDENTIFIER_LABELS[identifier] ??
														identifier.replaceAll("_", " ")}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							)}
						</form.Field>
					) : null}
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
					<form.Field name="searchWord">
						{(field) => (
							<Field className="gap-1.5">
								<FieldLabel htmlFor="kyb-search-word">
									Other identifier value
								</FieldLabel>
								<Input
									id="kyb-search-word"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldDescription>
									Use this when searching by VAT, TRN, IBAN, or another
									supported identifier.
								</FieldDescription>
							</Field>
						)}
					</form.Field>
				</>
			) : null}

			{kybBase === "document" ? (
				<Field className="gap-1.5">
					<FieldLabel htmlFor="kyb-document-file">Business document</FieldLabel>
					<Input
						id="kyb-document-file"
						type="file"
						accept="image/jpeg,image/png,application/pdf"
						onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
					/>
				</Field>
			) : null}

			{kybBase === "document_purchase" ? (
				<>
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
					<form.Field name="requiredDocuments">
						{(field) => {
							const labels = documentLabels(
								session,
								form.state.values.country ||
									session.prefilled?.jurisdiction_code ||
									"",
							);
							if (labels.length === 0) {
								return null;
							}
							return (
								<Field className="gap-2">
									<FieldLabel>Documents to retrieve</FieldLabel>
									{labels.map((label) => (
										<div
											key={label}
											className="flex items-center gap-2"
										>
											<Checkbox
												id={`kyb-req-${label}`}
												checked={field.state.value.includes(label)}
												onCheckedChange={(checked) => {
													const next = new Set(field.state.value);
													if (checked === true) {
														next.add(label);
													} else {
														next.delete(label);
													}
													field.handleChange([...next]);
												}}
											/>
											<Label
												htmlFor={`kyb-req-${label}`}
												className="font-normal capitalize"
											>
												{label.replaceAll("_", " ")}
											</Label>
										</div>
									))}
								</Field>
							);
						}}
					</form.Field>
				</>
			) : null}

			<Button
				type="submit"
				disabled={mutation.isPending}
			>
				{mutation.isPending ? "Submitting..." : "Continue"}
			</Button>
		</form>
	);
}
