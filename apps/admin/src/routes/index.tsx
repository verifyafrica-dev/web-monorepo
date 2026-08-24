import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "Home | VerifyAfrica" },
			{ name: "description", content: "Enter the VerifyAfrica admin platform and continue to your workspace." },
		],
	}),
	beforeLoad: () => {
		throw redirect({ to: "/login", replace: true });
	},
});
