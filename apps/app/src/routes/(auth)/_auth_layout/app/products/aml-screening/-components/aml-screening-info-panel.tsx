import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Separator } from "@verifyafrica/ui/components/ui/separator";

export function AmlScreeningInfoPanel() {
	return (
		<Card className="h-fit bg-muted/30">
			<CardContent className="flex flex-col gap-6 pt-0">
				<section className="space-y-4">
					<h2 className="text-sm font-semibold text-secondary">How It Works</h2>

					<div className="space-y-4">
						<div className="space-y-1.5">
							<p className="text-sm font-medium">Direct Mode</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Screen a subject&apos;s full name and optional date of birth
								against global sanctions lists, PEP databases, and adverse media.
							</p>
						</div>

						<div className="space-y-1.5">
							<p className="text-sm font-medium">Link Mode</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Generate a hosted verification link and send it to the subject so
								they can complete the screening process themselves.
							</p>
						</div>
					</div>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Key Terms</h2>

					<div className="space-y-4">
						<div className="space-y-1">
							<p className="text-sm font-medium">Name</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								The full name of the individual or entity to screen.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Date of Birth</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								An optional field that narrows matching accuracy and reduces false
								positives.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Screening Countries</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								An optional list of ISO country codes to narrow the scope. Leave
								empty to run a global screen.
							</p>
						</div>
					</div>
				</section>
			</CardContent>
		</Card>
	);
}
