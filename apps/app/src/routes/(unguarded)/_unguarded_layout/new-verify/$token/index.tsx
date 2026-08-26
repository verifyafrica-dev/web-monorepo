import { createFileRoute } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";

import { useNewVerifyTokenV2Query } from "#/api/http/v2/verifications/new-verify/new-verify.hooks";
import { NewVerifySessionView } from "../-components/new-verify-session";
import { MarketingRedirectNotice } from "../-marketing-redirect-notice";

const NEW_VERIFY_TOKEN_LENGTH = 36;

export const Route = createFileRoute(
	"/(unguarded)/_unguarded_layout/new-verify/$token/",
)({
	head: () => ({
		meta: [
			{ title: "Verification Session | VerifyAfrica" },
			{
				name: "description",
				content: "Complete identity verification with your VerifyAfrica link.",
			},
		],
	}),
	component: NewVerifyTokenPage,
});

function NewVerifyTokenPage() {
	const { token } = Route.useParams();
	const hasValidTokenLength = token.length === NEW_VERIFY_TOKEN_LENGTH;
	const sessionQuery = useNewVerifyTokenV2Query(token, hasValidTokenLength);

	if (!hasValidTokenLength) {
		return (
			<MarketingRedirectNotice
				title="This verification link is invalid"
				description="The link is not a valid verification token."
			/>
		);
	}

	if (sessionQuery.isLoading) {
		return (
			<div className="flex min-h-dvh items-center justify-center">
				<Loader2Icon className="size-8 animate-spin text-primary" />
			</div>
		);
	}

	if (sessionQuery.isError || !sessionQuery.data) {
		return (
			<MarketingRedirectNotice
				title="This verification link has expired"
				description="The link is invalid or is no longer active."
			/>
		);
	}

	const session = sessionQuery.data;

	return <NewVerifySessionView session={session} />;
}
