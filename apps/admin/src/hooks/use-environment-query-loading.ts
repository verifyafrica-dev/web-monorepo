import { useApiModeStore } from "#/stores/api-mode-store";

type QueryLike = {
	isPending?: boolean;
	isFetching?: boolean;
	isLoading?: boolean;
};

/**
 * True while Live↔Test switch is in flight, or while any of the given queries
 * are pending/fetching. Use for skeletons after environment switches.
 */
export function useEnvironmentQueryLoading(
	...queries: Array<QueryLike | boolean>
): boolean {
	const isEnvironmentSwitching = useApiModeStore(
		(state) => state.isEnvironmentSwitching,
	);
	if (isEnvironmentSwitching) return true;

	return queries.some((query) => {
		if (typeof query === "boolean") return query;
		return Boolean(
			query.isPending || query.isFetching || query.isLoading,
		);
	});
}
