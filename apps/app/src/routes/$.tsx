import { createFileRoute } from "@tanstack/react-router";

import { NotFoundPage } from "@verifyafrica/ui/components/ui-extended/not-found-page";

function AppNotFoundPage() {
	return <NotFoundPage ctaHref="/" ctaLabel="Go to Verification" />;
}

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
	component: AppNotFoundPage,
});
