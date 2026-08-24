import type { ComponentType } from "react";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { cn } from "#/lib/utils.ts";

export function TenantDetailStatCard({
	icon: Icon,
	iconClassName,
	value,
	label,
}: {
	icon: ComponentType<{ className?: string; weight?: "fill" | "regular" }>;
	iconClassName: string;
	value: string;
	label: string;
}) {
	return (
		<Card>
			<CardContent className="flex flex-col gap-3">
				<div
					className={cn(
						"flex size-10 items-center justify-center rounded-xl",
						iconClassName,
					)}
				>
					<Icon className="size-5" weight="fill" />
				</div>
				<div>
					<p className="text-2xl font-semibold tracking-tight tabular-nums">
						{value}
					</p>
					<p className="text-sm text-muted-foreground">{label}</p>
				</div>
			</CardContent>
		</Card>
	);
}
