import { cn } from "#/lib/utils.ts";

export function getVerificationStatusBadgeClassName(status: string) {
	const baseClasses =
		"inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase";

	const normalized = status.toLowerCase();

	if (normalized === "success" || normalized === "completed") {
		return cn(baseClasses, "bg-emerald-600 text-white");
	}

	if (normalized === "failed" || normalized === "error") {
		return cn(baseClasses, "bg-red-600 text-white");
	}

	if (normalized === "pending") {
		return cn(baseClasses, "bg-amber-100 text-amber-800");
	}

	return cn(baseClasses, "bg-muted text-muted-foreground");
}

export function VerificationStatusBadge({ status }: { status: string }) {
	return (
		<span className={getVerificationStatusBadgeClassName(status)}>
			{status}
		</span>
	);
}

export function BatchCountBadge({
	count,
	variant,
}: {
	count: number;
	variant: "success" | "error";
}) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
				variant === "success"
					? "border-emerald-200 bg-emerald-50 text-emerald-700"
					: "border-red-200 bg-red-50 text-red-700",
			)}
		>
			{count}
		</span>
	);
}
