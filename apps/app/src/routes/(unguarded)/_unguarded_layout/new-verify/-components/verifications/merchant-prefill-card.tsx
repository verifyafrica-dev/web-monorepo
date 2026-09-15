import type { NewVerifySession } from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";

type MerchantPrefillCardProps = {
	session: NewVerifySession;
};

export function MerchantPrefillCard({ session }: MerchantPrefillCardProps) {
	const prefilled = session.prefilled ?? {};
	const entries = Object.entries(prefilled).filter(([, value]) => Boolean(value));
	if (entries.length === 0) {
		return null;
	}

	const labels: Record<string, string> = {
		full_name: "Full name",
		dob: "Date of birth",
		country: "Country",
		business_name: "Business name",
		incorporation_date: "Incorporation date",
		company_name: "Company name",
		company_registration_number: "Registration number",
		jurisdiction_code: "Jurisdiction",
	};

	return (
		<div className="rounded-lg border bg-muted/40 p-4">
			<p className="text-sm font-medium">Details already provided</p>
			<p className="mt-1 text-sm text-muted-foreground">
				Your merchant set these values. Locked fields cannot be changed on this
				page. Contact them if something looks wrong.
			</p>
			<dl className="mt-3 grid gap-2 text-sm">
				{entries.map(([key, value]) => (
					<div key={key} className="flex justify-between gap-4">
						<dt className="text-muted-foreground">{labels[key] ?? key}</dt>
						<dd className="font-medium">{value}</dd>
					</div>
				))}
			</dl>
		</div>
	);
}
