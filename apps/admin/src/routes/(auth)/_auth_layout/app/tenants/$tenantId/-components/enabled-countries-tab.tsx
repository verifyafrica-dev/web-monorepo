import { useEffect, useMemo, useState } from "react";
import type { SupportedCountry } from "#/api/http/v2/tenants/tenants.types";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { Checkbox } from "@verifyafrica/ui/components/ui/checkbox";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { Switch } from "@verifyafrica/ui/components/ui/switch";
import { CountryOptionLabel } from "@verifyafrica/ui/components/ui-extended/country-flag";
import { createSkeletonKeys } from "#/lib/skeleton-keys";
import { groupCountriesByRegion } from "../-data";

export function EnabledCountriesTab({
	initialEnabledCountries,
	supportedCountries,
	isLoading,
	onSave,
	isSaving,
}: {
	initialEnabledCountries: string[];
	supportedCountries: SupportedCountry[];
	isLoading?: boolean;
	onSave: (enabledCountries: string[]) => void;
	isSaving?: boolean;
}) {
	const [enabledCountries, setEnabledCountries] = useState(
		initialEnabledCountries,
	);

	useEffect(() => {
		setEnabledCountries(initialEnabledCountries);
	}, [initialEnabledCountries]);

	const supportedCountryCodeSet = useMemo(
		() => new Set(supportedCountries.map((country) => country.code)),
		[supportedCountries],
	);

	const regionEntries = useMemo(
		() => groupCountriesByRegion(supportedCountries),
		[supportedCountries],
	);

	const enabledSet = useMemo(
		() => new Set(enabledCountries),
		[enabledCountries],
	);

	const hasChanges = useMemo(() => {
		const current = [...initialEnabledCountries].sort().join(",");
		const next = [...enabledCountries].sort().join(",");
		return current !== next;
	}, [enabledCountries, initialEnabledCountries]);

	const toggleCountry = (code: string) => {
		setEnabledCountries((current) =>
			current.includes(code)
				? current.filter((item) => item !== code)
				: [...current, code],
		);
	};

	const enableAll = () => {
		setEnabledCountries(supportedCountries.map((country) => country.code));
	};

	const disableAll = () => {
		setEnabledCountries([]);
	};

	const toggleRegion = (countries: SupportedCountry[], selected: boolean) => {
		const regionCodes = new Set(countries.map((country) => country.code));

		setEnabledCountries((current) => {
			if (selected) {
				const next = new Set(current);
				for (const country of countries) {
					next.add(country.code);
				}
				return Array.from(next);
			}

			return current.filter((code) => !regionCodes.has(code));
		});
	};

	const isRegionFullySelected = (countries: SupportedCountry[]) =>
		countries.every((country) => enabledSet.has(country.code));

	const enabledCount = enabledCountries.filter((code) =>
		supportedCountryCodeSet.has(code),
	).length;

	return (
		<Card>
			<CardHeader className="gap-4 border-b">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-1">
						<CardTitle className="font-semibold">Enabled Countries</CardTitle>
						<p className="text-sm text-muted-foreground">
							Control which countries this tenant can use when submitting
							verifications.
						</p>
						<p className="text-sm text-muted-foreground">
							{enabledCount} of {supportedCountries.length} countries enabled
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							onClick={enableAll}
							disabled={isLoading || isSaving}
						>
							Enable All
						</Button>
						<Button
							variant="outline"
							onClick={disableAll}
							disabled={isLoading || isSaving}
						>
							Disable All
						</Button>
						<Button
							onClick={() => onSave(enabledCountries)}
							disabled={!hasChanges || isLoading || isSaving}
						>
							{isSaving ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4 pt-6">
				{isLoading ? (
					<div className="space-y-4">
						{createSkeletonKeys(3, "enabled-country-region").map((key) => (
							<Skeleton key={key} className="h-48 rounded-xl" />
						))}
					</div>
				) : (
					regionEntries.map(([region, countries]) => (
						<Card key={region} className="gap-0 py-0 shadow-none">
							<CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<CardTitle className="text-base">{region}</CardTitle>
									<p className="text-sm text-muted-foreground">
										{countries.length} countries
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Switch
										id={`region-toggle-${region}`}
										checked={isRegionFullySelected(countries)}
										disabled={isSaving}
										onCheckedChange={(checked) =>
											toggleRegion(countries, checked)
										}
									/>
									<Label htmlFor={`region-toggle-${region}`}>Select Region</Label>
								</div>
							</CardHeader>
							<CardContent className="grid gap-3 py-4 sm:grid-cols-2">
								{countries.map((country) => {
									const id = `country-${country.code}`;

									return (
										<div key={country.code} className="flex items-center gap-2">
											<Checkbox
												id={id}
												checked={enabledSet.has(country.code)}
												onCheckedChange={() => toggleCountry(country.code)}
												disabled={isSaving}
											/>
											<Label htmlFor={id} className="font-normal">
												<CountryOptionLabel
													name={country.name}
													countryCode={country.code}
												/>
											</Label>
										</div>
									);
								})}
							</CardContent>
						</Card>
					))
				)}
			</CardContent>
		</Card>
	);
}
