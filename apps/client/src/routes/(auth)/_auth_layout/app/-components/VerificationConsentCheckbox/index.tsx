import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
import { Label } from "@verifyafrica/ui/components/ui/label";

export function VerificationConsentCheckbox({
	id = "verification-consent",
	checked,
	onCheckedChange,
}: {
	id?: string;
	checked: boolean;
	onCheckedChange: (value: boolean) => void;
}) {
	return (
		<div className="flex items-start gap-3">
			<Checkbox
				id={id}
				checked={checked}
				onCheckedChange={(value) => onCheckedChange(value === true)}
			/>
			<Label
				htmlFor={id}
				className="-mt-1 inline text-sm font-normal text-muted-foreground"
			>
				By clicking &apos;Submit Verification&apos;, you acknowledge that you
				have gotten consent from the data subject to use their data for
				verification purposes on VerifyAfrica in accordance with our{" "}
				<a
					href="https://verifyafrica.io/privacy"
					target="_blank"
					rel="noreferrer"
					className="font-medium text-secondary underline-offset-4 hover:underline"
				>
					Privacy Policy
				</a>
				.
			</Label>
		</div>
	);
}
