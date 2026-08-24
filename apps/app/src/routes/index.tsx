import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "Home | VerifyAfrica" },
			{ name: "description", content: "Enter VerifyAfrica and continue to your verification workspace." },
		],
	}),
	beforeLoad: () => {
		throw redirect({ to: "/login", replace: true });
	},
});
