import {
	CarIcon,
	EyeIcon,
	IdentificationCardIcon,
	ImageIcon,
	LinkIcon,
	MagnifyingGlassIcon,
	VideoCameraIcon,
} from "@phosphor-icons/react";

import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Separator } from "@verifyafrica/ui/components/ui/separator";

export function AddressVerificationInfoPanel() {
	return (
		<Card className="h-fit bg-muted/30">
			<CardContent className="flex flex-col gap-6 pt-0">
				<section className="space-y-4">
					<h2 className="text-sm font-semibold text-secondary">How It Works</h2>

					<div className="space-y-4">
						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<LinkIcon className="size-4 text-secondary" />
								Link Mode
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								An onsite verification flow is sent to the customer so they
								can submit their own proof of address through a secure link.
							</p>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<MagnifyingGlassIcon className="size-4 text-secondary" />
								Direct Mode
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								You provide the customer&apos;s address and upload the
								proof-of-address document directly on their behalf.
							</p>
						</div>
					</div>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Verification Mode</h2>

					<div className="space-y-4">
						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<EyeIcon className="size-4 text-secondary" />
								Any
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Accepts both video and image liveness checks. The system picks
								the best available method.
							</p>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<VideoCameraIcon className="size-4 text-secondary" />
								Video
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Requires a short recorded video clip for higher confidence
								verification.
							</p>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<ImageIcon className="size-4 text-secondary" />
								Image
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Uses a selfie photograph for faster verification with lower
								confidence.
							</p>
						</div>
					</div>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Allowed Documents</h2>

					<div className="space-y-4">
						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<CarIcon className="size-4 text-secondary" />
								Drivers License
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Cross-references the address with the driver&apos;s license
								record.
							</p>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<IdentificationCardIcon className="size-4 text-secondary" />
								ID Document
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Cross-references the address against a national ID or passport
								record.
							</p>
						</div>
					</div>
				</section>
			</CardContent>
		</Card>
	);
}
