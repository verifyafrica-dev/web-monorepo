import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@verifyafrica/ui/components/ui/field";
import { VerificationConsentCheckbox } from "../../../-components/VerificationConsentCheckbox";
import {
	DEFAULT_VERIFICATION_URL_LIMIT,
	verificationConsentSchema,
} from "../../../-components/VerificationConsentCheckbox/data";
import { VerificationResultDialog } from "../../-components/verification-result-dialog";
import { useProductVerificationSubmit } from "../../-use-product-verification-submit";
import {
	buildCryptoWalletScreeningPayload,
	isValidWalletAddress,
} from "../-data";

const cryptoWalletScreeningFormSchema = z.object({
	email: z.email("Enter a valid email address"),
	walletAddress: z.string().trim().min(1, "Wallet address is required"),
	consent: verificationConsentSchema,
});

export function CryptoWalletScreeningForm() {
	const {
		submitVerification,
		linkResult,
		verificationResult,
		isResultDialogOpen,
		setIsResultDialogOpen,
		isSubmitting,
		handleStartNewVerification,
	} = useProductVerificationSubmit({
		errorMessage: "Failed to submit crypto wallet screening verification.",
	});

	const form = useForm({
		defaultValues: {
			email: "",
			walletAddress: "",
			consent: false,
		},
		validators: {
			onChange: cryptoWalletScreeningFormSchema,
			onSubmit: cryptoWalletScreeningFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (!isValidWalletAddress(value.walletAddress)) {
				toast.error("Enter a valid wallet address");
				return;
			}

			const submitted = await submitVerification(
				buildCryptoWalletScreeningPayload(value),
				{
					mode: "link",
					email: value.email,
					urlLimit: DEFAULT_VERIFICATION_URL_LIMIT,
				},
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
									<FieldLabel htmlFor="crypto-wallet-screening-email">
										Email Address
									</FieldLabel>
									<Input
										id="crypto-wallet-screening-email"
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

						<form.Field name="walletAddress">
							{(field) => (
								<Field className="gap-1.5">
									<FieldLabel htmlFor="crypto-wallet-screening-wallet-address">
										Wallet Address
									</FieldLabel>
									<Input
										id="crypto-wallet-screening-wallet-address"
										placeholder="Wallet Address"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<FieldDescription>
										Supported formats: EVM, Bitcoin, Tron, and Solana wallet
										addresses.
									</FieldDescription>
								</Field>
							)}
						</form.Field>
					</FieldGroup>

					<form.Field name="consent">
						{(field) => (
							<VerificationConsentCheckbox
								id="crypto-wallet-screening-consent"
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
				description="Your crypto wallet screening verification request was created successfully."
			/>
		</Card>
	);
}
