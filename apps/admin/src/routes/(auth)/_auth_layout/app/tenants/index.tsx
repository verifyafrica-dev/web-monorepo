import {
	ArrowClockwiseIcon,
	BuildingsIcon,
	CalendarBlankIcon,
	CaretRightIcon,
	DownloadSimpleIcon,
	FunnelIcon,
	MagnifyingGlassIcon,
	PlusIcon,
} from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { usePlatformAnalyticsV2Query } from "#/api/http/v2/analytics/analytics.hooks";
import { useTenantsAllV2Query } from "#/api/http/v2/tenants/tenants.hooks";
import {
	TablePagination,
	TablePaginationSkeleton,
} from "@verifyafrica/ui/components/ui-extended/table-pagination";
import { useDebouncedValue } from "@verifyafrica/ui/hooks/use-debounced-value";
import { Avatar, AvatarFallback } from "@verifyafrica/ui/components/ui/avatar";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card } from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@verifyafrica/ui/components/ui/table";
import { getUserInitials } from "#/lib/user.ts";
import { cn } from "@verifyafrica/ui/lib/utils";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { AddTenantDialog } from "./-components/add-tenant-dialog";
import { KycStatusBadge } from "./-components/kyc-status-badge";
import {
	TenantsStatCards,
	TenantsStatCardsSkeleton,
} from "./-components/tenants-stat-cards";
import {
	BILLING_PLAN_FILTER_OPTIONS,
	type BillingPlanFilter,
	buildTenantAllListQuery,
	downloadTenantStatements,
	formatTenantDate,
	getBillingPlanLabel,
	getKycDisplayStatus,
	getTenantAvatarColor,
	KYC_STATUS_FILTER_OPTIONS,
	type KycStatusFilter,
	mapPlatformAnalyticsToTenantStats,
} from "./-data";

const PAGE_SIZE = 20;

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/tenants/",
)({
	head: () => ({
		meta: [
			{ title: "Tenants | VerifyAfrica" },
			{ name: "description", content: "Review and manage all tenant organizations on VerifyAfrica." },
		],
	}),
	component: TenantsPage,
});

function TenantsPage() {
	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const [billingPlanFilter, setBillingPlanFilter] =
		useState<BillingPlanFilter>("all");
	const [kycStatusFilter, setKycStatusFilter] =
		useState<KycStatusFilter>("all");
	const [addTenantOpen, setAddTenantOpen] = useState(false);
	const [isDownloadingStatement, setIsDownloadingStatement] = useState(false);
	const debouncedSearch = useDebouncedValue(searchQuery, 300);

	const tenantListQuery = useMemo(
		() =>
			buildTenantAllListQuery({
				page,
				perPage: PAGE_SIZE,
				search: debouncedSearch,
				billingPlanFilter,
				kycStatusFilter,
			}),
		[page, debouncedSearch, billingPlanFilter, kycStatusFilter],
	);

	const tenantsQuery = useTenantsAllV2Query(tenantListQuery);
	const analyticsQuery = usePlatformAnalyticsV2Query();

	useEffect(() => {
		setPage(1);
	}, []);

	const tenants = tenantsQuery.data?.items ?? [];

	const stats = useMemo(
		() => mapPlatformAnalyticsToTenantStats(analyticsQuery.data),
		[analyticsQuery.data],
	);

	const totalTenants = tenantsQuery.data?.meta.pagination.total ?? 0;
	const isLoading = tenantsQuery.isPending || (tenantsQuery.isFetching && !tenantsQuery.data);
	const isRefreshing = tenantsQuery.isFetching || analyticsQuery.isFetching;

	const handleRefresh = () => {
		void Promise.all([tenantsQuery.refetch(), analyticsQuery.refetch()]);
	};

	const handleDownloadStatement = async () => {
		try {
			setIsDownloadingStatement(true);
			await downloadTenantStatements();
			toast.success("Statement downloaded");
		} catch {
			toast.error("Failed to download statement. Please try again.");
		} finally {
			setIsDownloadingStatement(false);
		}
	};

	const hasActiveFilters =
		debouncedSearch.trim().length > 0 ||
		billingPlanFilter !== "all" ||
		kycStatusFilter !== "all";

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">All Tenants</h1>
					<p className="text-sm text-muted-foreground">
						Manage and monitor all tenant accounts
					</p>
				</div>

				<Button onClick={() => setAddTenantOpen(true)}>
					<PlusIcon weight="bold" />
					Add Tenant
				</Button>
			</div>

			{analyticsQuery.isPending && !analyticsQuery.data ? (
				<TenantsStatCardsSkeleton />
			) : (
				<TenantsStatCards stats={stats} />
			)}

			<div className="relative">
				<MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={searchQuery}
					onChange={(event) => setSearchQuery(event.target.value)}
					placeholder="Search tenants by name..."
					className="pl-9"
				/>
			</div>

			<Card className="gap-0 py-0">
				<div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center">
					<div className="flex items-center gap-2">
						<FunnelIcon className="size-4 text-muted-foreground" />
						<span className="text-sm font-medium">Filters:</span>
					</div>

					<div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
						<Select
							value={billingPlanFilter}
							onValueChange={(value) =>
								setBillingPlanFilter(value as BillingPlanFilter)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Billing Plan" />
							</SelectTrigger>
							<SelectContent>
								{BILLING_PLAN_FILTER_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={kycStatusFilter}
							onValueChange={(value) =>
								setKycStatusFilter(value as KycStatusFilter)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="KYC Status" />
							</SelectTrigger>
							<SelectContent>
								{KYC_STATUS_FILTER_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{hasActiveFilters ? (
						<Button
							variant="outline"
							onClick={() => {
								setSearchQuery("");
								setBillingPlanFilter("all");
								setKycStatusFilter("all");
							}}
						>
							Clear Filters
						</Button>
					) : null}

					<div className="flex flex-col gap-2 sm:flex-row lg:ml-auto">
						<Button
							variant="outline"
							onClick={() => void handleDownloadStatement()}
							disabled={isDownloadingStatement || isRefreshing}
						>
							<DownloadSimpleIcon
								className={isDownloadingStatement ? "animate-pulse" : undefined}
							/>
							Download Statement
						</Button>
						<Button
							variant="outline"
							onClick={handleRefresh}
							disabled={isRefreshing}
						>
							<ArrowClockwiseIcon
								className={isRefreshing ? "animate-spin" : undefined}
								weight="bold"
							/>
							Refresh
						</Button>
					</div>
				</div>

				{tenantsQuery.isError ? (
					<div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
						<p className="text-sm text-muted-foreground">
							Failed to load tenants. Please try again.
						</p>
						<Button onClick={handleRefresh}>Try Again</Button>
					</div>
				) : isLoading ? (
					<div className="p-4">
						<TenantsTableSkeleton />
						<TablePaginationSkeleton />
					</div>
				) : tenants.length === 0 ? (
					<div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
						<BuildingsIcon className="size-10 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">
							{hasActiveFilters
								? "No tenants found matching your filters"
								: "No tenants available"}
						</p>
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="min-w-[260px]">
											Tenant Name
										</TableHead>
										<TableHead className="text-center">
											Billing Plan
										</TableHead>
										<TableHead className="text-center">
											KYC Status
										</TableHead>
										<TableHead className="min-w-[220px]">
											Created Date
										</TableHead>
										<TableHead className="text-center">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{tenants.map((tenant) => {
										const avatarColor = getTenantAvatarColor(tenant.name);

										return (
											<TableRow key={tenant.id}>
												<TableCell>
													<div className="flex items-center gap-3">
														<Avatar className="size-10 rounded-lg">
															<AvatarFallback
																className={cn(
																	"rounded-lg text-sm font-semibold",
																	avatarColor.bg,
																	avatarColor.text,
																)}
															>
																{getUserInitials(tenant.name).slice(0, 1)}
															</AvatarFallback>
														</Avatar>
														<div className="min-w-0">
															<p className="truncate font-medium">
																{tenant.name}
															</p>
															<p className="truncate text-xs text-muted-foreground">
																ID: {tenant.slug}
															</p>
														</div>
													</div>
												</TableCell>
												<TableCell className="text-center">
													<Badge
														variant="outline"
														className="border-blue-200 bg-blue-50 font-semibold text-blue-700"
													>
														{getBillingPlanLabel(tenant.billing?.billing_plan)}
													</Badge>
												</TableCell>
												<TableCell className="text-center">
													<KycStatusBadge
														status={getKycDisplayStatus(tenant)}
													/>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2 text-sm">
														<CalendarBlankIcon className="size-4 text-muted-foreground" />
														<span>{formatTenantDate(tenant.created_at)}</span>
													</div>
												</TableCell>
												<TableCell className="text-center">
													<Button
														variant="link"
														className="h-auto px-0"
														asChild
													>
														<Link
															to="/app/tenants/$tenantId"
															params={{ tenantId: tenant.id }}
															search={{ tab: "overview" }}
														>
															View Details
															<CaretRightIcon />
														</Link>
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>

						<TablePagination
							page={page}
							pageSize={PAGE_SIZE}
							total={totalTenants}
							onPageChange={setPage}
						/>
					</>
				)}
			</Card>

			<AddTenantDialog
				open={addTenantOpen}
				onOpenChange={setAddTenantOpen}
			/>
		</div>
	);
}

function TenantsTableSkeleton() {
	return (
		<div className="space-y-3">
			{createSkeletonKeys(6, "tenant-row").map((key) => (
				<div key={key} className="flex items-center gap-4 px-2">
					<Skeleton className="size-10 rounded-lg" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-3 w-24" />
					</div>
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-6 w-24" />
					<Skeleton className="h-4 w-40" />
					<Skeleton className="h-4 w-24" />
				</div>
			))}
		</div>
	);
}
