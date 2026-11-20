import { CopyIcon } from "@phosphor-icons/react";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import type {
	TmMonitor,
	TmUpdateMonitorPayload,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import { Input } from "@verifyafrica/ui/components/ui/input";
import { Label } from "@verifyafrica/ui/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@verifyafrica/ui/components/ui/sheet";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { Switch } from "@verifyafrica/ui/components/ui/switch";
import { useClipboard } from "@verifyafrica/ui/hooks/use-clipboard";
import { cn } from "@verifyafrica/ui/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	useTmFeaturesV2Query,
	useTmMonitorV2Query,
	useUpdateTmMonitorV2Mutation,
} from "#/api/http/v2/transaction-monitoring/transaction-monitoring.hooks";
import {
	DEFAULT_ALERT_THRESHOLD,
	DEFAULT_AUTO_CASE_THRESHOLD,
	type FeatureSelection,
	formatDateTime,
	formatEventLabel,
	formatIndustryLabel,
	getDataContract,
	MONITOR_STATUS_BADGE_CLASS,
	roundWeight,
	titleCase,
} from "../-data";
import { DataContractList, FeaturePicker } from "./feature-picker";
import { ThresholdControl } from "./monitor-builder";

interface EditState {
	displayName: string;
	selection: FeatureSelection;
	autoCaseEnabled: boolean;
	autoCaseThreshold: number;
	alertEnabled: boolean;
	alertThreshold: number;
	alertEmail: string;
	isActive: boolean;
	isDefault: boolean;
}

function toEditState(monitor: TmMonitor): EditState {
	const selection: FeatureSelection = {};
	for (const feature of monitor.features) {
		if (feature.active) selection[feature.key] = feature.weight;
	}
	return {
		displayName: monitor.display_name,
		selection,
		autoCaseEnabled: monitor.auto_case_threshold !== null,
		autoCaseThreshold:
			monitor.auto_case_threshold ?? DEFAULT_AUTO_CASE_THRESHOLD,
		alertEnabled: monitor.alert_threshold !== null,
		alertThreshold: monitor.alert_threshold ?? DEFAULT_ALERT_THRESHOLD,
		alertEmail: monitor.alert_email ?? "",
		isActive: monitor.status === "active",
		isDefault: monitor.is_default,
	};
}

/** Only send what changed, so a rename doesn't re-sync every upstream rule. */
function buildUpdatePayload(
	monitor: TmMonitor,
	state: EditState,
): TmUpdateMonitorPayload {
	const original = toEditState(monitor);
	const payload: TmUpdateMonitorPayload = {};

	const displayName = state.displayName.trim();
	if (displayName !== original.displayName) payload.display_name = displayName;

	const featuresChanged =
		JSON.stringify(sortEntries(original.selection)) !==
		JSON.stringify(sortEntries(state.selection));
	if (featuresChanged) {
		const features = Object.entries(state.selection).map(([key, weight]) => ({
			key,
			weight: roundWeight(weight),
			active: true,
		}));
		// Keep de-selected rules as inactive instead of dropping them, so their
		// weight survives a later re-enable (the doc's "toggle off = active:false").
		for (const existing of monitor.features) {
			if (!(existing.key in state.selection)) {
				features.push({
					key: existing.key,
					weight: existing.weight,
					active: false,
				});
			}
		}
		payload.features = features;
	}

	const autoCase = state.autoCaseEnabled ? state.autoCaseThreshold : null;
	if (autoCase !== monitor.auto_case_threshold) {
		payload.auto_case_threshold = autoCase;
	}
	const alert = state.alertEnabled ? state.alertThreshold : null;
	if (alert !== monitor.alert_threshold) payload.alert_threshold = alert;

	const email = state.alertEnabled ? state.alertEmail.trim() : "";
	if (email !== (monitor.alert_email ?? "")) payload.alert_email = email;

	if (state.isActive !== original.isActive) {
		payload.status = state.isActive ? "active" : "disabled";
	}
	if (state.isDefault !== original.isDefault)
		payload.is_default = state.isDefault;

	return payload;
}

function sortEntries(selection: FeatureSelection) {
	return Object.entries(selection)
		.map(([key, weight]) => [key, roundWeight(weight)] as const)
		.sort(([a], [b]) => a.localeCompare(b));
}

export function MonitorDetailSheet({
	tenantId,
	monitorId,
	onOpenChange,
}: {
	tenantId: string;
	monitorId: string | null;
	onOpenChange: (open: boolean) => void;
}) {
	const monitorQuery = useTmMonitorV2Query(tenantId, monitorId ?? undefined);
	const featuresQuery = useTmFeaturesV2Query(tenantId);
	const updateMutation = useUpdateTmMonitorV2Mutation(tenantId);
	const { copy } = useClipboard();
	const [state, setState] = useState<EditState | null>(null);

	const monitor = monitorQuery.data;
	const catalog = useMemo(
		() => featuresQuery.data?.features ?? [],
		[featuresQuery.data?.features],
	);

	useEffect(() => {
		if (monitor) setState(toEditState(monitor));
	}, [monitor]);

	const payload = useMemo(
		() => (monitor && state ? buildUpdatePayload(monitor, state) : {}),
		[monitor, state],
	);
	const hasChanges = Object.keys(payload).length > 0;

	function patch(next: Partial<EditState>) {
		setState((current) => (current ? { ...current, ...next } : current));
	}

	function handleSave() {
		if (!monitor || !state || !hasChanges) return;

		if (state.displayName.trim().length === 0) {
			toast.error("Monitor name can't be empty");
			return;
		}
		if (state.isActive && Object.keys(state.selection).length === 0) {
			toast.error("An active monitor needs at least one feature");
			return;
		}
		if (state.alertEnabled && !state.alertEmail.trim()) {
			toast.error("Enter an email to receive alerts");
			return;
		}

		updateMutation.mutate(
			{ monitorId: monitor.monitor_id, payload },
			{
				onSuccess: () => toast.success("Monitor updated"),
				onError: (error) =>
					toast.error(getV2ErrorMessage(error, "Failed to update monitor.")),
			},
		);
	}

	async function handleCopy(value: string, label: string) {
		await copy(value);
		toast.success(`${label} copied`);
	}

	const isSaving = updateMutation.isPending;

	return (
		<Sheet open={monitorId !== null} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-2xl"
			>
				<SheetHeader className="border-b">
					<SheetTitle>{monitor?.display_name ?? "Monitor"}</SheetTitle>
					<SheetDescription>
						Edit rules, weights and thresholds. Changes apply to new scores
						straight away.
					</SheetDescription>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto px-4 py-5">
					{monitorQuery.isPending || !state || !monitor ? (
						monitorQuery.isError ? (
							<p className="py-12 text-center text-sm text-destructive">
								Unable to load this monitor.
							</p>
						) : (
							<div className="flex flex-col gap-4">
								<Skeleton className="h-10 rounded-md" />
								<Skeleton className="h-32 rounded-md" />
								<Skeleton className="h-64 rounded-md" />
							</div>
						)
					) : (
						<div className="flex flex-col gap-8">
							<section className="flex flex-col gap-3">
								<div className="flex flex-wrap items-center gap-2">
									<Badge
										variant="outline"
										className={cn(MONITOR_STATUS_BADGE_CLASS[monitor.status])}
									>
										{titleCase(monitor.status)}
									</Badge>
									<Badge variant="secondary" className="font-normal">
										{formatEventLabel(monitor.event)}
									</Badge>
									<Badge variant="outline" className="font-normal">
										{monitor.region}
									</Badge>
									<Badge variant="outline" className="font-normal">
										{formatIndustryLabel(monitor.industry)}
									</Badge>
								</div>

								<div className="flex flex-col gap-1">
									<span className="text-xs text-muted-foreground">
										Monitor ID
									</span>
									<div className="flex items-center gap-2">
										<code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs">
											{monitor.monitor_id}
										</code>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											aria-label="Copy monitor ID"
											onClick={() =>
												void handleCopy(monitor.monitor_id, "Monitor ID")
											}
										>
											<CopyIcon className="size-4" />
										</Button>
									</div>
								</div>

								<div className="flex flex-col gap-1">
									<span className="text-xs text-muted-foreground">
										Function name
									</span>
									<code className="rounded bg-muted px-2 py-1 font-mono text-xs break-all">
										{monitor.omniguard_function_name}
									</code>
									<span className="text-xs text-muted-foreground">
										Created {formatDateTime(monitor.created_at)}
									</span>
								</div>
							</section>

							<section className="flex flex-col gap-2">
								<Label htmlFor="tm-edit-name">Display name</Label>
								<Input
									id="tm-edit-name"
									value={state.displayName}
									maxLength={255}
									disabled={isSaving}
									onChange={(event) =>
										patch({ displayName: event.target.value })
									}
								/>
								<p className="text-xs text-muted-foreground">
									Renaming only changes the label here. The function name above
									stays the same for audit purposes.
								</p>
							</section>

							<section className="flex flex-col gap-3">
								<h3 className="text-sm font-semibold">
									Fields your API must send
								</h3>
								<DataContractList
									fields={
										catalog.length > 0
											? getDataContract(catalog, state.selection)
											: monitor.data_contract
									}
								/>
							</section>

							<section className="flex flex-col gap-4">
								<div className="flex flex-col gap-1">
									<h3 className="text-sm font-semibold">Rules</h3>
									{monitor.omniguard_rules_sync?.note ? (
										<p className="text-xs text-muted-foreground">
											{monitor.omniguard_rules_sync.note}
											{typeof monitor.omniguard_rules_sync
												.omniguard_rules_seeded === "number"
												? ` Upstream seeded ${monitor.omniguard_rules_sync.omniguard_rules_seeded}.`
												: null}
										</p>
									) : null}
								</div>
								{featuresQuery.isPending ? (
									<Skeleton className="h-64 rounded-md" />
								) : featuresQuery.isError ? (
									<p className="text-sm text-destructive">
										Unable to load the feature catalog.
									</p>
								) : (
									<FeaturePicker
										catalog={catalog}
										selection={state.selection}
										onChange={(selection) => patch({ selection })}
										disabled={isSaving}
									/>
								)}
							</section>

							<section className="flex flex-col gap-6">
								<h3 className="text-sm font-semibold">Cases &amp; alerts</h3>
								<ThresholdControl
									id="tm-edit-auto-case"
									title="Open a case automatically"
									description="Opens a case when the overall score reaches this value."
									enabled={state.autoCaseEnabled}
									value={state.autoCaseThreshold}
									disabled={isSaving}
									onEnabledChange={(value) => patch({ autoCaseEnabled: value })}
									onValueChange={(value) => patch({ autoCaseThreshold: value })}
								/>
								<ThresholdControl
									id="tm-edit-alert"
									title="Email an alert"
									description="Sends an email when the overall score reaches this value."
									enabled={state.alertEnabled}
									value={state.alertThreshold}
									disabled={isSaving}
									onEnabledChange={(value) => patch({ alertEnabled: value })}
									onValueChange={(value) => patch({ alertThreshold: value })}
								>
									<div className="flex flex-col gap-2">
										<Label htmlFor="tm-edit-alert-email">Alert email</Label>
										<Input
											id="tm-edit-alert-email"
											type="email"
											value={state.alertEmail}
											disabled={isSaving}
											onChange={(event) =>
												patch({ alertEmail: event.target.value })
											}
										/>
									</div>
								</ThresholdControl>
							</section>

							<section className="flex flex-col gap-4 border-t pt-6">
								<div className="flex items-start justify-between gap-4">
									<div className="flex flex-col gap-1">
										<Label htmlFor="tm-edit-active">Active</Label>
										<p className="text-xs text-muted-foreground">
											Disabled monitors can&apos;t score transactions.
										</p>
									</div>
									<Switch
										id="tm-edit-active"
										checked={state.isActive}
										disabled={isSaving}
										onCheckedChange={(value) => patch({ isActive: value })}
									/>
								</div>
								<div className="flex items-start justify-between gap-4">
									<div className="flex flex-col gap-1">
										<Label htmlFor="tm-edit-default">Default monitor</Label>
										<p className="text-xs text-muted-foreground">
											Used when a score request has no monitor ID. Only one
											monitor can be the default.
										</p>
									</div>
									<Switch
										id="tm-edit-default"
										checked={state.isDefault}
										disabled={isSaving}
										onCheckedChange={(value) => patch({ isDefault: value })}
									/>
								</div>
							</section>
						</div>
					)}
				</div>

				<SheetFooter className="border-t sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSaving}
					>
						Close
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						disabled={!hasChanges || isSaving || !monitor}
					>
						{isSaving ? "Saving…" : "Save changes"}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
