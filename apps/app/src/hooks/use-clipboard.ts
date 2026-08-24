import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { copyToClipboard } from "#/lib/utils.ts";

type UseClipboardOptions = {
	successMessage?: string;
	errorMessage?: string;
	resetDelay?: number;
};

export function useClipboard({
	successMessage = "Copied to clipboard",
	errorMessage = "Failed to copy to clipboard",
	resetDelay = 2000,
}: UseClipboardOptions = {}) {
	const [copied, setCopied] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const copy = useCallback(
		async (text: string) => {
			if (!text) {
				return false;
			}

			const copiedSuccessfully = await copyToClipboard(text);

			if (copiedSuccessfully) {
				setCopied(true);
				toast.success(successMessage);

				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
				}

				timeoutRef.current = setTimeout(() => {
					setCopied(false);
				}, resetDelay);

				return true;
			}

			toast.error(errorMessage);
			return false;
		},
		[errorMessage, resetDelay, successMessage],
	);

	return { copied, copy };
}
