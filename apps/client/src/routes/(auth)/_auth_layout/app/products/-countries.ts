import { useMemo } from "react";

import { useSupportedCountriesV2Query } from "#/api/http/v2/tenants/tenants.hooks";
import { useVerificationSupportedCountriesV2Query } from "#/api/http/v2/verifications/verifications.hooks";
import type { SupportedCountry } from "@verifyafrica/api-client/http/v2/tenants/tenants.types";
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
	verificationType?: string;
};

export function useTenantSupportedCountries(
	options?: UseTenantSupportedCountriesOptions,
) {
	const { tenant } = useCurrentTenant();
	const countriesQuery = useSupportedCountriesV2Query();
	const shuftiCountriesQuery = useVerificationSupportedCountriesV2Query(
		options?.verificationType ?? "",
		Boolean(options?.verificationType),
	);

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
		const shuftiCodes = new Set(
			(shuftiCountriesQuery.data?.countries ?? []).map((country) =>
				country.code.trim().toUpperCase(),
			),
		);
		const coverageCountries =
			options?.verificationType && shuftiCodes.size > 0
				? tenantCountries.filter((country) =>
						shuftiCodes.has(country.code.trim().toUpperCase()),
					)
				: tenantCountries;
		const filteredCountries = options?.filter
			? options.filter(coverageCountries)
			: coverageCountries;

		return filteredCountries.sort((left, right) =>
			left.name.localeCompare(right.name),
		);
	}, [
		countriesQuery.data,
		enabledCountries,
		options?.filter,
		options?.verificationType,
		shuftiCountriesQuery.data,
	]);

	return {
		countries,
		isPending:
			countriesQuery.isPending ||
			(Boolean(options?.verificationType) && shuftiCountriesQuery.isPending),
		isFetching: countriesQuery.isFetching || shuftiCountriesQuery.isFetching,
	};
}
