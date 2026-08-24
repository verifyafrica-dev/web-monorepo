import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { UserDetail } from "#/api/http/v2/users/users.types";

type AuthStoreState = {
	access_token: string | null;
	// refresh_token: string | null;
	user: UserDetail | null;
	selectedTenantId: string | null;
};

type AuthStoreActions = {
	setAccessToken: (token: string) => void;
	// setRefreshToken: (token: string) => void;
	setTokens: (tokens: { access_token: string; refresh_token: string }) => void;
	setUser: (user: UserDetail | null) => void;
	setSelectedTenantId: (tenantId: string | null) => void;
	clearAuth: () => void;
};

export type AuthStore = AuthStoreState & AuthStoreActions;

// const emptyStorage: StateStorage = {
// 	getItem: () => null,
// 	setItem: () => undefined,
// 	removeItem: () => undefined,
// };

// const storage = createJSONStorage<AuthStore>(() =>
// 	typeof window !== "undefined" ? localStorage : emptyStorage,
// );

const initialState: AuthStoreState = {
	access_token: null,
	// refresh_token: null,
	user: null,
	selectedTenantId: null,
};

export const useAuthStore = create<AuthStore>()(
	persist(
		(set) => ({
			...initialState,
			setAccessToken: (token) => set({ access_token: token }),
			// setRefreshToken: (token) => set({ refresh_token: token }),
			setTokens: ({ access_token }) =>
				set({ access_token }),
			setUser: (user) => set({ user }),
			setSelectedTenantId: (tenantId) => set({ selectedTenantId: tenantId }),
			clearAuth: () => set(initialState),
		}),
		{
			name: "auth-store",
			storage: createJSONStorage<AuthStore>(() => localStorage),
		},
	),
);
