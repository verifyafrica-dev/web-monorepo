import { useNavigate } from "@tanstack/react-router";
import { TableRow } from "@verifyafrica/ui/components/ui/table";
import { cn } from "@verifyafrica/ui/lib/utils";
import type { MouseEvent, ReactNode } from "react";

const INTERACTIVE_SELECTOR =
	"a, button, input, select, textarea, label, [role='button'], [role='checkbox'], [role='menuitem']";

/**
 * A table row that opens `href` when clicked anywhere. The row's own links stay
 * the keyboard and screen-reader entry point, so the row isn't focusable itself.
 */
export function ClickableTableRow({
	href,
	className,
	children,
}: {
	href: string;
	className?: string;
	children: ReactNode;
}) {
	const navigate = useNavigate();

	function handleClick(event: MouseEvent<HTMLTableRowElement>) {
		const target = event.target as HTMLElement;
		if (target.closest(INTERACTIVE_SELECTOR)) return;
		if (window.getSelection()?.toString()) return;

		if (event.metaKey || event.ctrlKey || event.shiftKey) {
			window.open(href, "_blank", "noopener");
			return;
		}
		void navigate({ href });
	}

	function handleAuxClick(event: MouseEvent<HTMLTableRowElement>) {
		if (event.button !== 1) return;
		if ((event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return;
		window.open(href, "_blank", "noopener");
	}

	return (
		<TableRow
			className={cn("cursor-pointer", className)}
			onClick={handleClick}
			onAuxClick={handleAuxClick}
		>
			{children}
		</TableRow>
	);
}
