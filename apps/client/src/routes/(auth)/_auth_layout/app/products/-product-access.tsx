import { useMemo } from "react";

import { useCurrentTenant } from "../team/-data";
import { PRODUCT_SLUG, type ProductSlug } from "./-data";

export const PRODUCT_DISABLED_MESSAGE =
	"This product has been disabled for your account, kindly contact support@verifyafrica.io";

/** Products composed of other checks; `/me` does not gate them directly. */
const UNGATED_PRODUCTS = new Set<ProductSlug>([
	PRODUCT_SLUG.MIXED_VERIFICATIONS,
]);

/** Backend product keys use underscores (`document_verification`); route slugs use hyphens. */
function toProductKey(slug: ProductSlug) {
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
		return (slug: ProductSlug) =>
			!UNGATED_PRODUCTS.has(slug) && !allowed.has(toProductKey(slug));
	}, [allowedProducts]);
}

export function useIsProductDisabled(slug: ProductSlug) {
	return useDisabledProducts()(slug);
}

export function ProductDisabledNotice() {
	return (
		<p className="text-sm text-destructive">{PRODUCT_DISABLED_MESSAGE}</p>
	);
}
