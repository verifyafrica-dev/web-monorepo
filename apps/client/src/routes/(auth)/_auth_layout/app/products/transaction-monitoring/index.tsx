import {
	ArrowLeftIcon,
	FlaskIcon,
	FolderOpenIcon,
	InfoIcon,
	ListMagnifyingGlassIcon,
	SquaresFourIcon,
} from "@phosphor-icons/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@verifyafrica/ui/components/ui/tabs";
import { useCurrentTenant } from "../../team/-data";
import { getProduct } from "../-data";
import {
	ProductDisabledNotice,
	useIsProductDisabled,
} from "../-product-access";
import { CasesTab } from "./-components/cases-tab";
import { MonitorsTab } from "./-components/monitors-tab";
import { OverviewTab } from "./-components/overview-tab";
import { PlaygroundTab } from "./-components/playground-tab";
import { TemplatesTab } from "./-components/templates-tab";
import {
	mergeTmSearchParams,
	type TmSearchParams,
	tmSearchSchema,
} from "./-data";

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/products/transaction-monitoring/",
)({
	head: () => ({
		meta: [
			{ title: "Transaction Monitoring | VerifyAfrica" },
			{
				name: "description",
				content:
					"Score payments for fraud and AML risk with monitors built from templates or your own weighted rules.",
			},
		],
	}),
	validateSearch: tmSearchSchema,
	component: TransactionMonitoringPage,
});

function TransactionMonitoringPage() {
	const product = getProduct("transaction-monitoring");
	const isDisabled = useIsProductDisabled("transaction-monitoring");
	const navigate = useNavigate({ from: Route.fullPath });
	const search = Route.useSearch();
	const activeTab = search.tab ?? "overview";
	const { tenantId } = useCurrentTenant();

	function goToTab(tab: NonNullable<TmSearchParams["tab"]>) {
		void navigate({
			search: (current) => mergeTmSearchParams(current, { tab }),
			replace: true,
		});
	}

	if (!product) return null;

	return (
		<div className="flex flex-col gap-6">
			<Button variant="ghost" className="w-fit px-4" asChild>
				<Link to="/app/products">
					<ArrowLeftIcon />
					Back to Products
				</Link>
			</Button>

			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					{product.title}
				</h1>
				<p className="max-w-3xl text-sm text-muted-foreground">
					{product.description}
				</p>
			</div>

			{isDisabled ? (
				<ProductDisabledNotice />
			) : !tenantId ? (
				<p className="text-sm text-muted-foreground">
					Select an organization to use Transaction Monitoring.
				</p>
			) : (
				<Tabs
					value={activeTab}
					onValueChange={(value) => goToTab(value as TmTab)}
					className="flex w-full flex-col gap-6"
				>
					<TabsList className="h-auto flex-wrap justify-start">
						<TabsTrigger value="overview">
							<InfoIcon />
							Overview
						</TabsTrigger>
						<TabsTrigger value="templates">
							<SquaresFourIcon />
							Templates
						</TabsTrigger>
						<TabsTrigger value="monitors">
							<FolderOpenIcon />
							My monitors
						</TabsTrigger>
						<TabsTrigger value="cases">
							<ListMagnifyingGlassIcon />
							Cases
						</TabsTrigger>
						<TabsTrigger value="playground">
							<FlaskIcon />
							Test a score
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview">
						<OverviewTab onCreate={() => goToTab("templates")} />
					</TabsContent>
					<TabsContent value="templates">
						<TemplatesTab
							tenantId={tenantId}
							onCreated={() => goToTab("monitors")}
						/>
					</TabsContent>
					<TabsContent value="monitors">
						<MonitorsTab
							tenantId={tenantId}
							onCreate={() => goToTab("templates")}
						/>
					</TabsContent>
					<TabsContent value="cases">
						<CasesTab tenantId={tenantId} />
					</TabsContent>
					<TabsContent value="playground">
						<PlaygroundTab tenantId={tenantId} />
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}

type TmTab = NonNullable<TmSearchParams["tab"]>;
