import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

type TypeBadgeProps = {
	label: string;
	className?: string;
};

/** Generic label badge for entity/types (verification type, category, etc.). */
export function TypeBadge({ label, className }: TypeBadgeProps) {
	return (
		<Badge
			variant="outline"
			className={cn(
				"whitespace-nowrap border-primary/30 text-primary",
				className,
			)}
		>
			{label}
		</Badge>
	);
}
