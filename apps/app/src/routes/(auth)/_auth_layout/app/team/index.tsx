import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/_auth_layout/app/team/")({
	head: () => ({
		meta: [
			{ title: "Team | VerifyAfrica" },
			{ name: "description", content: "Manage your team members, access, and collaboration settings." },
		],
	}),
	beforeLoad: () => {
		throw redirect({ to: "/app/team/active-users" });
	},
});
