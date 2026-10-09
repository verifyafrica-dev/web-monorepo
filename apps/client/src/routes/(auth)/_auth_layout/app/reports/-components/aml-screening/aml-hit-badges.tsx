import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { cn } from "@verifyafrica/ui/lib/utils";

import {
	AML_CATEGORY_LABELS,
	type AmlRiskCategory,
	formatScore,
} from "./aml-sections";

const CATEGORY_CLASS_NAMES: Record<AmlRiskCategory, string> = {
	sanction: "border-red-200 bg-red-50 text-red-700",
	pep: "border-amber-200 bg-amber-50 text-amber-800",
	adverse_media: "border-orange-200 bg-orange-50 text-orange-700",
	warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
	fitness_probity: "border-violet-200 bg-violet-50 text-violet-700",
	special_interest: "border-sky-200 bg-sky-50 text-sky-700",
	other: "",
};

export function AmlCategoryBadge({
	category,
	count,
	className,
}: {
	category: AmlRiskCategory;
	count?: number;
	className?: string;
}) {
	return (
		<Badge
			variant="outline"
			className={cn(CATEGORY_CLASS_NAMES[category], className)}
		>
			{AML_CATEGORY_LABELS[category]}
			{count !== undefined ? ` · ${count}` : null}
		</Badge>
	);
}

export function AmlScoreBadge({ score }: { score?: number }) {
	const label = formatScore(score);
	if (!label || score === undefined) return null;
	const percent = score <= 1 ? score * 100 : score;

	return (
		<Badge
			variant="outline"
			className={cn(
				"tabular-nums",
				percent >= 90 && "border-red-500 bg-red-500 text-white",
				percent >= 75 &&
					percent < 90 &&
					"border-amber-500 bg-amber-500 text-white",
			)}
		>
			{label} match
		</Badge>
	);
}
