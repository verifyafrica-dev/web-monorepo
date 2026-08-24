export { default as City } from "country-state-city/src/city";
export { default as Country } from "country-state-city/src/country";
export { default as State } from "country-state-city/src/state";

import Country from "country-state-city/src/country";

const sortedCountries = Country.getAllCountries().sort((left, right) =>
	left.name.localeCompare(right.name),
);

type CountryRecord = (typeof sortedCountries)[number];

type CountrySelectOption = {
	value: string;
	label: string;
	name: string;
	isoCode: string;
};

const COUNTRY_BY_ISO_CODE = sortedCountries.reduce<Record<string, CountryRecord>>(
	(acc, country) => {
		acc[country.isoCode.toUpperCase()] = country;
		return acc;
	},
	{},
);

const COUNTRY_BY_NAME = sortedCountries.reduce<Record<string, CountryRecord>>(
	(acc, country) => {
		acc[country.name.toLowerCase()] = country;
		return acc;
	},
	{},
);

export const COUNTRY_NAME_BY_ISO_CODE = sortedCountries.reduce<
	Record<string, string>
>((acc, country) => {
	acc[country.isoCode.toUpperCase()] = country.name;
	return acc;
}, {});

export function getCountryByCode(countryCode?: string | null) {
	if (!countryCode) {
		return undefined;
	}

	return COUNTRY_BY_ISO_CODE[countryCode.trim().toUpperCase()];
}

export function getCountryByName(name?: string | null) {
	if (!name) {
		return undefined;
	}

	return COUNTRY_BY_NAME[name.trim().toLowerCase()];
}

export function getCountryCode(value?: string | null) {
	if (!value) {
		return "";
	}

	const trimmed = value.trim();

	if (!trimmed) {
		return "";
	}

	const countryByCode = getCountryByCode(trimmed);

	if (countryByCode) {
		return countryByCode.isoCode.toUpperCase();
	}

	const countryByName = getCountryByName(trimmed);
	return countryByName?.isoCode.toUpperCase() ?? "";
}

export function getCountryName(value?: string | null) {
	if (!value) {
		return "";
	}

	const trimmed = value.trim();

	if (!trimmed) {
		return "";
	}

	const countryByCode = getCountryByCode(trimmed);

	if (countryByCode) {
		return countryByCode.name;
	}

	const countryByName = getCountryByName(trimmed);
	return countryByName?.name ?? trimmed;
}

export function getSortedCountries() {
	return sortedCountries;
}

export function getCountrySelectOptions() {
	return sortedCountries.map<CountrySelectOption>((country) => {
		const isoCode = country.isoCode.toUpperCase();

		return {
			value: isoCode,
			label: country.name,
			name: country.name,
			isoCode,
		};
	});
}

export function getCountryIsoCodeByName(name: string) {
	return getCountryCode(name);
}

export function normalizeCountryCode(value?: string | null) {
	return getCountryCode(value);
}

export function normalizeCountryName(value?: string | null) {
	return getCountryName(value);
}
