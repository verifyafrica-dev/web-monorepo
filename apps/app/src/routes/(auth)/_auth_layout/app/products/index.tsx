import { createFileRoute, Link } from "@tanstack/react-router";
import { useTenantV2DetailQuery } from "#/api/http/v2/tenants/tenants.hooks";
import { useTenantMixedVerificationsV2Query } from "#/api/http/v2/verifications/verifications.hooks";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import { DashboardOnboarding } from "../-components/dashboard-onboarding";
import { shouldShowDashboardOnboarding } from "../-data";
import { useCurrentTenant } from "../team/-data";
import { PRODUCTS } from "./-data";
import { MIXED_VERIFICATIONS_LIST_PARAMS } from "./mixed-verifications/-data";

export const Route = createFileRoute("/(auth)/_auth_layout/app/products/")({
	head: () => ({
		meta: [
			{ title: "Products | VerifyAfrica" },
			{ name: "description", content: "Explore VerifyAfrica verification products and available checks." },
		],
	}),
	component: ProductsPage,
});

function ProductsPage() {
	const { tenantId } = useCurrentTenant();
	const tenantQuery = useTenantV2DetailQuery(tenantId, Boolean(tenantId));
	const isKycVerified = tenantQuery.data?.kyc.kyc_verified ?? false;
	const isKycLoading = tenantQuery.isPending || tenantQuery.isFetching;
	const showOnboarding =
		!tenantQuery.isError &&
		!isKycLoading &&
		shouldShowDashboardOnboarding(isKycVerified);

	useTenantMixedVerificationsV2Query(
		tenantId,
		MIXED_VERIFICATIONS_LIST_PARAMS,
		Boolean(tenantId),
	);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">Products</h1>
				<p className="text-sm text-muted-foreground">
					Explore our suite of verification and compliance products.
				</p>
			</div>

			{showOnboarding && <DashboardOnboarding />}

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{PRODUCTS.map((product) => {
					const Icon = product.icon;

					return (
						<Card key={product.slug} className="h-full">
							<CardContent className="flex h-full flex-col gap-4">
								<div className="flex size-12 items-center justify-center rounded-md bg-secondary/10 text-secondary">
									<Icon className="size-6" weight={product.iconWeight} />
								</div>
								<div className="flex flex-1 flex-col gap-2">
									<h2 className="font-semibold text-base">{product.title}</h2>
									<p className="text-sm text-muted-foreground">
										{product.description}
									</p>
								</div>
								<Button variant="outline" className="w-full" asChild>
									<Link to={`/app/products/${product.slug}`}>
										Get Started
									</Link>
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
