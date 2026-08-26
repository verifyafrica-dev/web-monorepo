import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";

const SUPPORT_EMAIL = "support@verifyafrica.io";

type MarketingRedirectNoticeProps = {
	title: string;
	description: string;
};

export function MarketingRedirectNotice({
	title,
	description,
}: MarketingRedirectNoticeProps) {
	return (
		<div className="flex min-h-dvh items-center justify-center px-4">
			<Card className="w-full max-w-lg border-[rgba(2,77,77,0.12)] bg-white/90 shadow-[0_18px_60px_rgba(10,37,64,0.08)]">
				<CardContent className="flex flex-col items-center gap-4 py-8 text-center">
					<img
						src="/assets/brand/logo.svg"
						alt="VerifyAfrica"
						className="h-12 w-auto"
					/>
					<div className="space-y-2">
						<h1 className="text-xl font-bold text-[#0f2d2d]">{title}</h1>
						<p className="text-sm text-[#345454]">{description}</p>
						<p className="text-sm text-[#345454]">
							If this issue persists, kindly reach out to{" "}
							<a
								href={`mailto:${SUPPORT_EMAIL}`}
								className="font-medium text-[#0f2d2d] underline underline-offset-4 hover:text-primary"
							>
								{SUPPORT_EMAIL}
							</a>
							.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
