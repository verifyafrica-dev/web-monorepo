"use client";

import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from "../ui/combobox";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import { getCountryName } from "../../lib/country-state-city";
import { CountryOptionLabel } from "./country-flag";

export type ScreeningCountryOption = {
	code: string;
	name: string;
};

type ScreeningCountriesMultiSelectProps = {
	id: string;
	label?: string;
	value: string[];
	onValueChange: (value: string[]) => void;
	countries: ScreeningCountryOption[];
	isLoading?: boolean;
	disabled?: boolean;
	description?: string;
};

export function ScreeningCountriesMultiSelect({
	id,
	label = "Screening countries",
	value,
	onValueChange,
	countries,
	isLoading = false,
	disabled = false,
	description = "Select one or more countries. Leave empty to run a global screen.",
}: ScreeningCountriesMultiSelectProps) {
	const chipsAnchor = useComboboxAnchor();
	const selected = value
		.map((code) => code.trim().toUpperCase())
		.filter(Boolean);
	const byCode = new Map(
		countries.map((country) => [country.code.trim().toUpperCase(), country]),
	);

	function labelForCode(code: string) {
		const listedName = byCode.get(code)?.name?.trim();
		if (listedName && listedName.toUpperCase() !== code) {
			return listedName;
		}
		return getCountryName(code) || listedName || code;
	}

	return (
		<Field className="gap-1.5">
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Combobox
				items={countries.map((country) => country.code.toUpperCase())}
				multiple
				value={selected}
				onValueChange={(next) => onValueChange(next as string[])}
				itemToStringLabel={labelForCode}
				disabled={disabled || isLoading}
			>
				<ComboboxChips ref={chipsAnchor}>
					<ComboboxValue>
						{(codes: string[]) => (
							<>
								{codes.map((code) => (
									<ComboboxChip
										key={code}
										value={code}
										className="bg-primary/10"
									>
										<CountryOptionLabel
											name={labelForCode(code)}
											countryCode={code}
										/>
									</ComboboxChip>
								))}
								<ComboboxChipsInput
									id={id}
									placeholder={
										isLoading
											? "Loading countries..."
											: codes.length > 0
												? ""
												: "Search countries"
									}
								/>
							</>
						)}
					</ComboboxValue>
				</ComboboxChips>
				<ComboboxContent
					anchor={chipsAnchor}
					className="w-(--anchor-width)"
				>
					<ComboboxEmpty>No countries found.</ComboboxEmpty>
					<ComboboxList>
						{(code: string) => (
							<ComboboxItem key={code} value={code}>
								<CountryOptionLabel
									name={labelForCode(code)}
									countryCode={code}
								/>
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
			<FieldDescription>{description}</FieldDescription>
		</Field>
	);
}
