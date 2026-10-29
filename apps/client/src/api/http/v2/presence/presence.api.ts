import { unwrapV2Data } from "@verifyafrica/api-client/http/shared";
import type {
	PresenceApp,
	PresenceConfig,
	PresenceDeviceInfo,
} from "@verifyafrica/api-client/http/v2/presence/presence.types";
import $http from "../../xhr";

const PRESENCE_V2_ENDPOINTS = {
	config: "/v2/presence/config/",
	pusherAuth: "/v2/presence/pusher/auth/",
} as const;

export const PRESENCE_V2_API = {
	CONFIG: async (): Promise<PresenceConfig> => {
		const response = await $http.get(PRESENCE_V2_ENDPOINTS.config);
		return unwrapV2Data<PresenceConfig>(response);
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
