import {
	type ApiMode,
	type ApiModeConfig,
	getApiBaseUrlForMode,
	resolveApiModeConfig,
} from "@verifyafrica/config/domains";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { env } from "#/config/env";

export const apiModeConfig: ApiModeConfig = resolveApiModeConfig(
	env.apiBaseUrl ?? "",
	env.deployEnvironment,
	{
		liveApiBaseUrl: env.liveApiBaseUrl,
		testApiBaseUrl: env.testApiBaseUrl,
	},
);

type ApiModeStoreState = {
	mode: ApiMode;
	testAccessToken: string | null;
	/** True while Live↔Test switch is in flight (blocks UI + shows overlay). */
	isEnvironmentSwitching: boolean;
	/** Target mode while switching; null when idle. */
	environmentSwitchTarget: ApiMode | null;
};

type ApiModeStoreActions = {
	setMode: (mode: ApiMode) => void;
	setTestAccessToken: (token: string | null) => void;
	beginEnvironmentSwitch: (target: ApiMode) => void;
	endEnvironmentSwitch: () => void;
	getApiBaseUrl: () => string;
	clearTestSession: () => void;
};

export type ApiModeStore = ApiModeStoreState & ApiModeStoreActions;

export const useApiModeStore = create<ApiModeStore>()(
	persist(
		(set, get) => ({
			mode: apiModeConfig.defaultMode,
			testAccessToken: null,
			isEnvironmentSwitching: false,
			environmentSwitchTarget: null,
			setMode: (mode) => {
				if (!apiModeConfig.switcherEnabled && mode !== apiModeConfig.defaultMode) {
					return;
				}
				set({ mode });
			},
			setTestAccessToken: (token) => set({ testAccessToken: token }),
			beginEnvironmentSwitch: (target) =>
				set({
					isEnvironmentSwitching: true,
					environmentSwitchTarget: target,
				}),
			endEnvironmentSwitch: () =>
				set({
					isEnvironmentSwitching: false,
					environmentSwitchTarget: null,
				}),
			getApiBaseUrl: () => getApiBaseUrlForMode(get().mode, apiModeConfig),
			clearTestSession: () => set({ testAccessToken: null }),
		}),
		{
			name: "admin-api-mode-store",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				mode: apiModeConfig.switcherEnabled
					? state.mode
					: apiModeConfig.defaultMode,
			}),
			onRehydrateStorage: () => (state) => {
				if (!state) return;
				if (!apiModeConfig.switcherEnabled) {
					state.mode = apiModeConfig.defaultMode;
				}
				state.isEnvironmentSwitching = false;
				state.environmentSwitchTarget = null;
			},
		},
	),
);

export function getCurrentApiMode(): ApiMode {
	return useApiModeStore.getState().mode;
}

export function isTestApiMode(): boolean {
	return getCurrentApiMode() === "test";
}
