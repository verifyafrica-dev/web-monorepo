import {
	ArrowsClockwiseIcon,
	CheckIcon,
	CopyIcon,
	EyeIcon,
	EyeSlashIcon,
	FloppyDiskIcon,
	LinkSimpleIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
	useCreateTenantWebhookV2Mutation,
	useTenantWebhookV2Query,
	useUpdateTenantWebhookV2Mutation,
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
import { useClipboard } from "@verifyafrica/ui/hooks/use-clipboard";
import { hasChangedFields } from "@verifyafrica/ui/lib/pick-changed-fields";
import { cn } from "@verifyafrica/ui/lib/utils";
import { useCurrentTenant } from "../../team/-data";
import {
	EMPTY_WEBHOOK_FORM,
	generateWebhookToken,
	getWebhookCreatePayload,
	getWebhookFormState,
	getWebhookUpdatePayload,
	maskApiKey,
	type WebhookFormState,
} from "../-data";

const webhookUrlSchema = z
	.url({ message: "Invalid webhook URL" })
	.max(200, { message: "Webhook URL must be 200 characters or fewer" });

export function WebhookFormCard() {
	const [isTokenVisible, setIsTokenVisible] = useState(false);
	const { copied, copy } = useClipboard();
	const { tenantId, isTenantAdmin } = useCurrentTenant();
	const webhookQuery = useTenantWebhookV2Query(tenantId, Boolean(tenantId));
	const createWebhookMutation = useCreateTenantWebhookV2Mutation(
		tenantId ?? "",
	);
	const updateWebhookMutation = useUpdateTenantWebhookV2Mutation(
		tenantId ?? "",
	);

	const webhook = webhookQuery.data;
	const isConfigured = webhook !== null && webhook !== undefined;
	const webhookToken = webhook?.auth_token ?? "";
	const canManage = isTenantAdmin;

	const [form, setForm] = useState<WebhookFormState>(EMPTY_WEBHOOK_FORM);
	const originalForm = useMemo(() => getWebhookFormState(webhook), [webhook]);
	const hasChanges = isConfigured ? hasChangedFields(originalForm, form) : true;

	const isLoading = webhookQuery.isPending || webhookQuery.isFetching;
	const isSaving =
		createWebhookMutation.isPending || updateWebhookMutation.isPending;
	const isMutating = isSaving || updateWebhookMutation.isPending;

	useEffect(() => {
		setForm(getWebhookFormState(webhook));
		setIsTokenVisible(false);
	}, [webhook]);

	function updateField<K extends keyof WebhookFormState>(
		field: K,
		value: WebhookFormState[K],
	) {
		setForm((current) => ({ ...current, [field]: value }));
	}

	async function handleCopyToken() {
		if (!webhookToken) {
			return;
		}

		await copy(webhookToken);
		toast.success("Webhook token copied");
	}

	function handleRegenerateToken() {
		updateWebhookMutation.mutate(
			{
				auth_token: generateWebhookToken(),
				use_auth: true,
			},
			{
				onSuccess: () => {
					toast.success("Webhook token regenerated successfully");
					setIsTokenVisible(false);
				},
				onError: () => {
					toast.error("Failed to regenerate webhook token");
				},
			},
		);
	}

	function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		const urlResult = webhookUrlSchema.safeParse(form.url.trim());
		if (!urlResult.success) {
			toast.error(urlResult.error.issues[0]?.message ?? "Invalid webhook URL");
			return;
		}

		if (isConfigured) {
			const payload = getWebhookUpdatePayload(originalForm, form);

			if (Object.keys(payload).length === 0) {
				return;
			}

			updateWebhookMutation.mutate(payload, {
				onSuccess: () => {
					toast.success("Webhook updated successfully");
				},
				onError: () => {
					toast.error("Failed to update webhook");
				},
			});
			return;
		}

		if (!tenantId) {
			toast.error("Tenant information is unavailable");
			return;
		}

		createWebhookMutation.mutate(getWebhookCreatePayload(form), {
			onSuccess: () => {
				toast.success("Webhook saved successfully");
			},
			onError: () => {
				toast.error("Failed to save webhook");
			},
		});
	}

	if (webhookQuery.isError) {
		return (
			<Card>
				<CardContent className="py-10 text-center text-sm text-muted-foreground">
					Failed to load webhook settings. Please try again.
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return <WebhookFormCardSkeleton />;
	}

	if (!canManage && !isConfigured) {
		return (
			<Card>
				<CardHeader>
					<div className="flex items-start gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
							<LinkSimpleIcon className="size-5 text-muted-foreground" />
						</div>
						<div>
							<CardTitle className="font-semibold">Webhook URL</CardTitle>
							<CardDescription>
								No webhook is configured yet. Ask a tenant admin to set one up.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-col items-start justify-between gap-4 space-y-0 sm:flex-row">
				<div className="flex items-start gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
						<LinkSimpleIcon className="size-5 text-muted-foreground" />
					</div>
					<div>
						<CardTitle className="font-semibold">Webhook URL</CardTitle>
						<CardDescription>
							{isConfigured
								? "Receive verification.completed and verification.failed events at your endpoint"
								: "Add an endpoint to receive verification events"}
						</CardDescription>
					</div>
				</div>
				{isConfigured && canManage ? (
					<div className="flex items-center gap-2">
						<Switch
							id="webhook-status"
							checked={form.is_active}
							onCheckedChange={(checked) => updateField("is_active", checked)}
							disabled={isMutating}
							className="cursor-pointer"
						/>
						<p className="text-sm">{form.is_active ? "Active" : "Inactive"}</p>
					</div>
				) : isConfigured ? (
					<p className="text-sm text-muted-foreground">
						{form.is_active ? "Active" : "Inactive"}
					</p>
				) : null}
			</CardHeader>

			<CardContent>
				<form
					className="flex flex-col gap-6"
					onSubmit={handleSubmit}
				>
					<div className="space-y-1.5">
						<Label htmlFor="webhook-url">Endpoint URL</Label>
						<Input
							id="webhook-url"
							type="url"
							placeholder="https://your-app.com/webhooks/verifyafrica"
							value={form.url}
							onChange={(event) => updateField("url", event.target.value)}
							disabled={isMutating || !canManage}
							required={canManage}
							readOnly={!canManage}
						/>
						<p className="text-xs text-muted-foreground">
							{canManage
								? "We send a POST request when a verification completes."
								: "Only tenant admins can change webhook configuration."}
						</p>
					</div>

					{isConfigured ? (
						<div className="space-y-1.5">
							<Label htmlFor="webhook-token">Webhook Token</Label>
							<div className="flex gap-2">
								<Input
									id="webhook-token"
									readOnly
									value={maskApiKey(webhookToken, isTokenVisible)}
									className="font-mono text-sm"
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => setIsTokenVisible((visible) => !visible)}
									aria-label={
										isTokenVisible
											? "Hide webhook token"
											: "Reveal webhook token"
									}
									className="cursor-pointer"
									disabled={isMutating}
								>
									{isTokenVisible ? (
										<EyeSlashIcon className="size-4" />
									) : (
										<EyeIcon className="size-4" />
									)}
								</Button>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={handleCopyToken}
									aria-label="Copy webhook token"
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
							<p className="text-xs text-muted-foreground">
								Verify incoming requests using the Authorization Bearer token we
								include on every webhook delivery.
							</p>
						</div>
					) : (
						<div className="rounded-lg border bg-muted/30 px-4 py-3">
							<p className="text-sm font-medium">Webhook token</p>
							<p className="mt-1 text-xs text-muted-foreground">
								A secure token is generated automatically when you save your
								webhook URL. Use it to verify that events came from
								VerifyAfrica.
							</p>
						</div>
					)}

					{!isConfigured && canManage ? (
						<div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
							<div className="space-y-0.5">
								<Label htmlFor="webhook-active-create">Enable webhook</Label>
								<p className="text-xs text-muted-foreground">
									Start sending events immediately after saving
								</p>
							</div>
							<Switch
								id="webhook-active-create"
								checked={form.is_active}
								onCheckedChange={(checked) => updateField("is_active", checked)}
								disabled={isMutating}
								className="cursor-pointer"
							/>
						</div>
					) : null}

					{isConfigured && (
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="flex flex-col gap-1 rounded-lg border bg-muted/30 px-4 py-3">
								<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Status
								</p>
								<Badge
									variant="outline"
									className={cn(
										"border-emerald-200 bg-emerald-50 text-emerald-700",
										!form.is_active &&
											"border-muted bg-muted text-muted-foreground",
									)}
								>
									{form.is_active ? "Active" : "Inactive"}
								</Badge>
							</div>
							<div className="flex flex-col gap-1 rounded-lg border bg-muted/30 px-4 py-3">
								<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Authentication
								</p>
								<p className="text-sm font-medium">Bearer token</p>
							</div>
						</div>
					)}

					{canManage ? (
						<>
							<Separator />
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								{isConfigured ? (
									<Button
										type="button"
										variant="outline"
										onClick={handleRegenerateToken}
										disabled={isMutating}
										className="cursor-pointer border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
									>
										<ArrowsClockwiseIcon
											className={cn(
												"size-4",
												updateWebhookMutation.isPending && "animate-spin",
											)}
										/>
										{updateWebhookMutation.isPending
											? "Regenerating..."
											: "Regenerate Token"}
									</Button>
								) : null}

								<Button
									type="submit"
									disabled={isSaving || (isConfigured && !hasChanges)}
									className="w-full cursor-pointer sm:w-auto"
								>
									{isSaving ? (
										<FloppyDiskIcon className="size-4 animate-pulse" />
									) : (
										<CheckIcon className="size-4" />
									)}
									{isSaving
										? "Saving webhook..."
										: isConfigured
											? "Save webhook changes"
											: "Save webhook URL"}
								</Button>
							</div>
						</>
					) : null}
				</form>
			</CardContent>
		</Card>
	);
}

function WebhookFormCardSkeleton() {
	return (
		<Card>
			<CardHeader className="flex flex-col items-start justify-between gap-4 space-y-0 sm:flex-row">
				<div className="flex items-start gap-3">
					<Skeleton className="size-10 rounded-lg" />
					<div className="space-y-1.5">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-4 w-56" />
					</div>
				</div>
				<Skeleton className="h-6 w-16 rounded-full" />
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				<div className="space-y-1.5">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-10 w-full" />
				</div>
				<div className="space-y-1.5">
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-10 w-full" />
				</div>
				<Skeleton className="h-16 rounded-lg" />
				<Separator />
				<div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
					<Skeleton className="h-10 w-40" />
					<Skeleton className="h-10 w-40" />
				</div>
			</CardContent>
		</Card>
	);
}
