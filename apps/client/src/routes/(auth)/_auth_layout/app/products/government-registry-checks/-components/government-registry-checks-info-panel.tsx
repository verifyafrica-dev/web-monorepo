import {
	BankIcon,
	GlobeHemisphereWestIcon,
	IdentificationCardIcon,
	LinkIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react";

import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Separator } from "@verifyafrica/ui/components/ui/separator";
import { ProductFileUploadSettingSection } from "../../-components/product-file-upload-setting-section";
import { registryTypeSupportsSelfie } from "../-data";

type GovernmentRegistryChecksInfoPanelProps = {
	verificationType?: string;
};

export function GovernmentRegistryChecksInfoPanel({
	verificationType = "",
}: GovernmentRegistryChecksInfoPanelProps) {
	const showFileUploadSetting =
		Boolean(verificationType) && registryTypeSupportsSelfie(verificationType);

	return (
		<Card className="h-fit bg-muted/30">
			<CardContent className="flex flex-col gap-6 pt-0">
				{showFileUploadSetting ? (
					<>
						<ProductFileUploadSettingSection
							verificationType={verificationType}
						/>
						<Separator />
					</>
				) : null}

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
					<h2 className="text-sm font-semibold">Verification modes</h2>

					<div className="space-y-3">
						<div className="flex items-start gap-2 text-sm">
							<LinkIcon className="mt-0.5 size-4 shrink-0 text-secondary" />
							<div className="space-y-1">
								<p className="font-medium">Link mode</p>
								<p className="leading-relaxed text-muted-foreground">
									Send a hosted link to your customer. Prefill registry fields
									to lock them; the customer completes the rest. Billing runs
									when the check is submitted to the registry provider.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-2 text-sm">
							<MagnifyingGlassIcon className="mt-0.5 size-4 shrink-0 text-secondary" />
							<div className="space-y-1">
								<p className="font-medium">Direct mode</p>
								<p className="leading-relaxed text-muted-foreground">
									Run the check immediately with the details you enter here.
									Results return asynchronously while provider work runs in the
									background.
								</p>
							</div>
						</div>
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
								The primary document or registry number required for the
								selected check, such as BVN, NIN, SA ID, passport number, or CAC
								number.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Optional Validation</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								For supported checks, you can validate customer-provided names
								and date of birth against registry data, or include a selfie for
								facial matching. Required fields are marked with * on the hosted
								link.
							</p>
						</div>
					</div>
				</section>
			</CardContent>
		</Card>
	);
}
