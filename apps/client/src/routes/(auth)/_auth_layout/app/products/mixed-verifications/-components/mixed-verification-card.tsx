import {
	PencilSimpleIcon,
	PlayIcon,
	StackIcon,
	TrashIcon,
} from "@phosphor-icons/react";

import type { MixedVerification } from "#/api/http/v2/verifications/verifications.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@verifyafrica/ui/components/ui/card";
import { cn } from "@verifyafrica/ui/lib/utils";
import { formatVerificationTypeLabel } from "../-data";

type MixedVerificationCardProps = {
	template: MixedVerification;
	canManageCustom: boolean;
	onStart: (template: MixedVerification) => void;
	onEdit?: (template: MixedVerification) => void;
	onDelete?: (template: MixedVerification) => void;
};

export function MixedVerificationCard({
	template,
	canManageCustom,
	onStart,
	onEdit,
	onDelete,
}: MixedVerificationCardProps) {
	const isCustom = template.is_custom;

	return (
		<Card
			className={cn(
				"flex h-full flex-col",
				!template.is_active && "opacity-75",
			)}
		>
			<CardHeader className="gap-4 pb-3">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="text-base font-semibold leading-tight">
								{template.name}
							</h3>
							<Badge>{isCustom ? "Custom" : "Platform"}</Badge>
							{!template.is_active && <Badge variant="outline">Disabled</Badge>}
						</div>
						<p className="text-sm text-muted-foreground">
							{template.description?.trim() || "No description provided."}
						</p>
					</div>
					<div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
						<StackIcon
							className="size-5"
							weight="duotone"
						/>
					</div>
				</div>
			</CardHeader>

			<CardContent className="flex-1 pb-3">
				<div className="flex flex-wrap gap-2">
					{template.verifications.map((verificationType) => (
						<Badge
							key={verificationType}
							variant="outline"
							className="border-primary/20 bg-primary/5 text-secondary"
						>
							{formatVerificationTypeLabel(verificationType)}
						</Badge>
					))}
				</div>
			</CardContent>

			<CardFooter className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
				{isCustom && canManageCustom ? (
					<div className="flex items-center gap-1">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="cursor-pointer text-muted-foreground"
							onClick={() => onEdit?.(template)}
						>
							<PencilSimpleIcon className="size-4" />
							Edit
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="cursor-pointer text-destructive hover:text-destructive"
							onClick={() => onDelete?.(template)}
						>
							<TrashIcon className="size-4" />
							Delete
						</Button>
					</div>
				) : (
					<span />
				)}

				<Button
					type="button"
					size="sm"
					className="cursor-pointer tracking-wide"
					disabled={!template.is_active}
					onClick={() => onStart(template)}
				>
					<PlayIcon
						className="size-4"
						weight="fill"
					/>
					Start
				</Button>
			</CardFooter>
		</Card>
	);
}
