import {
	BuildingsIcon,
	EnvelopeSimpleIcon,
	HouseIcon,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { CountryStateCityFields } from "@verifyafrica/ui/components/ui-extended/country-state-city-fields";
import { cn } from "#/lib/utils.ts";
import type { BillingFormState } from "../-data";

function IconField({
	id,
	label,
	icon: Icon,
	value,
	onChange,
	className,
	disabled,
	placeholder,
	type = "text",
}: {
	id: string;
	label: string;
	icon?: ComponentType<{ className?: string }>;
	value: string;
	onChange: (value: string) => void;
	className?: string;
	disabled?: boolean;
	placeholder?: string;
	type?: "text" | "email";
}) {
	return (
		<div className={cn("space-y-1.5", className)}>
			<Label htmlFor={id}>{label}</Label>
			<div className="relative">
				{Icon && (
					<Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				)}
				<Input
					id={id}
					type={type}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className={Icon ? "pl-10" : undefined}
					disabled={disabled}
					placeholder={placeholder}
				/>
			</div>
		</div>
	);
}

type BillingInformationFormFieldsProps = {
	form: BillingFormState;
	onFieldChange: <K extends keyof BillingFormState>(
		field: K,
		value: BillingFormState[K],
	) => void;
	isEmailDisabled?: boolean;
	disabled?: boolean;
	className?: string;
};

export function BillingInformationFormFields({
	form,
	onFieldChange,
	isEmailDisabled = false,
	disabled = false,
	className,
}: BillingInformationFormFieldsProps) {
	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<IconField
				id="billing-name"
				label="Billing Name"
				icon={BuildingsIcon}
				value={form.billing_name}
				onChange={(value) => onFieldChange("billing_name", value)}
				disabled={disabled}
				placeholder="Enter billing name"
			/>
			<IconField
				id="billing-email"
				label="Billing Email"
				icon={EnvelopeSimpleIcon}
				type="email"
				value={form.billing_email}
				onChange={(value) => onFieldChange("billing_email", value)}
				disabled={disabled || isEmailDisabled}
				placeholder="Enter billing email"
			/>
			<IconField
				id="billing-address"
				label="Billing Address"
				icon={HouseIcon}
				value={form.billing_address}
				onChange={(value) => onFieldChange("billing_address", value)}
				disabled={disabled}
				placeholder="Enter billing address"
			/>
			<CountryStateCityFields
				country={form.billing_country}
				state={form.billing_state}
				city={form.billing_city}
				postalCode={form.billing_postal_code}
				onCountryChange={(value) => onFieldChange("billing_country", value)}
				onStateChange={(value) => onFieldChange("billing_state", value)}
				onCityChange={(value) => onFieldChange("billing_city", value)}
				onPostalCodeChange={(value) =>
					onFieldChange("billing_postal_code", value)
				}
				disabled={disabled}
			/>
		</div>
	);
}
