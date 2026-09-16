import type { NewVerifySession } from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";
import { getCountryName } from "@verifyafrica/ui/lib/country-state-city";

type MerchantPrefillCardProps = {
	session: NewVerifySession;
};

const labels: Record<string, string> = {
	full_name: "Full name",
	dob: "Date of birth",
	country: "Country",
	countries: "Countries",
	business_name: "Business name",
	incorporation_date: "Incorporation date",
	company_name: "Company name",
	company_registration_number: "Registration number",
	jurisdiction_code: "Jurisdiction",
};

function formatCountryCodes(value: string) {
	return value
		.split(/[,\s]+/)
		.map((code) => code.trim())
		.filter(Boolean)
		.map((code) => getCountryName(code) || code)
		.join(", ");
}

function formatPrefillValue(key: string, value: string) {
	if (key === "country" || key === "jurisdiction_code" || key === "countries") {
		return formatCountryCodes(value);
	}
	return value;
}

export function MerchantPrefillCard({ session }: MerchantPrefillCardProps) {
	const prefilled = session.prefilled ?? {};
	const hasCountries = Boolean(prefilled.countries);
	const entries = Object.entries(prefilled).filter(([key, value]) => {
		if (!value) {
			return false;
		}
		if (key === "country" && hasCountries) {
			return false;
		}
		return true;
	});
	if (entries.length === 0) {
		return null;
	}

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
						<dd className="font-medium">{formatPrefillValue(key, value)}</dd>
					</div>
				))}
			</dl>
		</div>
	);
}
