import { ArrowLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { cn } from "@verifyafrica/ui/lib/utils";
import { type ReactNode, useEffect, useState } from "react";

/** Scrolls the element with the given id into view when it is off screen. */
export function useScrollToElement() {
	const [target, setTarget] = useState<string>();

	useEffect(() => {
		if (!target) return;
		const frame = requestAnimationFrame(() => {
			const element = document.getElementById(target);
			const top = element?.getBoundingClientRect().top;
			if (
				element &&
				top !== undefined &&
				(top < 0 || top > window.innerHeight)
			) {
				element.scrollIntoView({ behavior: "smooth", block: "start" });
			}
			setTarget(undefined);
		});
		return () => cancelAnimationFrame(frame);
	}, [target]);

	return setTarget;
}

export function ReportCardGrid({ children }: { children: ReactNode }) {
	return (
		<div className="@container">
			<div className="grid gap-3 @xl:grid-cols-2 @3xl:grid-cols-3">
				{children}
			</div>
		</div>
	);
}

const CARD_CLASS_NAME =
	"group flex h-full flex-col gap-4 rounded-lg border bg-card p-4 text-left";

export function ReportSelectableCard({
	id,
	onSelect,
	className,
	children,
}: {
	id: string;
	onSelect: () => void;
	className?: string;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			id={id}
			onClick={onSelect}
			className={cn(
				CARD_CLASS_NAME,
				"scroll-mt-6 cursor-pointer transition-colors outline-none hover:border-primary/60 hover:bg-muted/40 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50",
				className,
			)}
		>
			<div className="flex min-w-0 flex-1">{children}</div>
			<span className="flex items-center gap-1 text-xs font-medium text-primary">
				View details
				<CaretRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
			</span>
		</button>
	);
}

/** Static card for PDFs that jumps to the detail panel with `targetId`. */
export function ReportPdfCard({
	targetId,
	children,
}: {
	targetId: string;
	children: ReactNode;
}) {
	return (
		<div data-pdf-target={targetId} className={CARD_CLASS_NAME}>
			<div className="flex min-w-0 flex-1">{children}</div>
			<span className="flex items-center gap-1 text-xs font-medium text-primary">
				View details
				<CaretRightIcon className="size-3.5" />
			</span>
		</div>
	);
}

export function ReportCardDetailPanel({
	id,
	href,
	summary,
	children,
}: {
	id?: string;
	/** Makes the summary a link in PDFs. */
	href?: string;
	summary: ReactNode;
	children: ReactNode;
}) {
	return (
		<div id={id} className="rounded-lg border bg-card [&_a]:no-underline">
			<div data-pdf-href={href} className="px-4 py-4">
				{summary}
			</div>
			<div className="border-t px-4 py-4">{children}</div>
		</div>
	);
}

export function ReportCardDetailView({
	backLabel,
	onBack,
	position,
	children,
}: {
	backLabel: string;
	onBack: () => void;
	position?: string;
	children: ReactNode;
}) {
	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="cursor-pointer"
					onClick={onBack}
				>
					<ArrowLeftIcon />
					{backLabel}
				</Button>
				{position ? (
					<p className="text-xs text-muted-foreground tabular-nums">
						{position}
					</p>
				) : null}
			</div>
			{children}
		</div>
	);
}
