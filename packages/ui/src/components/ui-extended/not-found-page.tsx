import { WarningCircleIcon } from "@phosphor-icons/react";

import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

const SUPPORT_EMAIL = "support@verifyafrica.io";

type NotFoundPageProps = {
	ctaHref?: string;
	ctaLabel?: string;
};

export function NotFoundPage({
	ctaHref = "/login",
	ctaLabel = "Go to Login",
}: NotFoundPageProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#eef2f6] px-4 py-12">
			<Card className="w-full max-w-md shadow-lg">
				<CardContent className="flex flex-col items-center gap-4 p-6 text-center">
					<WarningCircleIcon
						className="size-14 text-[#024d4d]"
						weight="regular"
					/>

					<h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
						You Found This Page
					</h1>

					<p className="max-w-sm text-sm leading-relaxed text-muted-foreground md:text-base">
						But nothing exists here, contact{" "}
						<a
							href={`mailto:${SUPPORT_EMAIL}`}
							className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
						>
							support
						</a>{" "}
						if you need any help
					</p>

					<Button
						asChild
						className="mt-2 min-w-[160px] cursor-pointer"
					>
						<a href={ctaHref}>{ctaLabel}</a>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
