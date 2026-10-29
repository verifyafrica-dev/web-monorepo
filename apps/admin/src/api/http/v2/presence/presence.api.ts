import { unwrapV2Data } from "@verifyafrica/api-client/http/shared";
import type {
	PresenceActiveSnapshot,
	PresenceActiveTenant,
	PresenceActiveUser,
	PresenceApp,
	PresenceConfig,
	PresenceDeviceInfo,
} from "@verifyafrica/api-client/http/v2/presence/presence.types";
import $http from "../../xhr";

const PRESENCE_V2_ENDPOINTS = {
	config: "/v2/presence/config/",
	active: "/v2/presence/active/",
	pusherAuth: "/v2/presence/pusher/auth/",
} as const;

export const PRESENCE_V2_API = {
	CONFIG: async (): Promise<PresenceConfig> => {
		const response = await $http.get(PRESENCE_V2_ENDPOINTS.config);
		return unwrapV2Data<PresenceConfig>(response);
	},
	ACTIVE_USERS: async (): Promise<PresenceActiveSnapshot<PresenceActiveUser>> => {
		const response = await $http.get(PRESENCE_V2_ENDPOINTS.active, {
			params: { tab: "users" },
		});
		return unwrapV2Data<PresenceActiveSnapshot<PresenceActiveUser>>(response);
	},
	ACTIVE_TENANTS: async (): Promise<
		PresenceActiveSnapshot<PresenceActiveTenant>
	> => {
		const response = await $http.get(PRESENCE_V2_ENDPOINTS.active, {
			params: { tab: "tenants" },
		});
		return unwrapV2Data<PresenceActiveSnapshot<PresenceActiveTenant>>(response);
	},
	PUSHER_AUTH: async (payload: {
		socket_id: string;
		channel_name: string;
		connection_id?: string;
		app?: PresenceApp;
		tenant_id?: string | null;
		device?: PresenceDeviceInfo;
	}) => {
		const response = await $http.post(PRESENCE_V2_ENDPOINTS.pusherAuth, payload);
		return response.data as Record<string, unknown>;
	},
};
