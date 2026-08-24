import { createFileRoute } from "@tanstack/react-router";

import { NotFoundPage } from "#/components/not-found-page";

export const Route = createFileRoute("/$")({
	head: () => ({
		meta: [
			{ title: "Page Not Found | VerifyAfrica" },
			{
				name: "description",
				content: "This page does not exist. Contact support if you need help.",
			},
		],
	}),
	component: NotFoundPage,
});
