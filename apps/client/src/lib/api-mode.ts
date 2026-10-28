import { useQueryClient } from "@tanstack/react-query";
import type { ApiMode } from "@verifyafrica/config/domains";
import { toast } from "sonner";
import {
	apiModeConfig,
	useApiModeStore,
} from "#/stores/api-mode-store";
import { mintTestAccessToken } from "#/api/http/xhr";

export function useSwitchApiMode() {
	const queryClient = useQueryClient();
	const mode = useApiModeStore((state) => state.mode);
	const setMode = useApiModeStore((state) => state.setMode);
	const setTestAccessToken = useApiModeStore((state) => state.setTestAccessToken);
	const clearTestSession = useApiModeStore((state) => state.clearTestSession);

	async function switchApiMode(next: ApiMode) {
		if (!apiModeConfig.switcherEnabled) {
			toast.message("Environment switching is not available on this host.");
			return;
		}
		if (next === mode) return;

		if (next === "test") {
			try {
				const token = await mintTestAccessToken();
				setTestAccessToken(token);
				setMode("test");
				queryClient.clear();
				toast.success("Switched to Test mode");
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Could not enter Test mode.";
				toast.error(
					message.includes("not linked")
						? "Test mode is not linked for this account yet."
						: "Could not enter Test mode. Try again or contact support.",
				);
			}
			return;
		}

		clearTestSession();
		setMode("live");
		queryClient.clear();
		toast.success("Switched to Live mode");
	}

	return {
		mode,
		switchApiMode,
		switcherEnabled: apiModeConfig.switcherEnabled,
	};
}
