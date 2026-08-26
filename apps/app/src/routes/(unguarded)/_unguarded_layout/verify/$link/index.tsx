import { createFileRoute } from "@tanstack/react-router";

import { useVerificationLinkDetailV2Query } from "#/api/http/v2/verifications/verifications.hooks";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@verifyafrica/ui/components/ui/alert";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Spinner } from "@verifyafrica/ui/components/ui/spinner";

export const Route = createFileRoute(
	"/(unguarded)/_unguarded_layout/verify/$link/",
)({
	head: () => ({
		meta: [
			{ title: "Verification Link | VerifyAfrica" },
			{
				name: "description",
				content:
					"Complete identity verification securely using your unique link.",
			},
		],
	}),
	component: VerifyLinkPage,
});

function VerifyLinkPage() {
	const { link } = Route.useParams();
	const linkQuery = useVerificationLinkDetailV2Query(link, Boolean(link));
	const verificationLink = linkQuery.data;
	const iframeTitle = verificationLink?.verification_reference
		? `Verification ${verificationLink.verification_reference}`
		: "Verification link";

	return (
		<div className="flex-1 bg-[radial-gradient(circle_at_top_left,rgba(0,140,140,0.14),transparent_28%),linear-gradient(180deg,#f5fbfb_0%,#edf6f6_100%)] px-4 py-6 md:px-8 md:py-8">
			<div className="mx-auto flex max-w-7xl flex-col gap-6">
				<Card className="border-[rgba(2,77,77,0.12)] bg-white/90 shadow-[0_18px_60px_rgba(10,37,64,0.08)] backdrop-blur-xl">
					<CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
						<div className="flex items-center gap-4">
							<img
								src="/assets/brand/logo.svg"
								alt="VerifyAfrica"
								className="h-12 w-auto"
							/>
							<div>
								<p className="text-xs font-medium tracking-[0.12em] text-[#4b6b6b] uppercase">
									VerifyAfrica
								</p>
								<h1 className="text-xl font-bold text-[#0f2d2d] md:text-2xl">
									Secure Verification Session
								</h1>
								{verificationLink?.verification_reference ? (
									<p className="font-semibold text-[#163434]">
										Reference: {verificationLink.verification_reference}
									</p>
								) : null}
							</div>
						</div>

						{verificationLink?.inner_link ? (
							<p className="font-mono text-sm text-[#537171]">
								Token: {verificationLink.link}
							</p>
						) : null}
					</CardContent>
				</Card>

				{linkQuery.isLoading ? (
					<Card className="min-h-[420px] border-[rgba(2,77,77,0.12)] bg-white/90">
						<CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-3 pt-6">
							<Spinner className="size-8 text-[#024d4d]" />
							<p className="text-sm text-[#345454]">
								Loading verification session...
							</p>
						</CardContent>
					</Card>
				) : null}

				{!linkQuery.isLoading &&
				(linkQuery.isError || !verificationLink?.inner_link) ? (
					<Alert variant="destructive">
						<AlertTitle>Verification link unavailable</AlertTitle>
						<AlertDescription>
							This verification link is invalid, unavailable, or has already
							expired.
						</AlertDescription>
					</Alert>
				) : null}

				{!linkQuery.isLoading && verificationLink?.inner_link ? (
					<Card className="overflow-hidden border-[rgba(2,77,77,0.12)] bg-white shadow-[0_24px_80px_rgba(10,37,64,0.12)]">
						<div className="min-h-[640px] pt-8 [height:calc(100vh-220px)]">
							<iframe
								src={verificationLink.inner_link}
								title={iframeTitle}
								className="size-full border-0"
								allow="camera; microphone; fullscreen"
								referrerPolicy="strict-origin-when-cross-origin"
							/>
						</div>
					</Card>
				) : null}
			</div>
		</div>
	);
}
