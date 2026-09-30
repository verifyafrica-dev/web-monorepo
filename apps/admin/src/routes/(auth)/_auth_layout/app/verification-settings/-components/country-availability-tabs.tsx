import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import type { SupportedCountry } from "@verifyafrica/api-client/http/v2/tenants/tenants.types";
import { useSupportedCountriesV2Query } from "#/api/http/v2/tenants/tenants.hooks";
import {
	useCountryAvailabilityV2Query,
	useUpdateCountryAvailabilityV2Mutation,
} from "#/api/http/v2/verifications/verifications.hooks";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Label } from "@verifyafrica/ui/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { EnabledCountriesTab } from "../../tenants/$tenantId/-components/enabled-countries-tab";

const GLOBAL_SCOPE = "";

function useCountryAvailabilityEditor() {
	const countriesQuery = useSupportedCountriesV2Query();
	const availabilityQuery = useCountryAvailabilityV2Query();
	const mutation = useUpdateCountryAvailabilityV2Mutation();
	const supportedCountries = countriesQuery.data ?? [];

	const save = async (
		product: string,
		enabledCountries: string[],
		shownCountries: SupportedCountry[],
	) => {
		const enabled = new Set(enabledCountries);
		const disabled = shownCountries
			.map((country) => country.code)
			.filter((code) => !enabled.has(code));
		try {
			await mutation.mutateAsync({ product, disabled_countries: disabled });
			toast.success("Country availability updated");
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
	};

	return {
		supportedCountries,
		availability: availabilityQuery.data,
		isLoading: countriesQuery.isLoading || availabilityQuery.isLoading,
		isError: countriesQuery.isError || availabilityQuery.isError,
		isSaving: mutation.isPending,
		save,
	};
}

function LoadError() {
	return (
		<Card>
			<CardContent className="pt-6">
				<p className="py-12 text-center text-sm text-destructive">
					Unable to load country availability.
				</p>
			</CardContent>
		</Card>
	);
}

export function GlobalCountriesTab() {
	const { supportedCountries, availability, isLoading, isError, isSaving, save } =
		useCountryAvailabilityEditor();

	const enabledCountries = useMemo(() => {
		const disabled = new Set(availability?.global_disabled ?? []);
		return supportedCountries
			.map((country) => country.code)
			.filter((code) => !disabled.has(code));
	}, [availability?.global_disabled, supportedCountries]);

	if (isError) return <LoadError />;

	return (
		<EnabledCountriesTab
			title="Global Countries"
			description="Countries turned off here are unavailable to every tenant and product, even if a tenant has them enabled."
			idPrefix="global-country"
			initialEnabledCountries={enabledCountries}
			supportedCountries={supportedCountries}
			isLoading={isLoading}
			isSaving={isSaving}
			onSave={(codes) => void save(GLOBAL_SCOPE, codes, supportedCountries)}
		/>
	);
}

export function ProductCountriesTab() {
	const { supportedCountries, availability, isLoading, isError, isSaving, save } =
		useCountryAvailabilityEditor();
	const products = availability?.products ?? [];
	const [selectedProduct, setSelectedProduct] = useState<string>();
	const product = selectedProduct ?? products[0]?.slug ?? "";

	const globallyDisabled = useMemo(
		() => new Set(availability?.global_disabled ?? []),
		[availability?.global_disabled],
	);
	const productCountries = useMemo(
		() =>
			supportedCountries.filter((country) => !globallyDisabled.has(country.code)),
		[globallyDisabled, supportedCountries],
	);
	const enabledCountries = useMemo(() => {
		const disabled = new Set(availability?.product_disabled[product] ?? []);
		return productCountries
			.map((country) => country.code)
			.filter((code) => !disabled.has(code));
	}, [availability?.product_disabled, product, productCountries]);

	if (isError) return <LoadError />;

	return (
		<EnabledCountriesTab
			key={product}
			title="Product Countries"
			description={
				globallyDisabled.size > 0
					? `Turn countries off for a single product. ${globallyDisabled.size} globally disabled ${globallyDisabled.size === 1 ? "country is" : "countries are"} hidden here.`
					: "Turn countries off for a single product. Tenants still need the country enabled on their own account."
			}
			idPrefix={`product-country-${product}`}
			headerExtra={
				<div className="flex items-center gap-3">
					<Label htmlFor="country-availability-product">Product</Label>
					<Select
						value={product}
						onValueChange={setSelectedProduct}
						disabled={isLoading || isSaving}
					>
						<SelectTrigger id="country-availability-product" className="w-[260px]">
							<SelectValue placeholder="Select a product" />
						</SelectTrigger>
						<SelectContent>
							{products.map((item) => (
								<SelectItem key={item.slug} value={item.slug}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			}
			initialEnabledCountries={enabledCountries}
			supportedCountries={productCountries}
			isLoading={isLoading}
			isSaving={isSaving}
			onSave={(codes) => void save(product, codes, productCountries)}
		/>
	);
}
