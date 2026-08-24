import { ArrowsClockwiseIcon, EyeIcon, StackIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

import { useTenantV2DetailQuery } from "#/api/http/v2/tenants/tenants.hooks";
import { VERIFICATIONS_V2_QUERY_KEYS } from "#/api/http/v2/verifications/verifications.hooks";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@verifyafrica/ui/components/ui/tabs";
import { cn } from "@verifyafrica/ui/lib/utils";
import { DashboardOnboarding } from "../-components/dashboard-onboarding";
import { shouldShowDashboardOnboarding } from "../-data";
import { useCurrentTenant } from "../team/-data";
import { BatchVerificationsTab } from "./-components/batch-verifications-tab";
import { IndividualVerificationsTab } from "./-components/individual-verifications-tab";
import { COUNTRY_CODE_MAP } from "./-data";
import {
	mergeReportsSearchParams,
	type ReportsSearchParams,
	reportsSearchSchema,
} from "./-filter-utils";

const REPORTS_COUNTRIES = Object.values(COUNTRY_CODE_MAP).sort();

export const Route = createFileRoute("/(auth)/_auth_layout/app/reports/")({
	head: () => ({
		meta: [
			{ title: "Reports | VerifyAfrica" },
			{ name: "description", content: "View verification reports and export compliance data." },
		],
	}),
	validateSearch: reportsSearchSchema,
	component: ReportsPage,
});

function ReportsPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate({ from: Route.fullPath });
	const urlSearch = Route.useSearch();
	const { tenantId } = useCurrentTenant();
	const tenantQuery = useTenantV2DetailQuery(tenantId, Boolean(tenantId));
	const [isRefreshing, setIsRefreshing] = useState(false);

	const activeTab = urlSearch.tab ?? "individual";
	const isKycVerified = tenantQuery.data?.kyc.kyc_verified ?? false;
	const isKycLoading = tenantQuery.isPending || tenantQuery.isFetching;
	const showOnboarding =
		!tenantQuery.isError &&
		!isKycLoading &&
		shouldShowDashboardOnboarding(isKycVerified);

	const updateSearchParams = useCallback(
		(patch: Partial<ReportsSearchParams>) => {
			void navigate({
				search: (current) => mergeReportsSearchParams(current, patch),
				replace: true,
			});
		},
		[navigate],
	);

	const tabContent = useMemo(() => {
		if (!tenantId) {
			return (
				<div className="flex min-h-[320px] items-center justify-center px-6 text-sm text-muted-foreground">
					Tenant information is unavailable.
				</div>
			);
		}

		if (activeTab === "individual") {
			return (
				<IndividualVerificationsTab
					tenantId={tenantId}
					searchParams={urlSearch}
					countries={REPORTS_COUNTRIES}
					updateSearchParams={updateSearchParams}
				/>
			);
		}

		return (
			<BatchVerificationsTab
				tenantId={tenantId}
				searchParams={urlSearch}
				countries={REPORTS_COUNTRIES}
				updateSearchParams={updateSearchParams}
			/>
		);
	}, [activeTab, tenantId, urlSearch, updateSearchParams]);

	async function handleRefresh() {
		if (!tenantId) {
			return;
		}

		setIsRefreshing(true);

		try {
			if (activeTab === "individual") {
				await queryClient.invalidateQueries({
					queryKey: VERIFICATIONS_V2_QUERY_KEYS.tenantRequests(tenantId),
				});
				return;
			}

			await queryClient.invalidateQueries({
				queryKey: VERIFICATIONS_V2_QUERY_KEYS.tenantBatches(tenantId),
			});
		} finally {
			setIsRefreshing(false);
		}
	}

	return (
		<div className="flex min-w-0 flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
					<p className="text-sm text-muted-foreground">
						View and manage all verification reports
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="outline"
						className="cursor-pointer tracking-wide"
						disabled={!tenantId || isRefreshing}
						onClick={() => void handleRefresh()}
					>
						<ArrowsClockwiseIcon
							className={cn(isRefreshing && "animate-spin")}
							weight="bold"
						/>
						Refresh
					</Button>
					<Button className="cursor-pointer tracking-wide" asChild>
						<Link to="/app/products">New Verification</Link>
					</Button>
				</div>
			</div>

			{showOnboarding && <DashboardOnboarding />}

			<Card className="min-w-0 overflow-visible">
				<CardContent className="min-w-0 pt-0">
					<Tabs
						className="min-w-0 w-full"
						value={activeTab}
						onValueChange={(value) =>
							updateSearchParams({
								tab: value as ReportsSearchParams["tab"],
							})
						}
					>
						<TabsList className="mb-6 w-full justify-start">
							<TabsTrigger value="individual">
								<EyeIcon />
								Individual Verifications
							</TabsTrigger>
							<TabsTrigger value="batch">
								<StackIcon />
								Batch Verifications
							</TabsTrigger>
						</TabsList>

						{tabContent}
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
