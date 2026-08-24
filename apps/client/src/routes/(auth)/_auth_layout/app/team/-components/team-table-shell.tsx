import type { ReactNode } from "react";

import { cn } from "@verifyafrica/ui/lib/utils";

export function TeamTableShell({ children }: { children: ReactNode }) {
	return (
		<div className={cn("flex min-h-[320px] flex-col justify-between")}>
			{children}
		</div>
	);
}
