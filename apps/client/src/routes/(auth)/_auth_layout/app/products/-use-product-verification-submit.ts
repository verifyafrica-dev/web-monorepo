import { useState } from "react";
import { toast } from "sonner";

import { useCreateVerificationRequestV2Mutation } from "#/api/http/v2/verifications/verifications.hooks";
import type {
	VerificationRequest,
	VerificationRequestCreatePayload,
} from "#/api/http/v2/verifications/verifications.types";
import type { V2AxiosError } from "#/api/http/shared";
import {
	buildLinkResult,
	type HostedLinkResult,
} from "#/lib/verification-links";

import { useCurrentTenant } from "../team/-data";

export type LinkSubmitOptions = {
	mode: "link";
	email: string;
	urlLimit: string;
};

export type DirectSubmitOptions = {
	mode: "direct" | "result";
};

type SubmitOptions = LinkSubmitOptions | DirectSubmitOptions;

type UseProductVerificationSubmitOptions = {
	errorMessage?: string;
};

export function useProductVerificationSubmit(
	options?: UseProductVerificationSubmitOptions,
) {
	const { tenantId } = useCurrentTenant();
	const createVerificationMutation = useCreateVerificationRequestV2Mutation();
	const [linkResult, setLinkResult] = useState<HostedLinkResult | null>(null);
	const [verificationResult, setVerificationResult] =
		useState<VerificationRequest | null>(null);
	const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);

	async function submitVerification(
		payload: VerificationRequestCreatePayload,
		submitOptions: SubmitOptions,
	) {
		if (!tenantId) {
			toast.error("No tenant selected.");
			return false;
		}

		try {
			const verification = await createVerificationMutation.mutateAsync({
				tenantId,
				payload,
			});

			if (submitOptions.mode === "link") {
				setLinkResult(
					buildLinkResult(
						verification,
						submitOptions.email,
						Number(submitOptions.urlLimit),
					),
				);
				setVerificationResult(null);
			} else {
				setVerificationResult(verification);
				setLinkResult(null);
			}

			setIsResultDialogOpen(true);
			return true;
		} catch (error) {
			const message = (error as V2AxiosError).response?.data?.message;
			toast.error(
				message ?? options?.errorMessage ?? "Failed to submit verification.",
			);
			return false;
		}
	}

	function handleStartNewVerification(onReset?: () => void) {
		setIsResultDialogOpen(false);
		setLinkResult(null);
		setVerificationResult(null);
		onReset?.();
	}

	return {
		submitVerification,
		linkResult,
		verificationResult,
		isResultDialogOpen,
		setIsResultDialogOpen,
		isSubmitting: createVerificationMutation.isPending,
		handleStartNewVerification,
	};
}
