import { createFileRoute } from "@tanstack/react-router";

import { MarketingRedirectNotice } from "./-marketing-redirect-notice";

export const Route = createFileRoute(
	"/(unguarded)/_unguarded_layout/new-verify/",
)({
	head: () => ({
		meta: [
			{ title: "Verification Link | VerifyAfrica" },
			{
				name: "description",
				content: "Complete identity verification with your VerifyAfrica link.",
			},
		],
	}),
	component: NewVerifyMissingTokenPage,
});

function NewVerifyMissingTokenPage() {
	return (
		<MarketingRedirectNotice
			title="No verification token was provided"
			description="This page needs a valid verification link."
		/>
	);
}
