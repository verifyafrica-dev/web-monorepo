import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/_auth_layout/app/apikeys/")({
	beforeLoad: () => {
		throw redirect({
			to: "/app/webhooks",
		});
	},
});
