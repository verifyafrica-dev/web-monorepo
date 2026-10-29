import { useEffect, useRef } from "react";
import Pusher, { type Channel } from "pusher-js";
import type { PresenceUpdatedEvent } from "@verifyafrica/api-client/http/v2/presence/presence.types";
import { PRESENCE_V2_API } from "#/api/http/v2/presence/presence.api";
import { usePresenceLiveInvalidation } from "#/api/http/v2/presence/presence.hooks";
import {
	collectPresenceDeviceInfo,
	createPresenceConnectionId,
} from "#/lib/presence-device";

type PresenceConnectorProps = {
	enabled: boolean;
	listenForAdminUpdates?: boolean;
};

export function PresenceConnector({
	enabled,
	listenForAdminUpdates = false,
}: PresenceConnectorProps) {
	const invalidate = usePresenceLiveInvalidation();
	const connectionIdRef = useRef<string>(createPresenceConnectionId());

	useEffect(() => {
		if (!enabled || typeof window === "undefined") {
			return;
		}

		let cancelled = false;
		let pusher: Pusher | null = null;
		let presenceChannel: Channel | null = null;
		let adminChannel: Channel | null = null;

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
								app: "admin",
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

				if (listenForAdminUpdates && config.admin_channel) {
					adminChannel = pusher.subscribe(config.admin_channel);
					adminChannel.bind(
						"presence.updated",
						(payload: PresenceUpdatedEvent) => {
							invalidate(payload);
						},
					);
				}
			} catch {
				// Presence is best-effort; ignore connect failures in UI.
			}
		};

		void start();

		return () => {
			cancelled = true;
			if (adminChannel && pusher) {
				adminChannel.unbind("presence.updated");
				pusher.unsubscribe(adminChannel.name);
			}
			if (presenceChannel && pusher) {
				pusher.unsubscribe(presenceChannel.name);
			}
			pusher?.disconnect();
		};
	}, [enabled, invalidate, listenForAdminUpdates]);

	return null;
}
