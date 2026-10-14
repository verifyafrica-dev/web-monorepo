import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Separator } from "@verifyafrica/ui/components/ui/separator";

export function RiskAssessmentInfoPanel() {
	return (
		<Card className="h-fit bg-muted/30">
			<CardContent className="flex flex-col gap-6 pt-0">
				<section className="space-y-4">
					<h2 className="text-sm font-semibold text-secondary">How It Works</h2>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Send the customer a Shufti-hosted questionnaire for the selected risk
						profile. Their answers are scored and the report shows the risk
						range, the score breakdown and every answer.
					</p>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Key Terms</h2>

					<div className="space-y-4">
						<div className="space-y-1">
							<p className="text-sm font-medium">Risk Profile</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								An industry questionnaire configured on Shufti, such as
								Gaming/Gambling or Banking/FinTech. Test credentials only
								accept test profiles.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Risk Range</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								The band the total score falls into: low, medium, high or
								prohibited. The thresholds are set on the profile in Shufti.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Link Only</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								There is no direct mode, because the score depends on the
								customer's own answers. Shufti may also ask for a quick face
								check.
							</p>
						</div>
					</div>
				</section>
			</CardContent>
		</Card>
	);
}
