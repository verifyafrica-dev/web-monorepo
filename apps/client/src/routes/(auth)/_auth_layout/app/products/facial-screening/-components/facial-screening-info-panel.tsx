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
								The customer completes facial biometrics on a hosted capture
								page: camera liveness, or a file upload when you allow it.
							</p>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<MagnifyingGlassIcon className="size-4 text-secondary" />
								Direct Mode
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Upload a JPEG, PNG, or PDF (max 16MB) when you already have the
								customer&apos;s face proof.
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
								<ImageIcon className="size-4 text-secondary" />
								Image Only
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								The customer blinks, then we capture a still. File upload stays
								available when enabled on this product.
							</p>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<VideoCameraIcon className="size-4 text-secondary" />
								Video Only
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								The customer completes two random liveness actions on camera. File
								upload still follows the product setting.
							</p>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<EyeIcon className="size-4 text-secondary" />
								Age and duplicates
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Optional per-link age bounds use the estimated age from the face.
								Duplicate checks compare this face across other customers.
							</p>
						</div>
					</div>
				</section>
			</CardContent>
		</Card>
	);
}
