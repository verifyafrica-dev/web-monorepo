import type { ComponentProps, ComponentType } from "react";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { cn } from "@verifyafrica/ui/lib/utils";

export function IconField({
	id,
	label,
	icon: Icon,
	type = "text",
	placeholder,
	className,
	...props
}: {
	id: string;
	label: string;
	icon: ComponentType<{ className?: string }>;
	type?: ComponentProps<"input">["type"];
	placeholder?: string;
	className?: string;
} & Omit<
	ComponentProps<"input">,
	"id" | "type" | "placeholder" | "className"
>) {
	return (
		<div className={cn("space-y-1.5", className)}>
			<Label htmlFor={id}>{label}</Label>
			<div className="relative">
				<Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					id={id}
					type={type}
					placeholder={placeholder}
					className="pl-10"
					{...props}
				/>
			</div>
		</div>
	);
}
