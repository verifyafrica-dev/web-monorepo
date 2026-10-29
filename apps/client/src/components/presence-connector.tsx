import { useEffect, useRef } from "react";
import Pusher, { type Channel } from "pusher-js";
import { PRESENCE_V2_API } from "#/api/http/v2/presence/presence.api";
import {
	collectPresenceDeviceInfo,
	createPresenceConnectionId,
} from "#/lib/presence-device";
import { useAuthStore } from "#/stores/auth-store";

type PresenceConnectorProps = {
	enabled: boolean;
};

export function PresenceConnector({ enabled }: PresenceConnectorProps) {
	const tenantId = useAuthStore((state) => state.selectedTenantId);
	const connectionIdRef = useRef<string>(createPresenceConnectionId());

	useEffect(() => {
		if (!enabled || typeof window === "undefined") {
			return;
		}

		let cancelled = false;
		let pusher: Pusher | null = null;
		let presenceChannel: Channel | null = null;

		const start = async () => {
			try {
				const config = await PRESENCE_V2_API.CONFIG();
				if (cancelled) return;

				const connectionId = connectionIdRef.current;
				const device = collectPresenceDeviceInfo();

				pusher = new Pusher(config.key, {
					cluster: config.cluster,
					authorizer: (channel) => ({
						authorize: (socketId, callback) => {
							PRESENCE_V2_API.PUSHER_AUTH({
								socket_id: socketId,
								channel_name: channel.name,
								connection_id: connectionId,
								app: "dashboard",
								tenant_id: tenantId,
								device,
							})
								.then((auth) => {
									callback(null, auth as never);
								})
								.catch((error) => {
									callback(
										error instanceof Error
											? error
											: new Error("Pusher auth failed"),
										null as never,
									);
								});
						},
					}),
				});

				presenceChannel = pusher.subscribe(config.presence_channel);
			} catch {
				// Presence is best-effort; ignore connect failures in UI.
			}
		};

		void start();

		return () => {
			cancelled = true;
			if (presenceChannel && pusher) {
				pusher.unsubscribe(presenceChannel.name);
			}
			pusher?.disconnect();
		};
	}, [enabled, tenantId]);

	return null;
}
