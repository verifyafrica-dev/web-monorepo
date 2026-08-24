import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "VerifyAfrica" },
			{
				name: "description",
				content: "Complete your identity verification with your VerifyAfrica link.",
			},
		],
	}),
	beforeLoad: () => {
		throw redirect({ to: "/new-verify", replace: true });
	},
});
