import type { ReactNode } from "react";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { cn } from "@verifyafrica/ui/lib/utils";

export function AuthPageShell({
	title,
	subtitle,
	children,
	footer,
	className,
}: {
	title: string;
	subtitle: string;
	children: ReactNode;
	footer?: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex min-h-dvh flex-col items-center justify-center px-4 py-12",
				className,
			)}
		>
			<div className="mb-8 w-full max-w-md text-center">
				<h1 className="text-3xl font-semibold tracking-tight text-foreground">
					{title}
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
			</div>
			<Card className="w-full max-w-md shadow-lg">
				<CardContent className="flex flex-col gap-6 pt-6">
					{children}
				</CardContent>
			</Card>
			{footer}
		</div>
	);
}
