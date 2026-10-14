import { useMemo } from "react";

import { useCurrentTenant } from "../team/-data";
import type { ProductSlug } from "./-data";

export const PRODUCT_DISABLED_MESSAGE =
	"This product has been disabled for your account, kindly contact support@verifyafrica.io";

/** Backend product keys use underscores (`document_verification`); route slugs use hyphens. */
function toProductKey(slug: ProductSlug) {
	return slug.replaceAll("-", "_");
}

export function useDisabledProducts() {
	const { tenant } = useCurrentTenant();
	const disabledProducts = tenant?.disabled_products;

	return useMemo(() => {
		const keys = new Set(disabledProducts ?? []);
		return (slug: ProductSlug) => keys.has(toProductKey(slug));
	}, [disabledProducts]);
}

export function useIsProductDisabled(slug: ProductSlug) {
	return useDisabledProducts()(slug);
}

export function ProductDisabledNotice() {
	return (
		<p className="text-sm text-destructive">
			{PRODUCT_DISABLED_MESSAGE}
		</p>
	);
}
