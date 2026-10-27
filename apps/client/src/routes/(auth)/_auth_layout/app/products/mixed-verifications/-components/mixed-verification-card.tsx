import {
	PencilSimpleIcon,
	PlayIcon,
	StackIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";

import type {
	MixedVerification,
	MixedVerificationAvailabilityCatalog,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
import {
	isMixedStepUnavailable,
	resolveMixedTemplateAvailability,
} from "@verifyafrica/api-client/http/v2/verifications/verifications.types";
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
	availabilityCatalog?: MixedVerificationAvailabilityCatalog | null;
	onStart: (template: MixedVerification) => void;
	onEdit?: (template: MixedVerification) => void;
};

export function MixedVerificationCard({
	template,
	canManageCustom,
	availabilityCatalog,
	onStart,
	onEdit,
}: MixedVerificationCardProps) {
	const isCustom = template.is_custom;
	const resolved = resolveMixedTemplateAvailability(
		template,
		availabilityCatalog,
	);
	const isUnavailable = !resolved.available;
	const canStart = template.is_active && !isUnavailable;

	return (
		<Card
			className={cn(
				"flex h-full flex-col",
				(!template.is_active || isUnavailable) && "opacity-75",
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
							{isUnavailable ? (
								<Badge
									variant="outline"
									className="border-amber-300 bg-amber-50 text-amber-800"
								>
									<WarningCircleIcon className="size-3.5" />
									Unavailable
								</Badge>
							) : null}
						</div>
						<p className="text-sm text-muted-foreground">
							{template.description?.trim() || "No description provided."}
						</p>
						{isUnavailable && resolved.reasons.length > 0 ? (
							<p className="text-xs text-amber-800">
								{resolved.reasons[0]?.message}
								{resolved.reasons.length > 1
									? ` (+${resolved.reasons.length - 1} more)`
									: ""}
							</p>
						) : null}
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
					{template.verifications.map((verificationType) => {
						const stepUnavailable = isMixedStepUnavailable(
							verificationType,
							template,
							availabilityCatalog,
						);
						return (
							<Badge
								key={verificationType}
								variant="outline"
								className={
									stepUnavailable
										? "border-amber-300 bg-amber-50 text-amber-800"
										: "border-primary/20 bg-primary/5 text-secondary"
								}
							>
								{formatVerificationTypeLabel(verificationType)}
								{stepUnavailable ? " · Unavailable" : ""}
							</Badge>
						);
					})}
				</div>
			</CardContent>

			<CardFooter className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
				{isCustom && canManageCustom ? (
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
				) : (
					<span />
				)}

				<Button
					type="button"
					size="sm"
					className="cursor-pointer tracking-wide"
					disabled={!canStart}
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
