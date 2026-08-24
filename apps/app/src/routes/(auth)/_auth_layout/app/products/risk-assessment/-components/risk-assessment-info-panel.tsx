import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Separator } from "@verifyafrica/ui/components/ui/separator";

export function RiskAssessmentInfoPanel() {
	return (
		<Card className="h-fit bg-muted/30">
			<CardContent className="flex flex-col gap-6 pt-0">
				<section className="space-y-4">
					<h2 className="text-sm font-semibold text-secondary">How It Works</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Run an onsite risk assessment using a phone number and a configured
						check. Advanced settings let you tune risk score ranges and screening
						filters before submitting the request.
					</p>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Key Terms</h2>

					<div className="space-y-4">
						<div className="space-y-1">
							<p className="text-sm font-medium">Selected Check</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								A pre-configured risk check template that defines how the
								assessment is evaluated.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Risk Ranges</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Score bands from 0 to 100 that classify outcomes as low, medium,
								high, or prohibited.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Filters</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Screening datasets applied during the assessment, such as
								sanctions and PEP lists.
							</p>
						</div>
					</div>
				</section>
			</CardContent>
		</Card>
	);
}
