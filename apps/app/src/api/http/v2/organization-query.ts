import { useAuthStore } from "#/stores/auth-store";

/** Subscribe to the current organization id (triggers re-render on switch). */
function useOrganizationId(): string | null {
	return useAuthStore((state) => state.selectedTenantId);
}

/** Append organization id for mutation cache updates (imperative). */
export function withOrganizationId<T extends readonly unknown[]>(
	queryKey: T,
): [...T, string | null] {
	return [...queryKey, useAuthStore.getState().selectedTenantId ?? null];
}

/** Append organization id for useQuery keys (reactive to org switch). */
export function useOrganizationQueryKey<T extends readonly unknown[]>(
	queryKey: T,
): [...T, string | null] {
	const organizationId = useOrganizationId();
	return [...queryKey, organizationId];
}
