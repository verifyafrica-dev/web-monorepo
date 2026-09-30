import {
	CoinsIcon,
	FloppyDiskIcon,
	GlobeHemisphereWestIcon,
	PackageIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import {
	useAllVerificationPricesV2Query,
	useUpdateVerificationPriceV2Mutation,
} from "#/api/http/v2/verifications/verifications.hooks";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent } from "@verifyafrica/ui/components/ui/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@verifyafrica/ui/components/ui/tabs";
import {
	GlobalCountriesTab,
	ProductCountriesTab,
} from "./-components/country-availability-tabs";
import {
	buildVerificationPriceUpdates,
	groupVerificationPrices,
	type VerificationPriceDraft,
	validateVerificationPriceDrafts,
} from "./-data";
import {
	VerificationSettingsTable,
	VerificationSettingsTableSkeleton,
} from "./-components/verification-settings-table";

export const Route = createFileRoute(
	"/(auth)/_auth_layout/app/verification-settings/",
)({
	head: () => ({
		meta: [
			{ title: "Verification Settings | VerifyAfrica" },
			{
				name: "description",
				content:
					"Configure global verification rules, providers, and defaults.",
			},
		],
	}),
	component: VerificationSettingsPage,
});

function VerificationSettingsPage() {
	const [drafts, setDrafts] = useState<Record<string, VerificationPriceDraft>>(
		{},
	);

	const pricesQuery = useAllVerificationPricesV2Query({ per_page: 500 });
	const updatePriceMutation = useUpdateVerificationPriceV2Mutation();

	const rows = useMemo(
		() => groupVerificationPrices(pricesQuery.data?.items ?? []),
		[pricesQuery.data?.items],
	);
	const hasChanges = Object.keys(drafts).length > 0;
	const isSaving = updatePriceMutation.isPending;

	const [tab, setTab] = useState("pricing");

	const pricingContent = (
		<PricingContent
			isLoading={pricesQuery.isLoading}
			isError={pricesQuery.isError}
		>
			<VerificationSettingsTable
				rows={rows}
				drafts={drafts}
				disabled={isSaving}
				onDraftsChange={setDrafts}
			/>
		</PricingContent>
	);

	const handleSave = async () => {
		const validationError = validateVerificationPriceDrafts(drafts);
		if (validationError) {
			toast.error(validationError);
			return;
		}

		const updates = buildVerificationPriceUpdates(drafts);
		if (updates.length === 0) {
			return;
		}

		try {
			await Promise.all(
				updates.map((update) =>
					updatePriceMutation.mutateAsync({
						id: update.id,
						payload: update.payload,
					}),
				),
			);
			setDrafts({});
			toast.success("Verification settings updated");
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Verification Settings
					</h1>
					<p className="text-sm text-muted-foreground">
						Configure pricing and availability for verification types.
					</p>
				</div>
				{tab === "pricing" && (
					<Button
						onClick={() => void handleSave()}
						disabled={pricesQuery.isLoading || isSaving || !hasChanges}
					>
						<FloppyDiskIcon weight="bold" />
						{isSaving ? "Saving..." : "Save Changes"}
					</Button>
				)}
			</div>

			<Tabs
				value={tab}
				onValueChange={setTab}
				className="min-w-0"
			>
				<div className="w-full min-w-0 overflow-x-auto no-scrollbar">
					<TabsList className="inline-flex h-auto w-max justify-start gap-2">
						<TabsTrigger
							value="pricing"
							className="shrink-0 flex-none"
						>
							<CoinsIcon />
							Pricing
						</TabsTrigger>
						<TabsTrigger
							value="global-countries"
							className="shrink-0 flex-none"
						>
							<GlobeHemisphereWestIcon />
							Global Countries
						</TabsTrigger>
						<TabsTrigger
							value="product-countries"
							className="shrink-0 flex-none"
						>
							<PackageIcon />
							Product Countries
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="pricing">{pricingContent}</TabsContent>
				<TabsContent value="global-countries">
					<GlobalCountriesTab />
				</TabsContent>
				<TabsContent value="product-countries">
					<ProductCountriesTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function PricingContent({
	isLoading,
	isError,
	children,
}: {
	isLoading: boolean;
	isError: boolean;
	children: ReactNode;
}) {
	return (
		<>
			{isLoading ? (
				<Card>
					<CardContent className="pt-6">
						<VerificationSettingsTableSkeleton />
					</CardContent>
				</Card>
			) : isError ? (
				<Card>
					<CardContent className="pt-6">
						<p className="py-12 text-center text-sm text-destructive">
							Unable to load verification settings.
						</p>
					</CardContent>
				</Card>
			) : (
				children
			)}
		</>
	);
}
