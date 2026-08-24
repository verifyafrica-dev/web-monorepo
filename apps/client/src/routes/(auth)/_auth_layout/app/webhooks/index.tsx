import {
	ArrowSquareOutIcon,
	ArrowsClockwiseIcon,
	CheckIcon,
	ClockIcon,
	CopyIcon,
	EyeIcon,
	EyeSlashIcon,
	KeyIcon,
	LinkSimpleIcon,
	ListBulletsIcon,
	WebhooksLogoIcon,
} from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
	useReplaceTenantApiKeyV2Mutation,
	useTenantApiKeyV2Query,
	useTenantV2DetailQuery,
	useTenantWebhookV2Query,
	useUpdateTenantApiKeyV2Mutation,
} from "#/api/http/v2/tenants/tenants.hooks";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import { Separator } from "@verifyafrica/ui/components/ui/separator";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { Switch } from "@verifyafrica/ui/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@verifyafrica/ui/components/ui/tabs";
import { useClipboard } from "@verifyafrica/ui/hooks/use-clipboard";
import { cn } from "@verifyafrica/ui/lib/utils";
import { DashboardOnboarding } from "../-components/dashboard-onboarding";
import { shouldShowDashboardOnboarding } from "../-data";
import { useCurrentTenant } from "../team/-data";
import { WebhookDeliveriesTab } from "./-components/deliveries-tab";
import { WebhookFormCard } from "./-components/webhook-form-card";
import {
	formatApiKeyDate,
	getApiKeyPreview,
	getWebhookTokenPreview,
	maskApiKey,
	mergeWebhooksSearchParams,
	type WebhooksSearchParams,
	webhooksSearchSchema,
} from "./-data";

export const Route = createFileRoute("/(auth)/_auth_layout/app/webhooks/")({
	head: () => ({
		meta: [
			{ title: "Webhooks | VerifyAfrica" },
			{
				name: "description",
				content:
					"Manage your webhook endpoint, API key, and outbound delivery history.",
			},
		],
	}),
	validateSearch: webhooksSearchSchema,
	component: WebhooksPage,
});

function WebhooksPage() {
	const navigate = useNavigate({ from: Route.fullPath });
	const urlSearch = Route.useSearch();
	const activeTab = urlSearch.tab ?? "configuration";
	const { tenantId } = useCurrentTenant();

	const tenantQuery = useTenantV2DetailQuery(tenantId, Boolean(tenantId));
	const isKycVerified = tenantQuery.data?.kyc.kyc_verified ?? false;
	const isKycLoading = tenantQuery.isPending || tenantQuery.isFetching;
	const showOnboarding =
		!tenantQuery.isError &&
		!isKycLoading &&
		shouldShowDashboardOnboarding(isKycVerified);

	function handleTabChange(value: string) {
		void navigate({
			search: (current) =>
				mergeWebhooksSearchParams(current, {
					tab: value as WebhooksSearchParams["tab"],
				}),
			replace: true,
		});
	}

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
			<WebhooksHeader />
			{showOnboarding && <DashboardOnboarding />}

			<Tabs
				value={activeTab}
				onValueChange={handleTabChange}
				className="flex w-full flex-col gap-6"
			>
				<TabsList>
					<TabsTrigger value="configuration">
						<LinkSimpleIcon />
						Configuration
					</TabsTrigger>
					<TabsTrigger value="deliveries">
						<ListBulletsIcon />
						Deliveries
					</TabsTrigger>
				</TabsList>

				<TabsContent value="configuration" className="flex flex-col gap-6">
					<ConfigurationTab />
				</TabsContent>

				<TabsContent value="deliveries">
					<WebhookDeliveriesTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function ConfigurationTab() {
	const [isKeyVisible, setIsKeyVisible] = useState(false);
	const { copied, copy } = useClipboard();
	const { tenantId, isTenantAdmin } = useCurrentTenant();

	const apiKeyQuery = useTenantApiKeyV2Query(tenantId, Boolean(tenantId));
	const webhookQuery = useTenantWebhookV2Query(tenantId, Boolean(tenantId));
	const updateApiKeyMutation = useUpdateTenantApiKeyV2Mutation(tenantId ?? "");
	const rotateApiKeyMutation = useReplaceTenantApiKeyV2Mutation(tenantId ?? "");

	const apiKey = apiKeyQuery.data;
	const isLoading = apiKeyQuery.isPending || apiKeyQuery.isFetching;
	const isMutating =
		updateApiKeyMutation.isPending || rotateApiKeyMutation.isPending;

	async function handleCopy() {
		if (!apiKey?.key) {
			return;
		}

		await copy(apiKey.key);
	}

	function handleToggleActive(checked: boolean) {
		updateApiKeyMutation.mutate(
			{ is_active: checked },
			{
				onSuccess: () => {
					toast.success(
						`API key ${checked ? "activated" : "deactivated"} successfully`,
					);
				},
				onError: () => {
					toast.error("Failed to update key status");
				},
			},
		);
	}

	function handleRotateKey() {
		rotateApiKeyMutation.mutate(
			{ key: "reset", is_active: true },
			{
				onSuccess: () => {
					toast.success("API key rotated successfully");
					setIsKeyVisible(false);
				},
				onError: () => {
					toast.error("Failed to rotate key");
				},
			},
		);
	}

	if (apiKeyQuery.isError) {
		return (
			<Card>
				<CardContent className="py-10 text-center text-sm text-muted-foreground">
					Failed to load API key. Please try again.
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			{isLoading || !apiKey ? (
				<ApiKeyCardSkeleton />
			) : (
				<Card>
					<CardHeader className="flex flex-col items-start justify-between gap-4 space-y-0 sm:flex-row">
						<div className="flex items-start gap-3">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
								<KeyIcon className="size-5 text-muted-foreground" />
							</div>
							<div>
								<CardTitle className="font-semibold">
									Production API Key
								</CardTitle>
								<CardDescription>
									{apiKey.is_active
										? "Active and ready to use"
										: "Currently inactive"}
								</CardDescription>
							</div>
						</div>
						{isTenantAdmin ? (
							<div className="flex gap-2 items-center">
								<Switch
									id="key-status"
									checked={apiKey.is_active}
									onCheckedChange={handleToggleActive}
									disabled={isMutating}
									className="cursor-pointer"
								/>
								<p>{apiKey.is_active ? "Active" : "Inactive"}</p>
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								{apiKey.is_active ? "Active" : "Inactive"}
							</p>
						)}
					</CardHeader>

					<CardContent className="flex flex-col gap-6">
						<div className="space-y-1.5">
							<Label htmlFor="api-key">API Key</Label>
							<div className="flex gap-2">
								<Input
									id="api-key"
									readOnly
									value={maskApiKey(apiKey.key, isKeyVisible)}
									className="font-mono text-sm"
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => setIsKeyVisible((visible) => !visible)}
									aria-label={isKeyVisible ? "Hide API key" : "Reveal API key"}
									className="cursor-pointer"
									disabled={isMutating}
								>
									{isKeyVisible ? (
										<EyeSlashIcon className="size-4" />
									) : (
										<EyeIcon className="size-4" />
									)}
								</Button>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={handleCopy}
									aria-label="Copy API key"
									className="cursor-pointer"
									disabled={isMutating}
								>
									{copied ? (
										<CheckIcon className="size-4 text-emerald-600" />
									) : (
										<CopyIcon className="size-4" />
									)}
								</Button>
							</div>
							{!isKeyVisible && (
								<p className="text-xs text-muted-foreground">
									Click the eye icon to reveal the full key before copying
								</p>
							)}
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
							<div className="flex flex-col gap-1 rounded-lg border bg-muted/30 px-4 py-3">
								<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Last Used
								</p>
								<div className="flex items-center gap-2 text-sm font-medium">
									<ClockIcon className="size-4 text-muted-foreground" />
									{formatApiKeyDate(apiKey.last_used)}
								</div>
							</div>
							<div className="flex flex-col gap-1 rounded-lg border bg-muted/30 px-4 py-3">
								<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Status
								</p>

								<Badge
									variant="outline"
									className={cn(
										"border-emerald-200 bg-emerald-50 text-emerald-700",
										!apiKey.is_active &&
											"border-muted bg-muted text-muted-foreground",
									)}
								>
									{apiKey.is_active ? "Active" : "Inactive"}
								</Badge>
							</div>
							<div className="flex flex-col gap-1 rounded-lg border bg-muted/30 px-4 py-3">
								<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Expires
								</p>
								<p className="text-sm font-medium">
									{formatApiKeyDate(apiKey.expires_at)}
								</p>
							</div>
						</div>

						{isTenantAdmin ? (
							<>
								<Separator />
								<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
									<Button
										type="button"
										variant="outline"
										onClick={handleRotateKey}
										disabled={isMutating}
										className="cursor-pointer border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
									>
										<ArrowsClockwiseIcon
											className={cn("size-4", isMutating && "animate-spin")}
										/>
										{rotateApiKeyMutation.isPending
											? "Rotating..."
											: "Rotate Key"}
									</Button>
								</div>
							</>
						) : null}
					</CardContent>
				</Card>
			)}

			<WebhookFormCard />

			<UsageInstructionsCard
				keyPreview={getApiKeyPreview(apiKey?.key)}
				webhookTokenPreview={getWebhookTokenPreview(
					webhookQuery.data?.auth_token,
				)}
			/>
		</>
	);
}

function WebhooksHeader() {
	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div className="flex items-start gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<WebhooksLogoIcon className="size-5" weight="duotone" />
				</div>
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">Webhooks</h1>
					<p className="text-sm text-muted-foreground">
						Configure your webhook endpoint and review outbound delivery
						history.
					</p>
				</div>
			</div>
			<Button variant="outline" className="cursor-pointer" asChild>
				<a
					href="https://docs.verifyafrica.io"
					target="_blank"
					rel="noopener noreferrer"
				>
					Read the docs
					<ArrowSquareOutIcon data-icon="inline-end" />
				</a>
			</Button>
		</div>
	);
}

function ApiKeyCardSkeleton() {
	return (
		<Card>
			<CardHeader className="flex flex-col items-start justify-between gap-4 space-y-0 sm:flex-row">
				<div className="flex items-start gap-3">
					<Skeleton className="size-10 rounded-lg" />
					<div className="space-y-1.5">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
				<Skeleton className="h-6 w-16 rounded-full" />
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				<div className="space-y-1.5">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-10 w-full" />
				</div>
				<div className="grid gap-3 sm:grid-cols-3">
					{["last-used", "status", "expires"].map((item) => (
						<Skeleton key={item} className="h-20 rounded-lg" />
					))}
				</div>
				<Separator />
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<Skeleton className="h-6 w-28" />
					<Skeleton className="h-10 w-32" />
				</div>
			</CardContent>
		</Card>
	);
}

function UsageInstructionsCard({
	keyPreview,
	webhookTokenPreview,
}: {
	keyPreview: string;
	webhookTokenPreview: string;
}) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<KeyIcon className="size-5 text-muted-foreground" />
					<CardTitle>Usage Instructions</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="rounded-lg border bg-muted/20 p-4">
					<div className="flex flex-col items-start gap-3 sm:flex-row">
						<div className="flex items-center gap-2">
							<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
								1
							</div>
							<h3 className="block font-medium sm:hidden">
								Authentication Header
							</h3>
						</div>
						<div className="flex min-w-0 flex-1 flex-col gap-2">
							<h3 className="hidden font-medium sm:block">
								Authentication Header
							</h3>
							<p className="text-sm text-muted-foreground">
								Include your API key in the X-API-KEY header:
							</p>
							<pre className="min-w-full overflow-x-auto rounded-lg bg-zinc-900 px-4 py-3 text-sm text-emerald-400">
								<code className="break-all whitespace-pre-wrap">{`X-API-KEY: ${keyPreview}`}</code>
							</pre>
						</div>
					</div>
				</div>

				<div className="rounded-lg border bg-muted/20 p-4">
					<div className="flex flex-col items-start gap-3 sm:flex-row">
						<div className="flex items-center gap-2">
							<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
								2
							</div>
							<h3 className="block font-medium sm:hidden">
								Security Best Practices
							</h3>
						</div>
						<div className="flex min-w-0 flex-1 flex-col gap-2">
							<h3 className="hidden font-medium sm:block">
								Security Best Practices
							</h3>
							<ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
								<li>Store keys in environment variables, never in code</li>
								<li>Rotate keys periodically or when compromised</li>
								<li>Deactivate keys when not in use</li>
							</ul>
						</div>
					</div>
				</div>

				<div className="rounded-lg border bg-muted/20 p-4">
					<div className="flex flex-col items-start gap-3 sm:flex-row">
						<div className="flex items-center gap-2">
							<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
								3
							</div>
							<h3 className="block font-medium sm:hidden">Webhook Events</h3>
						</div>
						<div className="flex min-w-0 flex-1 flex-col gap-2">
							<h3 className="hidden font-medium sm:block">Webhook Events</h3>
							<p className="text-sm text-muted-foreground">
								When a verification reaches a terminal status, we POST a JSON
								payload to your saved webhook URL with your webhook token in the
								Authorization header. Successful checks use{" "}
								<code>verification.completed</code>; failed checks use{" "}
								<code>verification.failed</code>:
							</p>
							<pre className="min-w-full overflow-x-auto rounded-lg bg-zinc-900 px-4 py-3 text-sm text-emerald-400">
								<code className="break-all whitespace-pre-wrap">{`Authorization: Bearer ${webhookTokenPreview}

{
  "status": "success" | "failure",
  "event": "verification.completed" | "verification.failed",
  "data": { ... }
}`}</code>
							</pre>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
