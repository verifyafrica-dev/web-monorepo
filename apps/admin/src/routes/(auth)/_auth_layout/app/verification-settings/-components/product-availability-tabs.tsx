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
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
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

	const save = async (product: string, enabledKeys: string[], allKeys: string[]) => {
		const enabled = new Set(enabledKeys);
		const disabled = allKeys.filter((key) => !enabled.has(key));
		try {
			await mutation.mutateAsync({ product, disabled_keys: disabled });
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
					<CardTitle>{title}</CardTitle>
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
							<Skeleton key={key} className="h-12 w-full" />
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
									<Label htmlFor={switchId} className="cursor-pointer font-normal">
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
		return products.map((product) => product.slug).filter((slug) => !disabled.has(slug));
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
	const variants: ProductAvailabilityVariant[] =
		availability?.variants?.[product] ?? [];
	const globallyDisabled = useMemo(
		() => new Set(availability?.global_disabled ?? []),
		[availability?.global_disabled],
	);
	const productGloballyOff = Boolean(product && globallyDisabled.has(product));

	const initialEnabledKeys = useMemo(() => {
		if (productGloballyOff) return [];
		const disabled = new Set(availability?.variant_disabled?.[product] ?? []);
		return variants.map((variant) => variant.value).filter((value) => !disabled.has(value));
	}, [availability?.variant_disabled, product, productGloballyOff, variants]);

	if (isError) return <LoadError />;

	return (
		<AvailabilityToggleList
			key={product}
			title="Product Variants"
			description={
				productGloballyOff
					? "This product is turned off globally. Enable it under Global Products before configuring variants."
					: "Turn individual verification types off for a multi-type product (Government Registry Checks). Disabled types are greyed out for tenants and rejected on new requests."
			}
			idPrefix={`product-variant-${product}`}
			headerExtra={
				<div className="flex items-center gap-3 pt-2">
					<Label htmlFor="product-availability-product">Product</Label>
					<Select
						value={product}
						onValueChange={setSelectedProduct}
						disabled={isLoading || isSaving || variantProducts.length === 0}
					>
						<SelectTrigger id="product-availability-product" className="w-[280px]">
							<SelectValue placeholder="Select a product" />
						</SelectTrigger>
						<SelectContent>
							{variantProducts.map((item) => (
								<SelectItem key={item.slug} value={item.slug}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			}
			items={
				productGloballyOff
					? []
					: variants.map((variant) => ({
							key: variant.value,
							label: variant.label,
						}))
			}
			initialEnabledKeys={initialEnabledKeys}
			isLoading={isLoading}
			isSaving={isSaving}
			onSave={(keys) =>
				void save(
					product,
					keys,
					variants.map((variant) => variant.value),
				)
			}
		/>
	);
}
