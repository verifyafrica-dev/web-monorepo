import {
	ArrowClockwiseIcon,
	BuildingsIcon,
	CalendarBlankIcon,
	DownloadSimpleIcon,
	FunnelIcon,
	MagnifyingGlassIcon,
	PlusIcon,
} from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import type { TenantAllListItem } from "@verifyafrica/api-client/http/v2/tenants/tenants.types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { usePlatformAnalyticsV2Query } from "#/api/http/v2/analytics/analytics.hooks";
import {
	useTenantsAllV2Query,
	useUpdateTenantTestAccessV2Mutation,
} from "#/api/http/v2/tenants/tenants.hooks";
import { env } from "#/config/env";
import { useApiModeStore } from "#/stores/api-mode-store";
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
import { Switch } from "@verifyafrica/ui/components/ui/switch";
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
	mergeTenantsSearchParams,
	resolveTestAccessFilter,
	TEST_ACCESS_FILTER_OPTIONS,
	type TestAccessFilter,
	type TenantsSearchParams,
	tenantsSearchSchema,
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
	validateSearch: tenantsSearchSchema,
	component: TenantsPage,
});

function TenantsPage() {
	const navigate = useNavigate({ from: Route.fullPath });
	const urlSearch = Route.useSearch();
	const page = urlSearch.page ?? 1;
	const billingPlanFilter = (urlSearch.billing_plan ?? "all") as BillingPlanFilter;
	const kycStatusFilter = (urlSearch.kyc_status ?? "all") as KycStatusFilter;
	const testAccessFilter = resolveTestAccessFilter(urlSearch);

	const [searchDraft, setSearchDraft] = useState(urlSearch.search ?? "");
	const [addTenantOpen, setAddTenantOpen] = useState(false);
	const [isDownloadingStatement, setIsDownloadingStatement] = useState(false);
	const debouncedSearch = useDebouncedValue(searchDraft, 300);

	const updateSearchParams = useCallback(
		(patch: Partial<TenantsSearchParams>) => {
			void navigate({
				search: (current) => mergeTenantsSearchParams(current, patch),
				replace: true,
			});
		},
		[navigate],
	);

	useEffect(() => {
		setSearchDraft(urlSearch.search ?? "");
	}, [urlSearch.search]);

	useEffect(() => {
		const nextSearch = debouncedSearch.trim();
		const currentSearch = (urlSearch.search ?? "").trim();
		if (nextSearch === currentSearch) {
			return;
		}
		updateSearchParams({
			search: nextSearch || undefined,
			page: undefined,
		});
	}, [debouncedSearch, urlSearch.search, updateSearchParams]);

	// Migrate legacy `tab=test_access_disabled` bookmarks to `test_access=disabled`.
	useEffect(() => {
		if (urlSearch.tab === "test_access_disabled" && !urlSearch.test_access) {
			updateSearchParams({
				test_access: "disabled",
				tab: undefined,
			});
		}
	}, [urlSearch.tab, urlSearch.test_access, updateSearchParams]);

	const tenantListQuery = useMemo(
		() =>
			buildTenantAllListQuery({
				page,
				perPage: PAGE_SIZE,
				search: debouncedSearch,
				billingPlanFilter,
				kycStatusFilter,
				testAccessFilter,
			}),
		[page, debouncedSearch, billingPlanFilter, kycStatusFilter, testAccessFilter],
	);

	const tenantsQuery = useTenantsAllV2Query(tenantListQuery);
	const analyticsQuery = usePlatformAnalyticsV2Query();

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

	const openTenant = (tenantId: string) => {
		void navigate({
			to: "/app/tenants/$tenantId",
			params: { tenantId },
			search: { tab: "overview" },
		});
	};

	const hasActiveFilters =
		debouncedSearch.trim().length > 0 ||
		billingPlanFilter !== "all" ||
		kycStatusFilter !== "all" ||
		testAccessFilter !== "all";

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
					value={searchDraft}
					onChange={(event) => setSearchDraft(event.target.value)}
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

					<div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:max-w-3xl">
						<Select
							value={billingPlanFilter}
							onValueChange={(value) =>
								updateSearchParams({
									billing_plan: value as BillingPlanFilter,
									page: undefined,
								})
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
								updateSearchParams({
									kyc_status: value as KycStatusFilter,
									page: undefined,
								})
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

						<Select
							value={testAccessFilter}
							onValueChange={(value) =>
								updateSearchParams({
									test_access: value as TestAccessFilter,
									tab: undefined,
									page: undefined,
								})
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Test access" />
							</SelectTrigger>
							<SelectContent>
								{TEST_ACCESS_FILTER_OPTIONS.map((option) => (
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
								setSearchDraft("");
								updateSearchParams({
									search: undefined,
									billing_plan: "all",
									kyc_status: "all",
									test_access: "all",
									tab: undefined,
									page: undefined,
								});
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
										<TableHead className="min-w-[180px] text-center">
											Test Access
										</TableHead>
										<TableHead className="min-w-[220px]">
											Created Date
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{tenants.map((tenant) => (
										<TenantRow
											key={tenant.id}
											tenant={tenant}
											onOpen={() => openTenant(tenant.id)}
										/>
									))}
								</TableBody>
							</Table>
						</div>

						<TablePagination
							page={page}
							pageSize={PAGE_SIZE}
							total={totalTenants}
							onPageChange={(nextPage) =>
								updateSearchParams({
									page: nextPage > 1 ? nextPage : undefined,
								})
							}
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

function TenantRow({
	tenant,
	onOpen,
}: {
	tenant: TenantAllListItem;
	onOpen: () => void;
}) {
	const apiMode = useApiModeStore((s) => s.mode);
	const canManage = env.envState === "production" && apiMode === "live";
	const mutation = useUpdateTenantTestAccessV2Mutation(tenant.id);
	const enabled = Boolean(tenant.test_access_enabled);
	const avatarColor = getTenantAvatarColor(tenant.name);

	async function handleToggle(next: boolean) {
		if (!canManage || mutation.isPending) return;
		try {
			await mutation.mutateAsync({ test_access_enabled: next });
			toast.success(
				next
					? `Test access enabled for ${tenant.name}`
					: `Test access disabled for ${tenant.name}`,
			);
		} catch (error) {
			toast.error(getV2ErrorMessage(error) || "Failed to update test access");
		}
	}

	return (
		<TableRow
			className="cursor-pointer"
			onClick={onOpen}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onOpen();
				}
			}}
			tabIndex={0}
		>
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
						<p className="truncate font-medium">{tenant.name}</p>
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
				<KycStatusBadge status={getKycDisplayStatus(tenant)} />
			</TableCell>
			<TableCell
				className="text-center"
				onClick={(event) => event.stopPropagation()}
				onKeyDown={(event) => event.stopPropagation()}
			>
				<div className="inline-flex items-center gap-2">
					<Switch
						checked={enabled}
						disabled={!canManage || mutation.isPending}
						onCheckedChange={(checked) => void handleToggle(checked)}
						aria-label={`Toggle test access for ${tenant.name}`}
					/>
					<span className="text-xs text-muted-foreground">
						{!canManage && env.envState === "production" && apiMode === "test"
							? "Live only"
							: enabled
								? "On"
								: "Off"}
					</span>
				</div>
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-2 text-sm">
					<CalendarBlankIcon className="size-4 text-muted-foreground" />
					<span>{formatTenantDate(tenant.created_at)}</span>
				</div>
			</TableCell>
		</TableRow>
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
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-4 w-40" />
				</div>
			))}
		</div>
	);
}
