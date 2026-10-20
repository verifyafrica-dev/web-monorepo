import { type ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import type {
	ProductAvailabilityProduct,
	ProductAvailabilityVariant,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import {
	useProductAvailabilityV2Query,
	useUpdateProductAvailabilityV2Mutation,
} from "#/api/http/v2/verifications/verifications.hooks";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@verifyafrica/ui/components/ui/accordion";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { Label } from "@verifyafrica/ui/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { Switch } from "@verifyafrica/ui/components/ui/switch";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";

const GLOBAL_SCOPE = "";

function useProductAvailabilityEditor() {
	const availabilityQuery = useProductAvailabilityV2Query();
	const mutation = useUpdateProductAvailabilityV2Mutation();

	const save = async (
		product: string,
		enabledKeys: string[],
		allKeys: string[],
		disabledCountries?: string[],
	) => {
		const enabled = new Set(enabledKeys);
		const disabled = allKeys.filter((key) => !enabled.has(key));
		try {
			await mutation.mutateAsync({
				product,
				disabled_keys: disabled,
				...(disabledCountries ? { disabled_countries: disabledCountries } : {}),
			});
			toast.success("Product availability updated");
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
	};

	return {
		availability: availabilityQuery.data,
		isLoading: availabilityQuery.isLoading,
		isError: availabilityQuery.isError,
		isSaving: mutation.isPending,
		save,
	};
}

function LoadError() {
	return (
		<Card>
			<CardContent className="pt-6">
				<p className="py-12 text-center text-sm text-destructive">
					Unable to load product availability.
				</p>
			</CardContent>
		</Card>
	);
}

function AvailabilityToggleList({
	title,
	description,
	headerExtra,
	items,
	initialEnabledKeys,
	isLoading,
	isSaving,
	onSave,
	idPrefix,
}: {
	title: string;
	description: ReactNode;
	headerExtra?: ReactNode;
	items: { key: string; label: string }[];
	initialEnabledKeys: string[];
	isLoading?: boolean;
	isSaving?: boolean;
	onSave: (enabledKeys: string[]) => void;
	idPrefix: string;
}) {
	const [enabledKeys, setEnabledKeys] = useState(initialEnabledKeys);

	useEffect(() => {
		setEnabledKeys(initialEnabledKeys);
	}, [initialEnabledKeys]);

	const enabledSet = useMemo(() => new Set(enabledKeys), [enabledKeys]);

	const hasChanges = useMemo(() => {
		const current = [...initialEnabledKeys].sort().join(",");
		const next = [...enabledKeys].sort().join(",");
		return current !== next;
	}, [enabledKeys, initialEnabledKeys]);

	const toggle = (key: string) => {
		setEnabledKeys((current) =>
			current.includes(key)
				? current.filter((item) => item !== key)
				: [...current, key],
		);
	};

	return (
		<Card>
			<CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-1">
					<CardTitle className="font-semibold">{title}</CardTitle>
					<p className="text-sm text-muted-foreground">{description}</p>
					{headerExtra}
				</div>
				<div className="flex shrink-0 flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={isLoading || isSaving || items.length === 0}
						onClick={() => setEnabledKeys(items.map((item) => item.key))}
					>
						Enable all
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={isLoading || isSaving}
						onClick={() => setEnabledKeys([])}
					>
						Disable all
					</Button>
					<Button
						type="button"
						size="sm"
						disabled={isLoading || isSaving || !hasChanges}
						onClick={() => onSave(enabledKeys)}
					>
						{isSaving ? "Saving..." : "Save"}
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-3">
						{createSkeletonKeys(6, `${idPrefix}-skeleton`).map((key) => (
							<Skeleton
								key={key}
								className="h-12 w-full"
							/>
						))}
					</div>
				) : items.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						No items to configure.
					</p>
				) : (
					<ul className="divide-y rounded-lg border">
						{items.map((item) => {
							const enabled = enabledSet.has(item.key);
							const switchId = `${idPrefix}-${item.key}`;
							return (
								<li
									key={item.key}
									className="flex items-center justify-between gap-4 px-4 py-3"
								>
									<Label
										htmlFor={switchId}
										className="cursor-pointer font-normal"
									>
										{item.label}
										<span className="mt-0.5 block text-xs text-muted-foreground">
											{item.key}
										</span>
									</Label>
									<Switch
										id={switchId}
										checked={enabled}
										disabled={isSaving}
										onCheckedChange={() => toggle(item.key)}
									/>
								</li>
							);
						})}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}

export function GlobalProductsTab() {
	const { availability, isLoading, isError, isSaving, save } =
		useProductAvailabilityEditor();
	const products = availability?.products ?? [];

	const initialEnabledKeys = useMemo(() => {
		const disabled = new Set(availability?.global_disabled ?? []);
		return products
			.map((product) => product.slug)
			.filter((slug) => !disabled.has(slug));
	}, [availability?.global_disabled, products]);

	if (isError) return <LoadError />;

	return (
		<AvailabilityToggleList
			title="Global Products"
			description="Products turned off here are unavailable to every tenant, even if they still have the type enabled locally. They are also hidden from the public status page."
			idPrefix="global-product"
			items={products.map((product: ProductAvailabilityProduct) => ({
				key: product.slug,
				label: product.label,
			}))}
			initialEnabledKeys={initialEnabledKeys}
			isLoading={isLoading}
			isSaving={isSaving}
			onSave={(keys) =>
				void save(
					GLOBAL_SCOPE,
					keys,
					products.map((product) => product.slug),
				)
			}
		/>
	);
}

type VariantCountryGroup = {
	country: string;
	name: string;
	variants: ProductAvailabilityVariant[];
};

function groupVariantsByCountry(
	variants: ProductAvailabilityVariant[],
): VariantCountryGroup[] {
	const groups = new Map<string, VariantCountryGroup>();
	for (const variant of variants) {
		const group = groups.get(variant.country) ?? {
			country: variant.country,
			name: variant.country_name,
			variants: [],
		};
		group.variants.push(variant);
		groups.set(variant.country, group);
	}
	return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function sortedKey(values: Iterable<string>) {
	return [...values].sort().join(",");
}

function VariantCountryAccordion({
	groups,
	initialEnabledTypes,
	initialDisabledCountries,
	isSaving,
	onSave,
}: {
	groups: VariantCountryGroup[];
	initialEnabledTypes: string[];
	initialDisabledCountries: string[];
	isSaving: boolean;
	onSave: (enabledTypes: string[], disabledCountries: string[]) => void;
}) {
	const [enabledTypes, setEnabledTypes] = useState(
		() => new Set(initialEnabledTypes),
	);
	const [disabledCountries, setDisabledCountries] = useState(
		() => new Set(initialDisabledCountries),
	);

	useEffect(() => {
		setEnabledTypes(new Set(initialEnabledTypes));
		setDisabledCountries(new Set(initialDisabledCountries));
	}, [initialEnabledTypes, initialDisabledCountries]);

	const hasChanges =
		sortedKey(enabledTypes) !== sortedKey(initialEnabledTypes) ||
		sortedKey(disabledCountries) !== sortedKey(initialDisabledCountries);

	const toggleType = (value: string) => {
		setEnabledTypes((current) => {
			const next = new Set(current);
			if (next.has(value)) next.delete(value);
			else next.add(value);
			return next;
		});
	};

	const setCountryEnabled = (country: string, enabled: boolean) => {
		setDisabledCountries((current) => {
			const next = new Set(current);
			if (enabled) next.delete(country);
			else next.add(country);
			return next;
		});
	};

	const setGroupTypesEnabled = (group: VariantCountryGroup, enabled: boolean) => {
		setEnabledTypes((current) => {
			const next = new Set(current);
			for (const variant of group.variants) {
				if (enabled) next.add(variant.value);
				else next.delete(variant.value);
			}
			return next;
		});
	};

	const enableEverything = () => {
		setDisabledCountries(new Set());
		setEnabledTypes(
			new Set(groups.flatMap((group) => group.variants.map((v) => v.value))),
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={isSaving}
					onClick={enableEverything}
				>
					Enable all
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={isSaving}
					onClick={() =>
						setDisabledCountries(new Set(groups.map((group) => group.country)))
					}
				>
					Disable all
				</Button>
				<Button
					type="button"
					size="sm"
					disabled={isSaving || !hasChanges}
					onClick={() => onSave([...enabledTypes], [...disabledCountries])}
				>
					{isSaving ? "Saving..." : "Save"}
				</Button>
			</div>

			<Accordion type="multiple" className="rounded-lg border">
				{groups.map((group) => {
					const countryOn = !disabledCountries.has(group.country);
					const enabledCount = group.variants.filter((variant) =>
						enabledTypes.has(variant.value),
					).length;
					const countrySwitchId = `product-variant-country-${group.country}`;

					return (
						<AccordionItem key={group.country} value={group.country}>
							<div className="flex items-center gap-4 px-4">
								<AccordionTrigger className="items-center hover:no-underline">
									<span className="flex flex-wrap items-center gap-2">
										<span className="font-semibold">{group.name}</span>
										{countryOn ? (
											<Badge
												variant="outline"
												className={
													enabledCount === group.variants.length
														? "border-emerald-200 bg-emerald-50 text-emerald-700"
														: "border-amber-200 bg-amber-50 text-amber-700"
												}
											>
												{enabledCount} of {group.variants.length} checks on
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="border-muted bg-muted text-muted-foreground"
											>
												All checks off
											</Badge>
										)}
									</span>
								</AccordionTrigger>
								<Switch
									id={countrySwitchId}
									aria-label={`${countryOn ? "Disable" : "Enable"} all ${group.name} checks`}
									checked={countryOn}
									disabled={isSaving}
									onCheckedChange={(checked) =>
										setCountryEnabled(group.country, checked)
									}
								/>
							</div>
							<AccordionContent className="px-4">
								{countryOn ? (
									<div className="mb-3 flex flex-wrap gap-2">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											disabled={isSaving}
											onClick={() => setGroupTypesEnabled(group, true)}
										>
											Enable all {group.name} checks
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											disabled={isSaving}
											onClick={() => setGroupTypesEnabled(group, false)}
										>
											Disable all {group.name} checks
										</Button>
									</div>
								) : (
									<p className="mb-3 text-xs text-muted-foreground">
										{group.name} is turned off, so every check below is
										unavailable. Turn it back on to use the individual settings.
									</p>
								)}
								<ul className="divide-y rounded-lg border">
									{group.variants.map((variant) => {
										const switchId = `product-variant-${variant.value}`;
										return (
											<li
												key={variant.value}
												className="flex items-center justify-between gap-4 px-4 py-3"
											>
												<Label
													htmlFor={switchId}
													className="cursor-pointer font-normal"
												>
													{variant.type_label}
													<span className="mt-0.5 block text-xs text-muted-foreground">
														{variant.value}
													</span>
												</Label>
												<Switch
													id={switchId}
													checked={countryOn && enabledTypes.has(variant.value)}
													disabled={isSaving || !countryOn}
													onCheckedChange={() => toggleType(variant.value)}
												/>
											</li>
										);
									})}
								</ul>
							</AccordionContent>
						</AccordionItem>
					);
				})}
			</Accordion>
		</div>
	);
}

export function ProductVariantsTab() {
	const { availability, isLoading, isError, isSaving, save } =
		useProductAvailabilityEditor();
	const variantProducts = useMemo(
		() =>
			(availability?.products ?? []).filter(
				(product) => availability?.variants?.[product.slug] != null,
			),
		[availability?.products, availability?.variants],
	);
	const [selectedProduct, setSelectedProduct] = useState<string>();
	const product = selectedProduct ?? variantProducts[0]?.slug ?? "";
	const variants = useMemo<ProductAvailabilityVariant[]>(
		() => availability?.variants?.[product] ?? [],
		[availability?.variants, product],
	);
	const groups = useMemo(() => groupVariantsByCountry(variants), [variants]);
	const productGloballyOff = Boolean(
		product && availability?.global_disabled?.includes(product),
	);

	const initialEnabledTypes = useMemo(() => {
		const disabled = new Set(availability?.variant_disabled?.[product] ?? []);
		return variants
			.map((variant) => variant.value)
			.filter((value) => !disabled.has(value));
	}, [availability?.variant_disabled, product, variants]);
	const initialDisabledCountries = useMemo(
		() => availability?.variant_disabled_countries?.[product] ?? [],
		[availability?.variant_disabled_countries, product],
	);

	if (isError) return <LoadError />;

	return (
		<Card>
			<CardHeader className="space-y-1">
				<CardTitle className="font-semibold">Product Variants</CardTitle>
				<p className="text-sm text-muted-foreground">
					{productGloballyOff
						? "This product is turned off globally. Enable it under Global Products before configuring variants."
						: "Turn a whole country off with its switch, or open a country to turn individual checks off. Disabled checks are greyed out for tenants and rejected on new requests."}
				</p>
				<div className="flex items-center gap-3 pt-2">
					<Label htmlFor="product-availability-product">Product</Label>
					<Select
						value={product}
						onValueChange={setSelectedProduct}
						disabled={isLoading || isSaving || variantProducts.length === 0}
					>
						<SelectTrigger
							id="product-availability-product"
							className="w-[280px]"
						>
							<SelectValue placeholder="Select a product" />
						</SelectTrigger>
						<SelectContent>
							{variantProducts.map((item) => (
								<SelectItem
									key={item.slug}
									value={item.slug}
								>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-3">
						{createSkeletonKeys(6, "product-variant-skeleton").map((key) => (
							<Skeleton
								key={key}
								className="h-12 w-full"
							/>
						))}
					</div>
				) : productGloballyOff || groups.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						No items to configure.
					</p>
				) : (
					<VariantCountryAccordion
						key={product}
						groups={groups}
						initialEnabledTypes={initialEnabledTypes}
						initialDisabledCountries={initialDisabledCountries}
						isSaving={isSaving}
						onSave={(enabledTypes, disabledCountries) =>
							void save(
								product,
								enabledTypes,
								variants.map((variant) => variant.value),
								disabledCountries,
							)
						}
					/>
				)}
			</CardContent>
		</Card>
	);
}

