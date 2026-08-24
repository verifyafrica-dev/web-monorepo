import { GlobeHemisphereWestIcon } from "@phosphor-icons/react";
import { City, State } from "country-state-city";
import { useMemo } from "react";

import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { CountryOptionLabel } from "./country-flag";
import {
	getCountryCode,
	getCountrySelectOptions,
} from "../../lib/country-state-city";
import { cn } from "../../lib/utils";

type CountryStateCityFieldsProps = {
	country: string;
	state: string;
	city: string;
	postalCode: string;
	onCountryChange: (country: string) => void;
	onStateChange: (state: string) => void;
	onCityChange: (city: string) => void;
	onPostalCodeChange: (postalCode: string) => void;
	disabled?: boolean;
	className?: string;
};

function LocationSelect({
	id,
	label,
	value,
	placeholder,
	options,
	onValueChange,
	disabled,
}: {
	id: string;
	label: string;
	value: string;
	placeholder: string;
	options: Array<{ value: string; label: string }>;
	onValueChange: (value: string) => void;
	disabled?: boolean;
}) {
	return (
		<div className="space-y-1.5">
			<Label htmlFor={id}>{label}</Label>
			<Select
				value={value}
				onValueChange={onValueChange}
				disabled={disabled || options.length === 0}
			>
				<SelectTrigger id={id} className="w-full">
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent className="max-h-60">
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

export function CountryStateCityFields({
	country,
	state,
	city,
	postalCode,
	onCountryChange,
	onStateChange,
	onCityChange,
	onPostalCodeChange,
	disabled,
	className,
}: CountryStateCityFieldsProps) {
	const countryCode = useMemo(
		() => getCountryCode(country),
		[country],
	);

	const states = useMemo(
		() => (countryCode ? State.getStatesOfCountry(countryCode) : []),
		[countryCode],
	);

	const stateCode = useMemo(
		() => states.find((entry) => entry.name === state)?.isoCode ?? "",
		[states, state],
	);

	const cities = useMemo(() => {
		if (!countryCode) {
			return [];
		}

		if (states.length > 0) {
			if (!stateCode) {
				return [];
			}

			return City.getCitiesOfState(countryCode, stateCode) ?? [];
		}

		return City.getCitiesOfCountry(countryCode) ?? [];
	}, [countryCode, stateCode, states.length]);

	const countryOptions = useMemo(() => getCountrySelectOptions(), []);

	const stateOptions = useMemo(
		() => states.map((entry) => ({ value: entry.name, label: entry.name })),
		[states],
	);

	const cityOptions = useMemo(
		() => cities.map((entry) => ({ value: entry.name, label: entry.name })),
		[cities],
	);

	const showStateSelect = Boolean(countryCode && states.length > 0);
	const showCitySelect = Boolean(countryCode && cityOptions.length > 0);

	function handleCountryChange(value: string) {
		onCountryChange(value);
		onStateChange("");
		onCityChange("");
	}

	function handleStateChange(value: string) {
		onStateChange(value);
		onCityChange("");
	}

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<div className="space-y-1.5">
				<Label htmlFor="billing-country">Country</Label>
				<div className="relative">
					<GlobeHemisphereWestIcon className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
					<Select
						value={countryCode}
						onValueChange={handleCountryChange}
						disabled={disabled}
					>
						<SelectTrigger id="billing-country" className="w-full pl-10">
							<SelectValue placeholder="Select country" />
						</SelectTrigger>
						<SelectContent className="max-h-60">
							{countryOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									<CountryOptionLabel
										name={option.name}
										countryCode={option.isoCode}
									/>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				{showStateSelect ? (
					<LocationSelect
						id="billing-state"
						label="State/Province"
						value={state}
						placeholder="Select state"
						options={stateOptions}
						onValueChange={handleStateChange}
						disabled={disabled}
					/>
				) : (
					<div className="space-y-1.5">
						<Label htmlFor="billing-state">State/Province</Label>
						<Input
							id="billing-state"
							value={state}
							onChange={(event) => onStateChange(event.target.value)}
							disabled={disabled || !countryCode}
							placeholder={
								countryCode ? "Enter state or province" : "Select country first"
							}
						/>
					</div>
				)}

				{showCitySelect ? (
					<LocationSelect
						id="billing-city"
						label="City"
						value={city}
						placeholder="Select city"
						options={cityOptions}
						onValueChange={onCityChange}
						disabled={disabled || (showStateSelect && !stateCode)}
					/>
				) : (
					<div className="space-y-1.5">
						<Label htmlFor="billing-city">City</Label>
						<Input
							id="billing-city"
							value={city}
							onChange={(event) => onCityChange(event.target.value)}
							disabled={
								disabled || !countryCode || (showStateSelect && !stateCode)
							}
							placeholder={
								!countryCode
									? "Select country first"
									: showStateSelect && !stateCode
										? "Select state first"
										: "Enter city"
							}
						/>
					</div>
				)}

				<div className="space-y-1.5">
					<Label htmlFor="billing-postal">Postal Code</Label>
					<Input
						id="billing-postal"
						value={postalCode}
						onChange={(event) => onPostalCodeChange(event.target.value)}
						disabled={disabled}
						placeholder="Postal code"
					/>
				</div>
			</div>
		</div>
	);
}
