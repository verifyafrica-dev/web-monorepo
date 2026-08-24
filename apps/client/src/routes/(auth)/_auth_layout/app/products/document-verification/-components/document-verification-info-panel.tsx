import { LinkIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";

import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Separator } from "@verifyafrica/ui/components/ui/separator";

export function DocumentVerificationInfoPanel() {
	return (
		<Card className="h-fit bg-muted/30">
			<CardContent className="flex flex-col gap-6 pt-0">
				<section className="space-y-4">
					<h2 className="text-sm font-semibold text-secondary">
						Verification Modes
					</h2>

					<div className="space-y-4">
						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<LinkIcon className="size-4 text-secondary" />
								Link Mode
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								A secure verification URL is sent to the customer&apos;s email.
								They capture their own document through the link, which expires
								based on the Verification URL Limit you set.
							</p>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center gap-2 text-sm font-medium">
								<MagnifyingGlassIcon className="size-4 text-secondary" />
								Direct Mode
							</div>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Upload the document image directly as a base64 proof. Use this
								when you already have the customer&apos;s identity document on
								hand.
							</p>
						</div>
					</div>
				</section>

				<Separator />

				<section className="space-y-4">
					<h2 className="text-sm font-semibold">Key Terms</h2>

					<div className="space-y-4">
						<div className="space-y-1">
							<p className="text-sm font-medium">Document Photo</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								A clear image of the identity document. Required only in Direct
								mode.
							</p>
						</div>

						<div className="space-y-1">
							<p className="text-sm font-medium">Verification URL Limit</p>
							<p className="text-sm leading-relaxed text-muted-foreground">
								How long the verification link stays active. Used only in Link
								mode.
							</p>
						</div>
					</div>
				</section>
			</CardContent>
		</Card>
	);
}
