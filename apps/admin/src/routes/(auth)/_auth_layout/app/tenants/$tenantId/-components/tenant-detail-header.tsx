import {
	ArrowLeftIcon,
	ArrowClockwiseIcon,
	BuildingsIcon,
	PencilSimpleIcon,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { cn } from "#/lib/utils.ts";

export function TenantDetailHeader({
	tenantName,
	isFetching,
	isLoading,
	onRefresh,
	onEdit,
}: {
	tenantName?: string;
	isFetching?: boolean;
	isLoading?: boolean;
	onRefresh: () => void;
	onEdit: () => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<Button
				variant="ghost"
				className="w-fit text-muted-foreground hover:text-foreground font-medium"
				asChild
			>
				<Link to="/app/tenants">
					<ArrowLeftIcon />
					Back to All Tenants
				</Link>
			</Button>

			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex items-center gap-4">
					<div className="flex size-14 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
						<BuildingsIcon className="size-7" weight="fill" />
					</div>
					<div>
						{isLoading ? (
							<Skeleton className="h-9 w-64" />
						) : (
							<h1 className="text-2xl font-semibold tracking-tight capitalize">
								{tenantName}
							</h1>
						)}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button variant="outline" onClick={onEdit} disabled={isLoading}>
						<PencilSimpleIcon />
						Edit Tenant
					</Button>
					<Button onClick={onRefresh} disabled={isFetching || isLoading}>
						<ArrowClockwiseIcon
							className={cn(isFetching && "animate-spin")}
							weight="bold"
						/>
						Refresh
					</Button>
				</div>
			</div>
		</div>
	);
}
