import { useMemo } from "react";

import { useSupportedCountriesV2Query } from "#/api/http/v2/tenants/tenants.hooks";
import type { SupportedCountry } from "#/api/http/v2/tenants/tenants.types";
import { useCurrentTenant } from "../team/-data";

export function filterCountriesByTenant(
	countries: SupportedCountry[],
	enabledCountries: string[] | undefined,
) {
	if (enabledCountries === undefined) {
		return countries;
	}

	const enabledCodes = new Set(
		enabledCountries
			.map((code) => code.trim().toLowerCase())
			.filter(Boolean),
	);

	return countries.filter((country) =>
		enabledCodes.has(country.code.trim().toLowerCase()),
	);
}

type UseTenantSupportedCountriesOptions = {
	filter?: (countries: SupportedCountry[]) => SupportedCountry[];
};

export function useTenantSupportedCountries(
	options?: UseTenantSupportedCountriesOptions,
) {
	const { tenant } = useCurrentTenant();
	const countriesQuery = useSupportedCountriesV2Query();

	const enabledCountries =
		tenant?.enabled_countries && tenant.enabled_countries.length > 0
			? tenant.enabled_countries
			: undefined;

	const countries = useMemo(() => {
		const supportedCountries = countriesQuery.data ?? [];
		const tenantCountries = filterCountriesByTenant(
			supportedCountries,
			enabledCountries,
		);
		const filteredCountries = options?.filter
			? options.filter(tenantCountries)
			: tenantCountries;

		return filteredCountries.sort((left, right) =>
			left.name.localeCompare(right.name),
		);
	}, [countriesQuery.data, enabledCountries, options?.filter]);

	return {
		countries,
		isPending: countriesQuery.isPending,
		isFetching: countriesQuery.isFetching,
	};
}
