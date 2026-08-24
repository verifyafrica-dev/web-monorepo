import { MagnifyingGlassIcon } from "@phosphor-icons/react";

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
							Direct Mode
						</div>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Submit the business name directly for an immediate KYB lookup
							without involving the customer in a separate hosted flow.
						</p>
					</div>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Key Terms</h2>

					<div className="space-y-4">
						<div className="space-y-1">
							<p className="text-sm font-medium">Business Jurisdiction</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								The jurisdiction where the company is registered. Select the
								exact jurisdiction code from the supported list.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Company Name</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								The registered company name. Required for KYB screening.
							</p>
						</div>
					</div>
				</section>
			</CardContent>
		</Card>
	);
}
