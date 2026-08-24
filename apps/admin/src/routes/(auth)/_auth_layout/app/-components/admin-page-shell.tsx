import type { ReactNode } from "react";

export function AdminPageShell({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children?: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
			{children ?? (
				<div className="rounded-xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
					This page is ready for implementation.
				</div>
			)}
		</div>
	);
}
