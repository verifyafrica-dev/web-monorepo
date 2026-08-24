import type { ReactNode } from "react";

import { cn } from "#/lib/utils.ts";

export function ReportsTableShell({ children }: { children: ReactNode }) {
	return (
		<div
			className={cn(
				"w-full max-w-full min-w-0 rounded-lg border",
				"min-h-[320px] flex flex-col justify-between",
			)}
		>
			{children}
		</div>
	);
}
