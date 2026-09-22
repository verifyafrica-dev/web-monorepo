import type { NewVerifySession } from "@verifyafrica/api-client/http/v2/verifications/new-verify/new-verify.types";
import { getCountryName } from "@verifyafrica/ui/lib/country-state-city";

type MerchantPrefillCardProps = {
	session: NewVerifySession;
};

const LABELS: Record<string, string> = {
	full_name: "Full Name",
	first_name: "First Name",
	last_name: "Last Name",
	date_of_birth: "Date Of Birth",
	dob: "Date Of Birth",
	bvn: "BVN",
	nin: "NIN",
	virtual_nin: "Virtual NIN",
	phone_number: "Phone Number",
	cac_number: "CAC Number",
	registration_name: "Registered Business Name",
	passport_id: "Passport Number",
	passport_number: "Passport Number",
	voter_id: "Voter ID",
	ssnit_number: "SSNIT Number",
	license_number: "Driver's License Number",
	national_id: "National ID",
	tax_pin: "Tax PIN",
	id_number: "ID Number",
	type: "ID Type",
	country: "Country",
	countries: "Countries",
	business_name: "Business Name",
	incorporation_date: "Incorporation Date",
	company_name: "Company Name",
	company_registration_number: "Company Registration Number",
	jurisdiction_code: "Business Jurisdiction",
	search_by: "Search Identifier",
	search_word: "Other Identifier Value",
	search_type: "Search Type",
};

const VALUE_LABELS: Record<string, string> = {
	fuzzy: "Fuzzy",
	contains: "Contains",
	start_with: "Starts With",
	company_name: "Company Name",
	registration_number: "Company Registration Number",
	vat_number: "VAT Number",
	freelance_number: "Freelance Number",
	tax_identification_number: "Tax Identification Number",
	commercial_registration_number: "Commercial Registration Number",
	cnpj_number: "CNPJ Number",
	trn_number: "TRN Number",
	iban_number: "IBAN Number",
	license_number: "License Number",
	vat_certificate_number: "VAT Certificate Number",
};

function titleCase(value: string) {
	return value
		.replaceAll("_", " ")
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

function formatLabel(key: string) {
	return LABELS[key] ?? titleCase(key);
}

function formatCountryCodes(value: string) {
	return value
		.split(/[,\s]+/)
		.map((code) => code.trim())
		.filter(Boolean)
		.map((code) => getCountryName(code) || code.replaceAll("_", " ").toUpperCase())
		.join(", ");
}

function looksLikeDate(value: string) {
	return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatPrefillValue(key: string, value: string) {
	if (key === "country" || key === "jurisdiction_code" || key === "countries") {
		return formatCountryCodes(value);
	}
	if (looksLikeDate(value) || value.includes("@") || value.startsWith("http")) {
		return value;
	}
	if (VALUE_LABELS[value]) {
		return VALUE_LABELS[value];
	}
	if (value.includes("_") || value === value.toLowerCase()) {
		return titleCase(value);
	}
	return value;
}

export function MerchantPrefillCard({ session }: MerchantPrefillCardProps) {
	const prefilled = session.prefilled ?? {};
	const hasCountries = Boolean(prefilled.countries);
	const hasJurisdiction = Boolean(prefilled.jurisdiction_code);
	const entries = Object.entries(prefilled).filter(([key, value]) => {
		if (!value) {
			return false;
		}
		if (key === "country" && (hasCountries || hasJurisdiction)) {
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
						<dt className="text-muted-foreground">{formatLabel(key)}</dt>
						<dd className="font-medium text-right">
							{formatPrefillValue(key, value)}
						</dd>
					</div>
				))}
			</dl>
		</div>
	);
}
