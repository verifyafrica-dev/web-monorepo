import type { Country, FlagProps } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { getCountryCode } from "../../lib/country-state-city";
import { cn } from "../../lib/utils";

export function PhoneCountryFlag({
	country,
	countryName,
	className: flagClassName,
}: FlagProps & { className?: string }) {
	const Flag = flags[country];

	return (
		<span
			className={cn(
				"flex h-4 w-6 shrink-0 overflow-hidden rounded-sm bg-foreground/5 [&_svg:not([class*='size-'])]:size-full",
				flagClassName,
			)}
		>
			{Flag ? <Flag title={countryName} /> : null}
		</span>
	);
}

type CountryOptionLabelProps = {
	name: string;
	countryCode?: string | null;
	className?: string;
	flagClassName?: string;
};

export function CountryOptionLabel({
	name,
	countryCode,
	className,
	flagClassName,
}: CountryOptionLabelProps) {
	const isoCode = getCountryCode(countryCode ?? name);
	const country = isoCode as Country;
	const hasFlag = isoCode.length === 2 && Boolean(flags[country]);

	return (
		<span className={cn("flex items-center gap-2", className)}>
			{hasFlag ? (
				<PhoneCountryFlag
					country={country}
					countryName={name}
					className={flagClassName}
				/>
			) : (
				<span className="flex h-4 w-6 shrink-0 rounded-sm bg-foreground/5" />
			)}
			<span>{name}</span>
		</span>
	);
}
