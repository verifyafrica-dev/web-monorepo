import type { ComponentProps, ComponentType } from "react";

import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@verifyafrica/ui/components/ui/tooltip";

type TeamIconActionButtonProps = {
	label: string;
	icon: ComponentType<{ className?: string }>;
	onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
	disabled?: boolean;
	variant?: ComponentProps<typeof Button>["variant"];
};

export function TeamIconActionButton({
	label,
	icon: Icon,
	onClick,
	disabled,
	variant = "outline",
}: TeamIconActionButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant={variant}
					size="icon-sm"
					className="cursor-pointer"
					disabled={disabled}
					onClick={onClick}
					aria-label={label}
				>
					<Icon className="size-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent sideOffset={6}>{label}</TooltipContent>
		</Tooltip>
	);
}
