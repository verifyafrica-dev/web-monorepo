import {
	BuildingsIcon,
	CalendarBlankIcon,
	CheckCircleIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { cn } from "@verifyafrica/ui/lib/utils";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { formatAdminNumber } from "../../-data";
import type { TenantStats } from "../-data";

function StatCard({
	icon: Icon,
	iconClassName,
	value,
	label,
}: {
	icon: typeof BuildingsIcon;
	iconClassName: string;
	value: string;
	label: string;
}) {
	return (
		<Card>
			<CardContent className="flex flex-col gap-3">
				<div
					className={cn(
						"flex size-10 items-center justify-center rounded-xl",
						iconClassName,
					)}
				>
					<Icon className="size-5" weight="fill" />
				</div>
				<div>
					<p className="text-2xl font-semibold tracking-tight tabular-nums">
						{value}
					</p>
					<p className="text-sm text-muted-foreground">{label}</p>
				</div>
			</CardContent>
		</Card>
	);
}

export function TenantsStatCards({ stats }: { stats: TenantStats }) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<StatCard
				icon={BuildingsIcon}
				iconClassName="bg-blue-100 text-blue-600"
				value={formatAdminNumber(stats.totalTenants)}
				label="Total Tenants"
			/>
			<StatCard
				icon={CheckCircleIcon}
				iconClassName="bg-emerald-100 text-emerald-600"
				value={formatAdminNumber(stats.kycVerified)}
				label="KYC Verified"
			/>
			<StatCard
				icon={XCircleIcon}
				iconClassName="bg-amber-100 text-amber-600"
				value={formatAdminNumber(stats.pendingKyc)}
				label="Pending KYC"
			/>
			<StatCard
				icon={CalendarBlankIcon}
				iconClassName="bg-violet-100 text-violet-600"
				value={formatAdminNumber(stats.newThisMonth)}
				label="New This Month"
			/>
		</div>
	);
}

export function TenantsStatCardsSkeleton() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{createSkeletonKeys(4, "tenant-stat").map((key) => (
				<Card key={key}>
					<CardContent className="flex flex-col gap-3">
						<Skeleton className="size-10 rounded-xl" />
						<div className="space-y-2">
							<Skeleton className="h-8 w-16" />
							<Skeleton className="h-4 w-28" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
