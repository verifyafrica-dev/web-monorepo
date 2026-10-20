export { default as City } from "country-state-city/src/city";
export { default as Country } from "country-state-city/src/country";
export { default as State } from "country-state-city/src/state";

import Country from "country-state-city/src/country";

type CountryRecord = ReturnType<typeof Country.getAllCountries>[number];

type CountrySelectOption = {
	value: string;
	label: string;
	name: string;
	isoCode: string;
};

type CountryTables = {
	sorted: CountryRecord[];
	byIsoCode: Record<string, CountryRecord>;
	byName: Record<string, CountryRecord>;
};

// Built on first use: module-level evaluation order is not guaranteed in the SSR bundle,
// so importers that read these at load time could otherwise see them uninitialised.
let tables: CountryTables | undefined;

function getTables(): CountryTables {
	if (tables) {
		return tables;
	}

	const sorted = Country.getAllCountries().sort((left, right) =>
		left.name.localeCompare(right.name),
	);
	const byIsoCode: Record<string, CountryRecord> = {};
	const byName: Record<string, CountryRecord> = {};

	for (const country of sorted) {
		byIsoCode[country.isoCode.toUpperCase()] = country;
		byName[country.name.toLowerCase()] = country;
	}

	tables = { sorted, byIsoCode, byName };
	return tables;
}

export function getCountryByCode(countryCode?: string | null) {
	if (!countryCode) {
		return undefined;
	}

	return getTables().byIsoCode[countryCode.trim().toUpperCase()];
}

export function getCountryByName(name?: string | null) {
	if (!name) {
		return undefined;
	}

	return getTables().byName[name.trim().toLowerCase()];
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
	return getTables().sorted;
}

export function getCountrySelectOptions() {
	return getTables().sorted.map<CountrySelectOption>((country) => {
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
