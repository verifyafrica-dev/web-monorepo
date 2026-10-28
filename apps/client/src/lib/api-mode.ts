import { useQueryClient } from "@tanstack/react-query";
import type { ApiMode } from "@verifyafrica/config/domains";
import type {
	UserSession,
	UserTenantMembership,
} from "@verifyafrica/api-client/http/v2/users/users.types";
import { toast } from "sonner";
import { USERS_V2_API } from "#/api/http/v2/users/users.api";
import { mintTestAccessToken } from "#/api/http/xhr";
import {
	apiModeConfig,
	useApiModeStore,
} from "#/stores/api-mode-store";
import { useAuthStore } from "#/stores/auth-store";
import { normalizeUserTenants } from "#/routes/(auth)/_auth_layout/app/team/-data";

function normalizeEmail(value: string | null | undefined): string {
	return (value ?? "").trim().toLowerCase();
}

function resolveTwinTenantId(
	previousTenants: UserTenantMembership[],
	previousTenantId: string | null,
	nextTenants: UserTenantMembership[],
): string | null {
	if (nextTenants.length === 0) return null;

	const previous =
		previousTenants.find((tenant) => tenant.id === previousTenantId) ??
		previousTenants[0];

	if (previous?.environment_link_id) {
		const byLink = nextTenants.find(
			(tenant) =>
				tenant.environment_link_id &&
				tenant.environment_link_id === previous.environment_link_id,
		);
		if (byLink) return byLink.id;
	}

	const previousEmail = normalizeEmail(previous?.email);
	if (previousEmail) {
		const byEmail = nextTenants.find(
			(tenant) => normalizeEmail(tenant.email) === previousEmail,
		);
		if (byEmail) return byEmail.id;
	}

	const byName = previous?.name
		? nextTenants.find(
				(tenant) =>
					tenant.name.trim().toLowerCase() === previous.name.trim().toLowerCase(),
			)
		: undefined;
	if (byName) return byName.id;

	return nextTenants[0]?.id ?? null;
}

async function syncAuthSessionForActiveMode() {
	const previousTenantId = useAuthStore.getState().selectedTenantId;
	const previousTenants = normalizeUserTenants(
		useAuthStore.getState().user?.tenants ?? null,
	);

	const me: UserSession = await USERS_V2_API.ME();
	const nextTenants = me.tenants ?? [];

	useAuthStore.getState().setUser({
		...me,
		phone_number: me.phone_number ?? undefined,
		tenants: nextTenants,
		created_at: useAuthStore.getState().user?.created_at ?? "",
	});
	useAuthStore
		.getState()
		.setSelectedTenantId(
			resolveTwinTenantId(previousTenants, previousTenantId, nextTenants),
		);
}

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

		const authStore = useAuthStore.getState();
		const previousTenantId = authStore.selectedTenantId;
		const previousTenants = normalizeUserTenants(authStore.user?.tenants ?? null);

		if (next === "test") {
			try {
				const token = await mintTestAccessToken();
				// Pause tenant-scoped queries before flipping the API base URL so we
				// never hit Test with a Live tenant id (and never wipe good cache via clear()).
				authStore.setSelectedTenantId(null);
				setTestAccessToken(token);
				setMode("test");

				const me: UserSession = await USERS_V2_API.ME();
				const nextTenants = me.tenants ?? [];
				authStore.setUser({
					...me,
					phone_number: me.phone_number ?? undefined,
					tenants: nextTenants,
					created_at: authStore.user?.created_at ?? "",
				});
				authStore.setSelectedTenantId(
					resolveTwinTenantId(previousTenants, previousTenantId, nextTenants),
				);

				await queryClient.invalidateQueries({ type: "active" });
				toast.success("Switched to Test mode");
			} catch (error) {
				clearTestSession();
				setMode(apiModeConfig.defaultMode);
				authStore.setSelectedTenantId(previousTenantId);
				const data =
					error &&
					typeof error === "object" &&
					"response" in error
						? (error as { response?: { data?: { message?: string; detail?: string } } })
								.response?.data
						: undefined;
				const message =
					data?.message ||
					data?.detail ||
					(error instanceof Error ? error.message : "") ||
					"Could not enter Test mode. Try again or contact support.";
				toast.error(
					message.toLowerCase().includes("not linked")
						? "Test mode is not linked for this account yet."
						: message,
				);
			}
			return;
		}

		authStore.setSelectedTenantId(null);
		clearTestSession();
		setMode("live");
		try {
			await syncAuthSessionForActiveMode();
		} catch {
			authStore.setSelectedTenantId(
				resolveTwinTenantId(
					previousTenants,
					previousTenantId,
					normalizeUserTenants(authStore.user?.tenants ?? null),
				) ?? previousTenantId,
			);
		}
		await queryClient.invalidateQueries({ type: "active" });
		toast.success("Switched to Live mode");
	}

	return {
		mode,
		switchApiMode,
		switcherEnabled: apiModeConfig.switcherEnabled,
	};
}
