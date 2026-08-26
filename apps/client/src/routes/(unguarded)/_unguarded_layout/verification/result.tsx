import { CheckCircleIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";

export const Route = createFileRoute(
	"/(unguarded)/_unguarded_layout/verification/result",
)({
	head: () => ({
		meta: [
			{ title: "Verification Received | VerifyAfrica" },
			{
				name: "description",
				content:
					"Your verification has been received. You can close this page.",
			},
		],
	}),
	component: VerificationResultPage,
});

function VerificationResultPage() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-[#eef2f6] px-4 py-12">
			<Card className="w-full max-w-md shadow-lg">
				<CardContent className="flex flex-col items-center gap-4 p-6 text-center">
					<CheckCircleIcon
						className="size-14 text-[#024d4d]"
						weight="regular"
					/>

					<h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
						Verification Received
					</h1>

					<p className="max-w-sm text-sm leading-relaxed text-muted-foreground md:text-base">
						Your verification has been received successfully. You can now close
						this page.
					</p>

					<Button
						type="button"
						className="mt-2 min-w-[160px] cursor-pointer"
						onClick={() => window.close()}
					>
						Close Page
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
