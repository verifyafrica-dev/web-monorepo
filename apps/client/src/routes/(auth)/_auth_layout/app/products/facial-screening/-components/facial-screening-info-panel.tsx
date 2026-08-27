import {
	EyeIcon,
	ImageIcon,
	LinkIcon,
	MagnifyingGlassIcon,
	VideoCameraIcon,
} from "@phosphor-icons/react";

import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Separator } from "@verifyafrica/ui/components/ui/separator";
import { ProductFileUploadSettingSection } from "../../-components/product-file-upload-setting-section";

export function FacialScreeningInfoPanel() {
	return (
		<Card className="h-fit bg-muted/30">
			<CardContent className="flex flex-col gap-6 pt-0">
				<ProductFileUploadSettingSection verificationType="face_match" />

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold text-secondary">How It Works</h2>

					<div className="space-y-4">
						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<LinkIcon className="size-4 text-secondary" />
								Link Mode
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								A facial biometric verification flow is sent to the customer so
								they can complete the check themselves through a secure link.
							</p>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<MagnifyingGlassIcon className="size-4 text-secondary" />
								Direct Mode
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Upload a face photo directly for immediate verification when you
								already have the customer&apos;s image on hand.
							</p>
						</div>
					</div>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Face Verification Mode</h2>

					<div className="space-y-4">
						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<EyeIcon className="size-4 text-secondary" />
								Any
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Accepts both image and video. The system picks the best
								available method.
							</p>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<ImageIcon className="size-4 text-secondary" />
								Image Only
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Requires a selfie photograph. Faster verification with lower
								confidence.
							</p>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<VideoCameraIcon className="size-4 text-secondary" />
								Video Only
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Requires a short recorded video clip for higher confidence
								verification.
							</p>
						</div>
					</div>
				</section>
			</CardContent>
		</Card>
	);
}
