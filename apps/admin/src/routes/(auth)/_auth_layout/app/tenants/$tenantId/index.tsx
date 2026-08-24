import {
	CreditCardIcon,
	GearIcon,
	GlobeIcon,
	LayoutIcon,
	ListBulletsIcon,
	ReceiptIcon,
	ShieldCheckIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import type { V2AxiosError } from "#/api/http/shared";
import { useTenantBillingInformationV2Query } from "#/api/http/v2/billing/billing.hooks";
import {
	useSupportedCountriesV2Query,
	useTenantUsersV2Query,
	useTenantV2DetailQuery,
	useTenantVerificationConfigsV2Query,
	useUpdateTenantV2Mutation,
} from "#/api/http/v2/tenants/tenants.hooks";
import { useWalletBalanceV2Query } from "#/api/http/v2/wallet/wallet.hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@verifyafrica/ui/components/ui/tabs";
import {
	COMPLIANCE_SUB_TABS,
	COMPLIANCE_SUB_TAB_VALUES,
	TENANT_DETAIL_TABS,
	TENANT_DETAIL_TAB_VALUES,
	type ComplianceSubTab,
	type TenantDetailTab,
} from "./-constants";
import {
	normalizeEnabledCountryCodes,
	sanitizeEnabledCountryCodes,
} from "./-data";
import { ActivityLogsTab } from "./-components/activity-logs-tab";
import { AddCreditsDialog } from "./-components/add-credits-dialog";
import { AdvancedTab } from "./-components/advanced-tab";
import { ComplianceTab } from "./-components/compliance-tab";
import { DeleteTenantDialog } from "./-components/delete-tenant-dialog";
import { EditTenantDialog } from "./-components/edit-tenant-dialog";
import { EnabledCountriesTab } from "./-components/enabled-countries-tab";
import { InviteUserDialog } from "./-components/invite-user-dialog";
import { InvoicesTab } from "./-components/invoices-tab";
import { OverviewTab } from "./-components/overview-tab";
import { TenantDetailHeader } from "./-components/tenant-detail-header";
import { TransactionsTab } from "./-components/transactions-tab";
import { UsersTab } from "./-components/users-tab";
import { VerificationConfigsTab } from "./-components/verification-configs-tab";

const tenantDetailSearchSchema = z.object({
	tab: z.enum(TENANT_DETAIL_TAB_VALUES).catch(TENANT_DETAIL_TABS.OVERVIEW),
	compliance_tab: z.enum(COMPLIANCE_SUB_TAB_VALUES).optional(),
});

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/tenants/$tenantId/",
)({
	head: () => ({
		meta: [
			{ title: "Tenant Details | VerifyAfrica" },
			{ name: "description", content: "View and manage details, activity, and settings for a specific tenant." },
		],
	}),
	validateSearch: tenantDetailSearchSchema,
	component: TenantDetailPage,
});

const TAB_ITEMS: {
	value: TenantDetailTab;
	label: string;
	icon: typeof LayoutIcon;
}[] = [
	{ value: TENANT_DETAIL_TABS.OVERVIEW, label: "Overview", icon: LayoutIcon },
	{ value: TENANT_DETAIL_TABS.USERS, label: "Users", icon: UsersIcon },
	{
		value: TENANT_DETAIL_TABS.VERIFICATION_CONFIGS,
		label: "Verification Access & Pricing",
		icon: ShieldCheckIcon,
	},
	{
		value: TENANT_DETAIL_TABS.ENABLED_COUNTRIES,
		label: "Enabled Countries",
		icon: GlobeIcon,
	},
	{
		value: TENANT_DETAIL_TABS.COMPLIANCE,
		label: "Compliance",
		icon: ShieldCheckIcon,
	},
	{ value: TENANT_DETAIL_TABS.INVOICES, label: "Invoices", icon: ReceiptIcon },
	{
		value: TENANT_DETAIL_TABS.TRANSACTIONS,
		label: "Transactions",
		icon: CreditCardIcon,
	},
	{
		value: TENANT_DETAIL_TABS.ACTIVITY_LOGS,
		label: "Activity Logs",
		icon: ListBulletsIcon,
	},
	{ value: TENANT_DETAIL_TABS.ADVANCED, label: "Advanced", icon: GearIcon },
];

function TenantDetailPage() {
	const { tenantId } = Route.useParams();
	const { tab, compliance_tab: complianceTab } = Route.useSearch();
	const navigate = useNavigate();

	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [addCreditsOpen, setAddCreditsOpen] = useState(false);
	const [inviteUserOpen, setInviteUserOpen] = useState(false);

	const tenantQuery = useTenantV2DetailQuery(tenantId);
	const billingQuery = useTenantBillingInformationV2Query(tenantId);
	const walletQuery = useWalletBalanceV2Query(tenantId);
	const usersCountQuery = useTenantUsersV2Query(tenantId, {
		page: 1,
		per_page: 1,
	});
	const countriesQuery = useSupportedCountriesV2Query();
	const verificationConfigsQuery = useTenantVerificationConfigsV2Query(tenantId);
	const updateTenantMutation = useUpdateTenantV2Mutation(tenantId);

	const tenant = tenantQuery.data;
	const defaultComplianceTab =
		tenant?.kyc?.kyc_verified || tenant?.kyc?.kyc_status === "verified"
			? COMPLIANCE_SUB_TABS.COMPANY_OVERVIEW
			: COMPLIANCE_SUB_TABS.REVIEW;
	const activeComplianceTab = complianceTab ?? defaultComplianceTab;

	const supportedCountryCodeSet = useMemo(
		() => new Set((countriesQuery.data ?? []).map((country) => country.code)),
		[countriesQuery.data],
	);
	const enabledCountries = useMemo(
		() => normalizeEnabledCountryCodes(tenant?.enabled_countries ?? []),
		[tenant?.enabled_countries],
	);

	const handleSaveEnabledCountries = (enabledCountries: string[]) => {
		const payload = sanitizeEnabledCountryCodes(
			enabledCountries,
			supportedCountryCodeSet,
		);

		updateTenantMutation.mutate(
			{ enabled_countries: payload },
			{
				onSuccess: () => {
					toast.success("Enabled countries updated successfully");
				},
				onError: (error) => {
					const axiosError = error as V2AxiosError;
					toast.error(
						axiosError.response?.data?.message ||
							"Failed to update enabled countries",
					);
				},
			},
		);
	};
	const handleRefresh = () => {
		void Promise.all([
			tenantQuery.refetch(),
			billingQuery.refetch(),
			walletQuery.refetch(),
			usersCountQuery.refetch(),
			countriesQuery.refetch(),
			verificationConfigsQuery.refetch(),
		]);
	};

	const handleTabChange = (nextTab: string) => {
		void navigate({
			to: "/app/tenants/$tenantId",
			params: { tenantId },
			search: {
				tab: nextTab as TenantDetailTab,
				...(nextTab === TENANT_DETAIL_TABS.COMPLIANCE
					? { compliance_tab: activeComplianceTab }
					: complianceTab
						? { compliance_tab: complianceTab }
						: {}),
			},
		});
	};

	const handleComplianceSubTabChange = (nextSubTab: ComplianceSubTab) => {
		void navigate({
			to: "/app/tenants/$tenantId",
			params: { tenantId },
			search: {
				tab: TENANT_DETAIL_TABS.COMPLIANCE,
				compliance_tab: nextSubTab,
			},
		});
	};

	const isRefreshing =
		tenantQuery.isFetching ||
		billingQuery.isFetching ||
		walletQuery.isFetching ||
		usersCountQuery.isFetching;

	if (tenantQuery.isError) {
		return (
			<div className="flex flex-col items-center gap-4 py-16 text-center">
				<p className="text-sm text-muted-foreground">
					Failed to load tenant details. Please try again.
				</p>
				<button
					type="button"
					className="text-sm text-primary underline"
					onClick={handleRefresh}
				>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<TenantDetailHeader
				tenantName={tenant?.name}
				isLoading={tenantQuery.isPending}
				isFetching={isRefreshing}
				onRefresh={handleRefresh}
				onEdit={() => setEditOpen(true)}
			/>

			<Tabs value={tab} onValueChange={handleTabChange} className="min-w-0">
				<div className="w-full min-w-0 overflow-x-auto no-scrollbar">
					<TabsList
						className="inline-flex h-auto w-max min-w-full justify-start gap-2"
					>
						{TAB_ITEMS.map(({ value, label, icon: Icon }) => (
							<TabsTrigger
								key={value}
								value={value}
								className="shrink-0 flex-none"
							>
								<Icon />
								{label}
							</TabsTrigger>
						))}
					</TabsList>
				</div>

				<TabsContent value={TENANT_DETAIL_TABS.OVERVIEW}>
					<OverviewTab
						tenant={tenant}
						billing={billingQuery.data}
						wallet={walletQuery.data}
						userCount={usersCountQuery.data?.meta.pagination.total ?? 0}
						isLoading={tenantQuery.isPending}
						onAddCredits={() => setAddCreditsOpen(true)}
					/>
				</TabsContent>

				<TabsContent value={TENANT_DETAIL_TABS.USERS}>
					<UsersTab
						tenantId={tenantId}
						onInviteUser={() => setInviteUserOpen(true)}
					/>
				</TabsContent>

				<TabsContent value={TENANT_DETAIL_TABS.VERIFICATION_CONFIGS}>
					<VerificationConfigsTab
						tenantId={tenantId}
						configs={verificationConfigsQuery.data?.configs ?? []}
						isLoading={verificationConfigsQuery.isPending}
					/>
				</TabsContent>

				<TabsContent value={TENANT_DETAIL_TABS.ENABLED_COUNTRIES}>
					<EnabledCountriesTab
						initialEnabledCountries={enabledCountries}
						supportedCountries={countriesQuery.data ?? []}
						isLoading={countriesQuery.isPending || tenantQuery.isPending}
						isSaving={updateTenantMutation.isPending}
						onSave={handleSaveEnabledCountries}
					/>
				</TabsContent>

				<TabsContent value={TENANT_DETAIL_TABS.COMPLIANCE}>
					<ComplianceTab
						tenant={tenant}
						tenantId={tenantId}
						activeSubTab={activeComplianceTab}
						onSubTabChange={handleComplianceSubTabChange}
						onUpdated={() => {
							void tenantQuery.refetch();
						}}
					/>
				</TabsContent>

				<TabsContent value={TENANT_DETAIL_TABS.INVOICES}>
					<InvoicesTab tenantId={tenantId} />
				</TabsContent>

				<TabsContent value={TENANT_DETAIL_TABS.TRANSACTIONS}>
					<TransactionsTab tenantId={tenantId} />
				</TabsContent>

				<TabsContent value={TENANT_DETAIL_TABS.ACTIVITY_LOGS}>
					<ActivityLogsTab tenantId={tenantId} />
				</TabsContent>

				<TabsContent value={TENANT_DETAIL_TABS.ADVANCED}>
					<AdvancedTab onDeleteTenant={() => setDeleteOpen(true)} />
				</TabsContent>
			</Tabs>

			<EditTenantDialog
				open={editOpen}
				tenantId={tenantId}
				tenantName={tenant?.name ?? ""}
				tenantEmail={tenant?.email ?? ""}
				onOpenChange={setEditOpen}
				onSuccess={() => {
					void tenantQuery.refetch();
				}}
			/>
			<AddCreditsDialog
				open={addCreditsOpen}
				tenantId={tenantId}
				tenantName={tenant?.name ?? ""}
				currency={walletQuery.data?.currency ?? "USD"}
				onOpenChange={setAddCreditsOpen}
				onSuccess={() => {
					void walletQuery.refetch();
				}}
			/>
			<InviteUserDialog
				open={inviteUserOpen}
				tenantId={tenantId}
				onOpenChange={setInviteUserOpen}
				onSuccess={() => {
					void usersCountQuery.refetch();
				}}
			/>
			<DeleteTenantDialog
				open={deleteOpen}
				tenantId={tenantId}
				tenantName={tenant?.name ?? ""}
				onOpenChange={setDeleteOpen}
				onDeleted={() => {
					void navigate({ to: "/app/tenants" });
				}}
			/>
		</div>
	);
}
