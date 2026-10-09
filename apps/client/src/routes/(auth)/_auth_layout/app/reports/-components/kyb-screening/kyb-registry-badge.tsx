import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { cn } from "@verifyafrica/ui/lib/utils";

import type { KybRegistry } from "./kyb-screening-sections";

export function KybRegistryBadge({ registry }: { registry: KybRegistry }) {
	return (
		<Badge
			variant="outline"
			className={cn(
				"max-w-full whitespace-normal text-left",
				registry.official === true &&
					"border-emerald-200 bg-emerald-50 text-emerald-700",
				registry.official === false &&
					"border-amber-200 bg-amber-50 text-amber-700",
			)}
		>
			{registry.name}
			{registry.official === undefined
				? null
				: registry.official
					? " · Official"
					: " · Unofficial"}
		</Badge>
	);
}
