import {
	type UseQueryResult,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type {
	PresenceActiveSnapshot,
	PresenceActiveTenant,
	PresenceActiveUser,
	PresenceUpdatedEvent,
} from "@verifyafrica/api-client/http/v2/presence/presence.types";
import { PRESENCE_V2_API } from "./presence.api";

export const PRESENCE_V2_QUERY_KEYS = {
	all: ["presence-v2"] as const,
	activeUsers: ["presence-v2", "active", "users"] as const,
	activeTenants: ["presence-v2", "active", "tenants"] as const,
} as const;

export const usePresenceActiveUsersQuery = (): UseQueryResult<
	PresenceActiveSnapshot<PresenceActiveUser>
> =>
	useQuery({
		queryKey: PRESENCE_V2_QUERY_KEYS.activeUsers,
		queryFn: () => PRESENCE_V2_API.ACTIVE_USERS(),
		refetchInterval: 60_000,
	});

export const usePresenceActiveTenantsQuery = (): UseQueryResult<
	PresenceActiveSnapshot<PresenceActiveTenant>
> =>
	useQuery({
		queryKey: PRESENCE_V2_QUERY_KEYS.activeTenants,
		queryFn: () => PRESENCE_V2_API.ACTIVE_TENANTS(),
		refetchInterval: 60_000,
	});

export function usePresenceLiveInvalidation() {
	const queryClient = useQueryClient();

	return (event: PresenceUpdatedEvent) => {
		void queryClient.invalidateQueries({
			queryKey: PRESENCE_V2_QUERY_KEYS.all,
		});
		// Keep event referenced for future optimistic updates.
		void event;
	};
}
