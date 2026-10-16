import { useMemo } from "react";

import { useCurrentTenant } from "../team/-data";
import type { ProductSlug } from "./-data";

export const PRODUCT_DISABLED_MESSAGE =
	"This product has been disabled for your account, kindly contact support@verifyafrica.io";

export const VARIANT_DISABLED_MESSAGE =
	"This verification type is not available.";

/** Backend product keys use underscores (`document_verification`); route slugs use hyphens. */
function toProductKey(slug: ProductSlug | string) {
	return slug.replaceAll("-", "_");
}

export function useDisabledProducts() {
	const { tenant } = useCurrentTenant();
	const allowedProducts = tenant?.allowed_products;

	return useMemo(() => {
		if (!allowedProducts) {
			return (_slug: ProductSlug) => false;
		}
		const allowed = new Set(allowedProducts);
		return (slug: ProductSlug) => !allowed.has(toProductKey(slug));
	}, [allowedProducts]);
}

export function useIsProductDisabled(slug: ProductSlug) {
	return useDisabledProducts()(slug);
}

/** Allowed verification-type variants for a multi-type product (e.g. GRC). */
export function useAllowedProductVariants(product: string) {
	const { tenant } = useCurrentTenant();
	const key = toProductKey(product);

	return useMemo(() => {
		const variants = tenant?.product_variants?.[key];
		return variants ? new Set(variants) : null;
	}, [key, tenant?.product_variants]);
}

export function useIsVariantDisabled(product: string, verificationType: string) {
	const allowed = useAllowedProductVariants(product);
	if (!allowed) return false;
	return !allowed.has(verificationType);
}

export function ProductDisabledNotice() {
	return (
		<p className="text-sm text-destructive">{PRODUCT_DISABLED_MESSAGE}</p>
	);
}
