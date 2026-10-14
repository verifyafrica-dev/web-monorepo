import { MagnifyingGlassIcon, ShieldCheckIcon } from "@phosphor-icons/react";

import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Separator } from "@verifyafrica/ui/components/ui/separator";

export function CryptoWalletScreeningInfoPanel() {
	return (
		<Card className="h-fit bg-muted/30">
			<CardContent className="flex flex-col gap-6 pt-0">
				<section className="space-y-4">
					<h2 className="text-sm font-semibold text-secondary">How It Works</h2>

					<div className="space-y-1.5">
						<div className="flex items-center gap-2 text-sm font-medium">
							<ShieldCheckIcon className="size-4 text-secondary" />
							Wallet Screening
						</div>
						<p className="text-sm leading-relaxed text-muted-foreground">
							The wallet address is checked against sanctions, warning and watch
							lists. Any linked entity is returned as a potential match with its
							sources, aliases and associates.
						</p>
					</div>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Required Inputs</h2>

					<div className="space-y-4">
						<div className="space-y-1">
							<p className="text-sm font-medium">Email Address</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								The email the screening request is recorded against.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Wallet Address</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								The address being screened. It is submitted as the{" "}
								<code className="rounded bg-muted px-1 py-0.5 text-xs">
									background_checks.name.full_name
								</code>{" "}
								value in the provider payload.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Screening Filters</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Fixed filters for this product: sanctions, warning,
								fitness-probity, SIP, SIE, Insolvency, PEP, and PEP Class 1.
							</p>
						</div>
					</div>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Mode</h2>

					<div className="space-y-1.5">
						<div className="flex items-center gap-2 text-sm font-medium">
							<MagnifyingGlassIcon className="size-4 text-secondary" />
							Direct Mode
						</div>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Screens the wallet immediately with no customer interaction. The
							result is ready on the report within seconds.
						</p>
					</div>
				</section>
			</CardContent>
		</Card>
	);
}
