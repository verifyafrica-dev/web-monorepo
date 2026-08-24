import {
	ActivityIcon,
	BuildingsIcon,
	CreditCardIcon,
	CurrencyDollarIcon,
	EnvelopeSimpleIcon,
	MapPinIcon,
	ShieldCheckIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import type { BillingInformation } from "#/api/http/v2/billing/billing.types";
import type { TenantDetail } from "#/api/http/v2/tenants/tenants.types";
import type { Wallet } from "#/api/http/v2/wallet/wallet.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { getBillingPlanLabel } from "../../-data";
import { KycStatusBadge } from "../../-components/kyc-status-badge";
import {
	formatTenantCurrency,
	getKycDisplayStatusFromKyc,
	getTenantKycLabel,
} from "../-data";
import { TenantDetailStatCard } from "./tenant-detail-stat-card";

export function OverviewTab({
	tenant,
	billing,
	wallet,
	userCount,
	isLoading,
	onAddCredits,
}: {
	tenant?: TenantDetail;
	billing?: BillingInformation | null;
	wallet?: Wallet;
	userCount?: number;
	isLoading?: boolean;
	onAddCredits: () => void;
}) {
	if (isLoading || !tenant) {
		return <OverviewTabSkeleton />;
	}

	const kycStatus = getKycDisplayStatusFromKyc(tenant.kyc);

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<TenantDetailStatCard
					icon={ShieldCheckIcon}
					iconClassName="bg-emerald-100 text-emerald-600"
					value={getTenantKycLabel(tenant)}
					label="KYC Status"
				/>
				<TenantDetailStatCard
					icon={UsersIcon}
					iconClassName="bg-blue-100 text-blue-600"
					value={String(userCount ?? 0)}
					label="Total Users"
				/>
				<TenantDetailStatCard
					icon={CurrencyDollarIcon}
					iconClassName="bg-violet-100 text-violet-600"
					value={formatTenantCurrency(Number(wallet?.balance ?? 0))}
					label="Wallet Balance"
				/>
				<TenantDetailStatCard
					icon={ActivityIcon}
					iconClassName="bg-amber-100 text-amber-600"
					value="Active"
					label="Status"
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between gap-4">
						<CardTitle className="font-semibold">Basic Information</CardTitle>
						<Button size="sm" onClick={onAddCredits}>
							Add Credits
						</Button>
					</CardHeader>
					<CardContent className="space-y-4">
						<InfoField label="Tenant ID" value={tenant.id} mono />
						<InfoField label="Tenant Name" value={tenant.name} />
						<InfoField
							label="Description"
							value="No description provided"
						/>
						<div className="space-y-2">
							<p className="text-sm font-medium text-muted-foreground">
								KYC Status
							</p>
							<KycStatusBadge status={kycStatus} />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-semibold">Billing Information</CardTitle>
					</CardHeader>
					<CardContent>
						{billing ? (
							<div className="space-y-4">
								<BillingField
									icon={BuildingsIcon}
									iconClassName="bg-blue-100 text-blue-600"
									label="Billing Name"
									value={billing.billing_name || "—"}
								/>
								<BillingField
									icon={EnvelopeSimpleIcon}
									iconClassName="bg-violet-100 text-violet-600"
									label="Billing Email"
									value={billing.billing_email || "—"}
								/>
								<BillingField
									icon={MapPinIcon}
									iconClassName="bg-emerald-100 text-emerald-600"
									label="Billing Address"
									value={
										[
											billing.billing_address,
											billing.billing_city,
											billing.billing_state,
											billing.billing_postal_code,
										]
											.filter(Boolean)
											.join(", ") || "—"
									}
								/>
								<BillingField
									icon={CreditCardIcon}
									iconClassName="bg-amber-100 text-amber-600"
									label="Billing Plan"
									value={getBillingPlanLabel(billing.billing_plan)}
								/>
								<BillingField
									icon={ActivityIcon}
									iconClassName="bg-muted text-muted-foreground"
									label="Status"
									value={
										<Badge
											variant="outline"
											className={
												billing.status === "active"
													? "border-emerald-200 bg-emerald-50 text-emerald-700"
													: "border-amber-200 bg-amber-50 text-amber-700"
											}
										>
											{billing.status
												? billing.status.charAt(0).toUpperCase() +
													billing.status.slice(1)
												: "Unknown"}
										</Badge>
									}
								/>
							</div>
						) : (
							<p className="py-8 text-center text-sm text-muted-foreground">
								No billing information available
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function InfoField({
	label,
	value,
	mono,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="space-y-1">
			<p className="text-sm font-medium text-muted-foreground">{label}</p>
			<p className={mono ? "font-mono text-sm" : "text-sm"}>{value}</p>
		</div>
	);
}

function BillingField({
	icon: Icon,
	iconClassName,
	label,
	value,
}: {
	icon: typeof BuildingsIcon;
	iconClassName: string;
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="flex items-start gap-3">
			<div
				className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
			>
				<Icon className="size-4" />
			</div>
			<div className="min-w-0 space-y-1">
				<p className="text-sm font-medium text-muted-foreground">{label}</p>
				<div className="text-sm">{value}</div>
			</div>
		</div>
	);
}

function OverviewTabSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{createSkeletonKeys(4, "tenant-overview-stat").map((key) => (
					<Skeleton key={key} className="h-28 rounded-xl" />
				))}
			</div>
			<div className="grid gap-6 lg:grid-cols-2">
				<Skeleton className="h-80 rounded-xl" />
				<Skeleton className="h-80 rounded-xl" />
			</div>
		</div>
	);
}
