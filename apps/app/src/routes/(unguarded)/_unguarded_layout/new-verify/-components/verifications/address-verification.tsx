import { MapPinIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";

import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";
import { useSubmitNewVerifyAddressV2Mutation } from "#/api/http/v2/verifications/new-verify/new-verify.hooks";
import type { NewVerifySession } from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";
import { uploadNewVerifyProofFile } from "@verifyafrica/api-client/lib/new-verify-proof-upload";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";
import { getCountryName } from "@verifyafrica/ui/lib/country-state-city";

import {
	IdDocumentCapture,
	type IdDocumentCaptureResult,
} from "./id-document-capture";
import { VerificationInstructionsDialog } from "./verification-instructions-dialog";
import { VerificationSubmittedDialog } from "./verification-submitted-dialog";

type AddressVerificationProps = {
	session: NewVerifySession;
};

export function AddressVerification({ session }: AddressVerificationProps) {
	const [step, setStep] = useState<"review" | "capture" | "submitted">(
		"review",
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const submitAddressMutation = useSubmitNewVerifyAddressV2Mutation();
	const verificationInstructions =
		session.collect?.verification_instructions?.trim() ?? "";
	const country = session.country ?? "";
	const fullAddress = session.full_address?.trim() ?? "";

	async function handleProofComplete(result: IdDocumentCaptureResult) {
		if (isSubmitting) {
			return;
		}

		setIsSubmitting(true);

		try {
			const proof = await uploadNewVerifyProofFile(
				session.token,
				result.front,
			);
			await submitAddressMutation.mutateAsync({
				token: session.token,
				payload: { proof },
			});
			setStep("submitted");
		} catch (error) {
			const axiosError = error as V2AxiosError;
			toast.error(
				axiosError.response?.data?.message ??
					(error instanceof Error
						? error.message
						: "Failed to submit verification"),
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			{verificationInstructions && step !== "submitted" ? (
				<VerificationInstructionsDialog
					instructions={verificationInstructions}
				/>
			) : null}
			{step === "submitted" ? <VerificationSubmittedDialog /> : null}

			{step === "capture" ? (
				<IdDocumentCapture
					country={country}
					title="Proof of address"
					requireBackside={false}
					isSubmitting={isSubmitting}
					allowFileUpload={session.allow_file_upload !== false}
					onBack={() => setStep("review")}
					onComplete={(result) => void handleProofComplete(result)}
				/>
			) : step === "submitted" ? (
				<div className="flex-1" />
			) : (
				<div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-6">
					<div className="space-y-2">
						<p className="text-base font-semibold text-foreground">
							Confirm the address to verify
						</p>
						<p className="text-sm text-muted-foreground">
							Capture or upload a recent utility bill, bank statement, or
							official document that shows this address.
						</p>
					</div>

					<div className="rounded-2xl border bg-muted/30 p-4">
						<div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
							<MapPinIcon className="size-4 text-primary" />
							Address on file
						</div>
						{country ? (
							<div className="mb-3">
								<CountryOptionLabel
									name={getCountryName(country) || country}
									countryCode={country}
									flagClassName="rounded-none"
								/>
							</div>
						) : null}
						<p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
							{fullAddress || "No address was provided for this verification."}
						</p>
					</div>

					<div className="flex justify-end">
						<Button
							type="button"
							className="rounded-full px-6"
							disabled={!fullAddress}
							onClick={() => setStep("capture")}
						>
							Continue
						</Button>
					</div>
				</div>
			)}
		</>
	);
}
