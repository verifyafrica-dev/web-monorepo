import type { ApiMode } from "@verifyafrica/config/domains";
import { useAuthStore } from "#/stores/auth-store";
import { getCurrentApiMode, useApiModeStore } from "#/stores/api-mode-store";

/** Subscribe to the current organization id (triggers re-render on switch). */
function useOrganizationId(): string | null {
	return useAuthStore((state) => state.selectedTenantId);
}

/** Append api mode + organization id for mutation cache updates (imperative). */
export function withOrganizationId<T extends readonly unknown[]>(
	queryKey: T,
): [ApiMode, ...T, string | null] {
	return [
		getCurrentApiMode(),
		...queryKey,
		useAuthStore.getState().selectedTenantId ?? null,
	];
}

/** Append api mode + organization id for useQuery keys (reactive to mode/org). */
export function useOrganizationQueryKey<T extends readonly unknown[]>(
	queryKey: T,
): [ApiMode, ...T, string | null] {
	const mode = useApiModeStore((state) => state.mode);
	const organizationId = useOrganizationId();
	return [mode, ...queryKey, organizationId];
}
