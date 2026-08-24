import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Separator } from "@verifyafrica/ui/components/ui/separator";

export function BusinessAmlScreeningInfoPanel() {
	return (
		<Card className="h-fit bg-muted/30">
			<CardContent className="flex flex-col gap-6 pt-0">
				<section className="space-y-4">
					<h2 className="text-sm font-semibold text-secondary">How It Works</h2>

					<div className="space-y-4">
						<div className="space-y-1.5">
							<p className="text-sm font-medium">Direct Mode</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Provide a business name and optional country filters to screen
								immediately against sanctions, PEP, fitness and probity, and
								adverse media datasets.
							</p>
						</div>

						<div className="space-y-1.5">
							<p className="text-sm font-medium">Link Mode</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Generate a hosted verification link and share it with the
								business so they can complete the screening through a hosted flow.
							</p>
						</div>
					</div>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Key Terms</h2>

					<div className="space-y-4">
						<div className="space-y-1">
							<p className="text-sm font-medium">Business Name</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								The registered or trading name of the business. Required for
								every request.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Match Score</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								A value from 0 to 100 that controls matching strictness. Higher
								scores apply tighter matching.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Screening Countries</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Optional ISO country codes used to narrow the scope. Leave empty
								to run a global screen.
							</p>
						</div>
					</div>
				</section>
			</CardContent>
		</Card>
	);
}
