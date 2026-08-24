import {
	BankIcon,
	GlobeHemisphereWestIcon,
	IdentificationCardIcon,
} from "@phosphor-icons/react";

import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Separator } from "@verifyafrica/ui/components/ui/separator";

export function GovernmentRegistryChecksInfoPanel() {
	return (
		<Card className="h-fit bg-muted/30">
			<CardContent className="flex flex-col gap-6 pt-0">
				<section className="space-y-4">
					<h2 className="text-sm font-semibold text-secondary">How It Works</h2>

					<div className="space-y-1.5">
						<div className="flex items-center gap-2 text-sm font-medium">
							<BankIcon className="size-4 text-secondary" />
							Government Registry Lookup
						</div>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Submit registry identifiers for Nigeria, South Africa, Ghana, or
							Kenya. VerifyAfrica queries the relevant government registry and
							returns structured identity or business records.
						</p>
					</div>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Required Inputs</h2>

					<div className="space-y-4">
						<div className="space-y-1">
							<p className="text-sm font-medium">Country & Verification Type</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Choose the country first, then pick the registry check available
								for that jurisdiction.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Registry Identifier</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								The primary document or registry number required for the selected
								check, such as BVN, NIN, SA ID, passport number, or CAC number.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Optional Validation</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								For supported checks, you can validate customer-provided names and
								date of birth against registry data, or include a selfie for
								facial matching.
							</p>
						</div>
					</div>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Supported Countries</h2>

					<div className="space-y-3">
						<div className="flex items-start gap-2 text-sm">
							<GlobeHemisphereWestIcon className="mt-0.5 size-4 text-secondary" />
							<p className="leading-relaxed text-muted-foreground">
								Nigeria, South Africa, Ghana, and Kenya. Available checks depend
								on your tenant&apos;s enabled countries.
							</p>
						</div>

						<div className="flex items-start gap-2 text-sm">
							<IdentificationCardIcon className="mt-0.5 size-4 text-secondary" />
							<p className="leading-relaxed text-muted-foreground">
								Verification types include BVN, NIN, passport, national ID, phone
								lookup, CAC, SSNIT, voter card, driver&apos;s license, and tax
								PIN checks.
							</p>
						</div>
					</div>
				</section>
			</CardContent>
		</Card>
	);
}
