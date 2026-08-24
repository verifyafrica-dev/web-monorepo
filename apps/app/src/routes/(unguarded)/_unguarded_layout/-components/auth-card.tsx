import type { ReactNode } from "react";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { cn } from "@verifyafrica/ui/lib/utils";

export function AuthCard({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex min-h-screen flex-col items-center justify-center px-4 py-12",
				className,
			)}
		>
			<Card className="w-full max-w-md shadow-lg">
				<CardContent className="flex flex-col gap-6 pt-6">{children}</CardContent>
			</Card>
		</div>
	);
}
