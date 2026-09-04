import { useState } from "react";
import { toast } from "sonner";

import type { V2AxiosError } from "@verifyafrica/api-client/http/shared";
import { useSubmitNewVerifyFaceV2Mutation } from "#/api/http/v2/verifications/new-verify/new-verify.hooks";
import type { NewVerifySession } from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";
import { uploadNewVerifyProofFile } from "@verifyafrica/api-client/lib/new-verify-proof-upload";

import { VerificationInstructionsDialog } from "../verification-instructions-dialog";
import { VerificationSubmittedDialog } from "../verification-submitted-dialog";
import { FacialCapture } from "./facial-capture";
import { FacialReadyInstructions } from "./facial-ready-instructions";

type FacialBiometricsVerificationProps = {
	session: NewVerifySession;
};

function resolveFaceMode(
	value: NewVerifySession["face_verification_mode"],
): "image_only" | "video_only" {
	return value === "video_only" ? "video_only" : "image_only";
}

export function FacialBiometricsVerification({
	session,
}: FacialBiometricsVerificationProps) {
	const [step, setStep] = useState<"ready" | "capture" | "submitted">("ready");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const submitFaceMutation = useSubmitNewVerifyFaceV2Mutation();
	const verificationInstructions =
		session.collect?.verification_instructions?.trim() ?? "";
	const verificationMode = resolveFaceMode(session.face_verification_mode);
	const allowFileUpload = session.allow_file_upload !== false;

	async function handleComplete(file: File) {
		if (isSubmitting) {
			return;
		}

		setIsSubmitting(true);
		try {
			const proof = await uploadNewVerifyProofFile(session.token, file);
			await submitFaceMutation.mutateAsync({
				token: session.token,
				payload: { proof },
			});
			setStep("submitted");
		} catch (error) {
			const message = (error as V2AxiosError).response?.data?.message;
			toast.error(message ?? "Failed to submit facial verification.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			{verificationInstructions ? (
				<VerificationInstructionsDialog instructions={verificationInstructions} />
			) : null}
			{step === "ready" ? (
				<FacialReadyInstructions
					verificationMode={verificationMode}
					onContinue={() => setStep("capture")}
				/>
			) : null}
			{step === "capture" ? (
				<FacialCapture
					verificationMode={verificationMode}
					allowFileUpload={allowFileUpload}
					isSubmitting={isSubmitting}
					onComplete={handleComplete}
				/>
			) : null}
			{step === "submitted" ? (
				<VerificationSubmittedDialog description="We've received your face capture. You can close this page now." />
			) : null}
		</>
	);
}
