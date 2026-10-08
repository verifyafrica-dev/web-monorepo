import { FileTextIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";

import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Separator } from "@verifyafrica/ui/components/ui/separator";

export function KybVerificationInfoPanel() {
	return (
		<Card className="h-fit bg-muted/30">
			<CardContent className="flex flex-col gap-6 pt-0">
				<section className="space-y-4">
					<h2 className="text-sm font-semibold text-secondary">How It Works</h2>
					<div className="space-y-1.5">
						<div className="flex items-center gap-2 text-sm font-medium">
							<MagnifyingGlassIcon className="size-4 text-secondary" />
							Link and direct
						</div>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Link mode sends the customer a hosted form. Direct mode submits
							the company details you already have.
						</p>
					</div>
					<div className="space-y-1.5">
						<div className="flex items-center gap-2 text-sm font-medium">
							<FileTextIcon className="size-4 text-secondary" />
							Three KYB bases
						</div>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Search looks up a company in official registries. Document checks
							an uploaded business proof. Document purchase retrieves official
							filings and posts the result to your webhook.
						</p>
					</div>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Coverage</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Search identifiers, document types, and purchase documents are
						filtered by jurisdiction. The API rejects combinations Shufti does
						not support, and unsupported fields are not forwarded.
					</p>
				</section>
			</CardContent>
		</Card>
	);
}
