import { useLayoutEffect, useRef, useState } from "react";

import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@verifyafrica/ui/components/ui/drawer";
import { Label } from "@verifyafrica/ui/components/ui/label";

type NewVerifyConsentProps = {
	onConsented: () => void;
};

export function NewVerifyConsent({ onConsented }: NewVerifyConsentProps) {
	const [hasConsented, setHasConsented] = useState(false);
	const [isConsentOpen, setIsConsentOpen] = useState(false);
	const hasConsentedRef = useRef(false);

	useLayoutEffect(() => {
		setIsConsentOpen(true);
	}, []);

	return (
		<Drawer
			open={isConsentOpen}
			dismissible={hasConsented}
			onOpenChange={(open) => {
				if (!open && !hasConsentedRef.current) {
					return;
				}

				setIsConsentOpen(open);
			}}
		>
			<DrawerContent className="data-[vaul-drawer-direction=bottom]:mx-auto data-[vaul-drawer-direction=bottom]:max-w-lg">
				<DrawerHeader className="px-5 text-left md:text-left">
					<DrawerTitle className="text-xl font-semibold">
						Let&apos;s verify your identity
					</DrawerTitle>
					<DrawerDescription className="sr-only">
						Consent to identity verification before continuing.
					</DrawerDescription>
				</DrawerHeader>
				<DrawerFooter className="gap-3 px-5 pt-0">
					<div className="flex items-start gap-3">
						<Checkbox
							id="new-verify-consent"
							checked={hasConsented}
							onCheckedChange={(checked) => {
								const consented = checked === true;
								hasConsentedRef.current = consented;
								setHasConsented(consented);

								if (consented) {
									setIsConsentOpen(false);
									onConsented();
								}
							}}
						/>

						<Label
							htmlFor="new-verify-consent"
							className="inline text-sm font-normal leading-5 text-foreground"
						>
							I consent to VerifyAfrica using and processing my personal and
							biometric data for service delivery, and I confirm that I&apos;m
							16 or older.{" "}
							<a
								href="https://verifyafrica.io/privacy"
								target="_blank"
								rel="noreferrer"
								className="whitespace-nowrap font-medium text-primary underline-offset-4 hover:underline"
							>
								Privacy Policy
							</a>
						</Label>
					</div>
					<p className="text-xs italic text-muted-foreground">
						Clicking the checkbox will initiate the verification process
					</p>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
