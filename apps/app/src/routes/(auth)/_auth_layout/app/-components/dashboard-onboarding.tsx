import { ArrowRightIcon, CheckCircleIcon, ShieldCheckIcon, SparkleIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";

const UNLOCKED_FEATURES = [
	"Real-time identity verification",
	"API access with webhooks",
	"Advanced analytics dashboard",
	"Bulk verification processing",
] as const;

const panelText = "text-slate-700";
const panelMutedText = "text-slate-500";

export function DashboardOnboarding() {
	return (
		<section className="overflow-hidden rounded-2xl bg-[#1a4d47] p-6 shadow-lg sm:p-8">
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex items-start gap-4">
						<div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#2d6a62]">
							<SparkleIcon className="size-5 text-white" weight="fill" />
						</div>
						<div>
							<h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
								Welcome to VerifyAfrica!
							</h2>
							<p className="mt-1 text-sm text-slate-300">
								Let&apos;s get you started with identity verification services
							</p>
						</div>
					</div>
					<Badge className="w-fit border-[#3d8a80]/30 bg-[#d4f0ec] text-[#1a4d47] hover:bg-[#d4f0ec]">
						<span className="size-1.5 rounded-full bg-[#1a4d47]" />
						Getting Started
					</Badge>
				</div>

				<div
					className={`rounded-xl bg-[#f4f6f7] p-4 text-sm leading-relaxed sm:p-5 ${panelText}`}
				>
					<p>
						We&apos;re excited to have you on board! To start verifying
						identities and accessing our full suite of features, you&apos;ll
						need to complete a few quick steps. Our KYC verification process
						ensures platform security and compliance with regulatory standards.
					</p>
				</div>

				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<span className="h-5 w-1 rounded-full bg-[#3d8a80]" />
						<h3 className="text-base font-semibold text-white">Next Steps</h3>
					</div>

					<div className="flex flex-col gap-4 rounded-xl border border-[#e8dfc4] bg-[#faf8f0] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
						<div className="flex items-start gap-4">
							<div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
								<ShieldCheckIcon
									className="size-5 text-[#1a4d47]"
									weight="duotone"
								/>
							</div>
							<div className="space-y-1">
								<div className="flex flex-wrap items-center gap-2">
									<p className="font-semibold text-slate-900">
										Complete KYC Verification
									</p>
									<Badge className="border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-100">
										Required
									</Badge>
								</div>
								<p className={`text-sm ${panelMutedText}`}>
									Verify your business identity to unlock all platform features
								</p>
							</div>
						</div>
						<Button
							className="shrink-0 cursor-pointer bg-[#1a4d47] text-white hover:bg-[#235a54]"
							asChild
						>
							<Link to="/app/kyc">
								Start KYC
								<ArrowRightIcon className="size-4" weight="bold" />
							</Link>
						</Button>
					</div>
				</div>

				<div className={`rounded-xl bg-[#f4f6f7] p-4 sm:p-5 ${panelText}`}>
					<div className="flex items-center gap-2 text-sm font-semibold text-[#1a4d47]">
						<CheckCircleIcon
							className="size-4 text-[#3d8a80]"
							weight="fill"
						/>
						<span>What you&apos;ll unlock after verification:</span>
					</div>
					<ul className="mt-4 grid gap-3 sm:grid-cols-2">
						{UNLOCKED_FEATURES.map((feature) => (
							<li
								key={feature}
								className={`flex items-center gap-2 text-sm ${panelText}`}
							>
								<span className="size-1.5 shrink-0 rounded-full bg-[#3d8a80]" />
								{feature}
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}
