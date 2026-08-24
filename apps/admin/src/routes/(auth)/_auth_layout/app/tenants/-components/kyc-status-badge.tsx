import {
	CheckCircleIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { cn } from "@verifyafrica/ui/lib/utils";
import type { KycDisplayStatus } from "../-data";

const KYC_STATUS_CONFIG: Record<
	KycDisplayStatus,
	{
		label: string;
		className: string;
		icon: typeof CheckCircleIcon;
	}
> = {
	verified: {
		label: "Verified",
		className: "border-emerald-200 bg-emerald-50 text-emerald-700",
		icon: CheckCircleIcon,
	},
	pending: {
		label: "Pending",
		className: "border-amber-200 bg-amber-50 text-amber-700",
		icon: CheckCircleIcon,
	},
	not_started: {
		label: "Not Started",
		className: "border-red-200 bg-red-50 text-red-700",
		icon: XCircleIcon,
	},
};

export function KycStatusBadge({ status }: { status: KycDisplayStatus }) {
	const config = KYC_STATUS_CONFIG[status];
	const Icon = config.icon;

	return (
		<Badge
			variant="outline"
			className={cn("gap-1 font-semibold", config.className)}
		>
			<Icon weight="fill" />
			{config.label}
		</Badge>
	);
}
