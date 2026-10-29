import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { ApiMode } from "@verifyafrica/config/domains";
import { toast } from "sonner";
import {
	apiModeConfig,
	useApiModeStore,
} from "#/stores/api-mode-store";
import { mintTestAccessToken } from "#/api/http/xhr";
import { isTestAccountBlockedError } from "#/lib/test-account-blocked";

export type SwitchApiModeResult =
	| { ok: true }
	| { ok: false; reason: "blocked" | "error" | "unavailable" };

/**
 * Entity-id routes are environment-specific. After Live↔Test switch, leave them
 * for the nearest list page so the twin env is not asked for a foreign id.
 */
export function resolveEnvSwitchSafePath(pathname: string): string | null {
	const path = pathname.replace(/\/+$/, "") || "/";

	if (/^\/app\/tenants\/[^/]+$/.test(path)) {
		return "/app/tenants";
	}

	return null;
}

export function useSwitchApiMode() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const mode = useApiModeStore((state) => state.mode);
	const setMode = useApiModeStore((state) => state.setMode);
	const setTestAccessToken = useApiModeStore((state) => state.setTestAccessToken);
	const clearTestSession = useApiModeStore((state) => state.clearTestSession);

	async function leaveEntityIdRouteIfNeeded() {
		const safePath = resolveEnvSwitchSafePath(pathname);
		if (safePath) {
			await navigate({ to: safePath, replace: true });
		}
	}

	async function switchApiMode(next: ApiMode): Promise<SwitchApiModeResult> {
		if (!apiModeConfig.switcherEnabled) {
			toast.message("Environment switching is not available on this host.");
			return { ok: false, reason: "unavailable" };
		}
		if (next === mode) return { ok: true };

		if (next === "test") {
			try {
				const token = await mintTestAccessToken();
				setTestAccessToken(token);
				setMode("test");
				// Mode is part of query keys — invalidate active queries instead of
				// clear(), which can leave observers stuck in a pending skeleton state.
				await queryClient.invalidateQueries({ type: "active" });
				await leaveEntityIdRouteIfNeeded();
				toast.success("Switched to Test mode");
				return { ok: true };
			} catch (error) {
				clearTestSession();
				setMode(apiModeConfig.defaultMode);
				if (isTestAccountBlockedError(error)) {
					return { ok: false, reason: "blocked" };
				}
				const data =
					error && typeof error === "object" && "response" in error
						? (error as { response?: { data?: { message?: string; detail?: string } } })
								.response?.data
						: undefined;
				const message =
					data?.message ||
					data?.detail ||
					(error instanceof Error ? error.message : "") ||
					"Could not enter Test mode. Ensure this admin account is linked on test.";
				toast.error(
					message.toLowerCase().includes("not linked")
						? "Test mode is not linked for this account yet."
						: message,
				);
				return { ok: false, reason: "error" };
			}
		}

		clearTestSession();
		setMode("live");
		await queryClient.invalidateQueries({ type: "active" });
		await leaveEntityIdRouteIfNeeded();
		toast.success("Switched to Live mode");
		return { ok: true };
	}

	return {
		mode,
		switchApiMode,
		switcherEnabled: apiModeConfig.switcherEnabled,
	};
}
