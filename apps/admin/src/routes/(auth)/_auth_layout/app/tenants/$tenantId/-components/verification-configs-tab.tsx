import { FloppyDiskIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getV2ErrorMessage } from "#/api/http/shared";
import { useUpdateTenantVerificationConfigsV2Mutation } from "#/api/http/v2/tenants/tenants.hooks";
import type { TenantVerificationConfigRow } from "#/api/http/v2/tenants/tenants.types";
import { Alert, AlertDescription } from "@verifyafrica/ui/components/ui/alert";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { Switch } from "@verifyafrica/ui/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@verifyafrica/ui/components/ui/tabs";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import {
	VERIFICATION_PROVIDER_TABS,
	type VerificationProviderTab,
} from "../-constants";
import {
	buildVerificationConfigDrafts,
	buildVerificationConfigUpdates,
	formatVerificationLabel,
	normalizeVerificationProvider,
	type VerificationConfigDraft,
	validateVerificationConfigDrafts,
} from "../-data";

export function VerificationConfigsTab({
	tenantId,
	configs,
	isLoading,
}: {
	tenantId: string;
	configs: TenantVerificationConfigRow[];
	isLoading?: boolean;
}) {
	const [activeProvider, setActiveProvider] = useState<VerificationProviderTab>(
		VERIFICATION_PROVIDER_TABS.SHUFTI,
	);
	const [drafts, setDrafts] = useState<Record<string, VerificationConfigDraft>>(
		{},
	);

	const updateConfigsMutation =
		useUpdateTenantVerificationConfigsV2Mutation(tenantId);
	const isSaving = updateConfigsMutation.isPending;

	useEffect(() => {
		setDrafts(buildVerificationConfigDrafts(configs));
	}, [configs]);

	const rowsByProvider = useMemo(() => {
		return configs.reduce<
			Record<VerificationProviderTab, TenantVerificationConfigRow[]>
		>(
			(acc, row) => {
				const provider = normalizeVerificationProvider(row.source);

				if (provider) {
					acc[provider].push(row);
				}

				return acc;
			},
			{ shufti: [], korapay: [] },
		);
	}, [configs]);

	const pendingUpdates = useMemo(
		() => buildVerificationConfigUpdates(configs, drafts),
		[configs, drafts],
	);
	const hasChanges = pendingUpdates.length > 0;

	const handleSave = async () => {
		const validationError = validateVerificationConfigDrafts(configs, drafts);
		if (validationError) {
			toast.error(validationError);
			return;
		}

		if (pendingUpdates.length === 0) {
			return;
		}

		try {
			await updateConfigsMutation.mutateAsync({ configs: pendingUpdates });
			toast.success("Tenant verification settings updated");
		} catch (error) {
			toast.error(getV2ErrorMessage(error));
		}
	};

	return (
		<Card>
			<CardHeader className="gap-4 border-b">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="space-y-3">
						<CardTitle className="font-semibold">
							Verification Access & Pricing
						</CardTitle>
						<Alert className="border-blue-200 bg-blue-50 text-blue-900">
							<AlertDescription>
								Configure tenant-specific verification access and pricing
								overrides. Tenant-facing screens will only see enabled products,
								while pricing remains admin-only.
							</AlertDescription>
						</Alert>
					</div>
					<Button
						onClick={() => void handleSave()}
						disabled={isLoading || isSaving || !hasChanges}
					>
						<FloppyDiskIcon weight="bold" />
						{isSaving ? "Saving..." : "Save Changes"}
					</Button>
				</div>
			</CardHeader>
			<CardContent className="pt-6">
				<Tabs
					value={activeProvider}
					onValueChange={(value) =>
						setActiveProvider(value as VerificationProviderTab)
					}
				>
					<TabsList className="mb-6 w-full justify-start">
						<TabsTrigger value={VERIFICATION_PROVIDER_TABS.SHUFTI}>
							Shufti Verifications
						</TabsTrigger>
						<TabsTrigger value={VERIFICATION_PROVIDER_TABS.KORAPAY}>
							Korapay Verifications
						</TabsTrigger>
					</TabsList>

					{(
						Object.values(
							VERIFICATION_PROVIDER_TABS,
						) as VerificationProviderTab[]
					).map((provider) => (
						<TabsContent key={provider} value={provider} className="space-y-4">
							{isLoading ? (
								<div className="space-y-3">
									{createSkeletonKeys(
										5,
										`verification-config-${provider}`,
									).map((key) => (
										<Skeleton key={key} className="h-24 rounded-lg" />
									))}
								</div>
							) : rowsByProvider[provider].length === 0 ? (
								<p className="py-8 text-center text-sm text-muted-foreground">
									No verification configs found for this provider.
								</p>
							) : (
								rowsByProvider[provider].map((row) => (
									<VerificationConfigRow
										key={`${row.source}-${row.verification_type}`}
										row={row}
										draft={drafts[row.verification_type]}
										onDraftChange={(nextDraft) => {
											setDrafts((current) => ({
												...current,
												[row.verification_type]: nextDraft,
											}));
										}}
										disabled={isSaving}
									/>
								))
							)}
						</TabsContent>
					))}
				</Tabs>
			</CardContent>
		</Card>
	);
}

function VerificationConfigRow({
	row,
	draft,
	onDraftChange,
	disabled,
}: {
	row: TenantVerificationConfigRow;
	draft?: VerificationConfigDraft;
	onDraftChange: (draft: VerificationConfigDraft) => void;
	disabled?: boolean;
}) {
	const isEnabled = draft?.isEnabled ?? false;
	const price = draft?.price ?? "";
	const inherited = !row.has_override;
	const effectiveLabel = isEnabled ? price || "—" : "Disabled";

	return (
		<div className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[minmax(0,1.4fr)_auto_minmax(0,0.8fr)_minmax(0,0.5fr)] lg:items-center">
			<div>
				<p className="font-medium">
					{formatVerificationLabel(row.verification_type)}
				</p>
				<p className="text-sm text-muted-foreground">
					{inherited ? "Inherited from global catalog" : "Tenant override active"}
				</p>
				<p className="text-sm text-muted-foreground">
					Global: {row.global_is_active ? "enabled" : "disabled"} at{" "} <span className="font-bold text-black">

					{row.global_price ?? "—"}
					</span>
				</p>
			</div>

			<div className="flex items-center gap-2">
				<Switch
					checked={isEnabled}
					disabled={disabled}
					onCheckedChange={(checked) => {
						onDraftChange({
							isEnabled: checked,
							price,
						});
					}}
				/>
				<Label>Enabled</Label>
			</div>

			<div className="space-y-1">
				<Label>Override Price</Label>
				<Input
					value={price}
					disabled={disabled || !isEnabled}
					inputMode="decimal"
					onChange={(event) => {
						const nextPrice = event.target.value;
						if (nextPrice === "" || /^\d*\.?\d*$/.test(nextPrice)) {
							onDraftChange({
								isEnabled,
								price: nextPrice,
							});
						}
					}}
				/>
			</div>

			<div className="rounded-lg border bg-muted/30 px-3 py-2">
				<p className="text-xs text-muted-foreground">Effective</p>
				<p className="text-lg font-semibold tabular-nums">{effectiveLabel}</p>
			</div>
		</div>
	);
}
