import { CheckCircleIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";

export const Route = createFileRoute(
	"/(unguarded)/_unguarded_layout/verify/result",
)({
	head: () => ({
		meta: [
			{ title: "Verification Result | VerifyAfrica" },
			{ name: "description", content: "Review the result of your submitted verification process." },
		],
	}),
	component: VerifyResultPage,
});

function VerifyResultPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(0,140,140,0.14),transparent_28%),linear-gradient(180deg,#f5fbfb_0%,#edf6f6_100%)] px-4 py-8">
			<Card className="w-full max-w-xl border-[rgba(2,77,77,0.12)] bg-white/95 text-center shadow-[0_24px_80px_rgba(10,37,64,0.12)]">
				<CardContent className="flex flex-col items-center gap-4 px-6 py-10 md:px-10 md:py-12">
					<CheckCircleIcon
						className="size-14 text-[#024d4d]"
						weight="regular"
					/>

					<h1 className="text-2xl font-bold text-[#0f2d2d] md:text-3xl">
						Verification Completed
					</h1>

					<p className="max-w-md text-sm leading-relaxed text-[#4b6b6b] md:text-base">
						Your verification flow has been completed successfully. You can now
						return to the app or close this page.
					</p>

					<Button
						type="button"
						className="mt-2 min-w-[180px] cursor-pointer rounded-full bg-[#024d4d] px-6 hover:bg-[#013a3a]"
						onClick={() => window.close()}
					>
						Close Page
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
