export { default as City } from "country-state-city/src/city";
export { default as Country } from "country-state-city/src/country";
export { default as State } from "country-state-city/src/state";

import Country from "country-state-city/src/country";

const sortedCountries = Country.getAllCountries().sort((left, right) =>
	left.name.localeCompare(right.name),
);

export const COUNTRY_NAME_BY_ISO_CODE = sortedCountries.reduce<
	Record<string, string>
>((acc, country) => {
	acc[country.isoCode.toUpperCase()] = country.name;
	return acc;
}, {});

export function getSortedCountries() {
	return sortedCountries;
}

export function getCountrySelectOptions() {
	return sortedCountries.map((country) => ({
		value: country.name,
		label: country.name,
	}));
}

export function getCountryIsoCodeByName(name: string) {
	return (
		sortedCountries.find((country) => country.name === name)?.isoCode ?? ""
	);
}

export function normalizeCountryName(value?: string | null) {
	if (!value) {
		return "";
	}

	const trimmed = value.trim();

	if (!trimmed) {
		return "";
	}

	const fromIsoCode = COUNTRY_NAME_BY_ISO_CODE[trimmed.toUpperCase()];

	if (fromIsoCode) {
		return fromIsoCode;
	}

	const exactMatch = sortedCountries.find(
		(country) => country.name === trimmed,
	);

	if (exactMatch) {
		return exactMatch.name;
	}

	const caseInsensitiveMatch = sortedCountries.find(
		(country) => country.name.toLowerCase() === trimmed.toLowerCase(),
	);

	return caseInsensitiveMatch?.name ?? trimmed;
}
