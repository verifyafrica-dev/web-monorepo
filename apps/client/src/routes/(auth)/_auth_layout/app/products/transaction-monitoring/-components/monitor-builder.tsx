import {
	ArrowLeftIcon,
	CheckCircleIcon,
	WarningIcon,
} from "@phosphor-icons/react";
import { getV2ErrorMessage } from "@verifyafrica/api-client/http/shared";
import type {
	TmFeature,
	TmMonitor,
	TmTemplate,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";
import { Alert, AlertDescription } from "@verifyafrica/ui/components/ui/alert";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@verifyafrica/ui/components/ui/select";
import { Slider } from "@verifyafrica/ui/components/ui/slider";
import { Switch } from "@verifyafrica/ui/components/ui/switch";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCreateTmMonitorV2Mutation } from "#/api/http/v2/transaction-monitoring/transaction-monitoring.hooks";
import {
	buildCreateMonitorPayload,
	EMPTY_MONITOR_FORM,
	type FeatureSelection,
	getDataContract,
	MAX_MONITOR_NAME_LENGTH,
	MonitorFormSchema,
	type MonitorFormState,
	slugifyMonitorName,
	TM_EVENT_OPTIONS,
	TM_INDUSTRY_OPTIONS,
	validateFeatureSelection,
} from "../-data";
import { DataContractList, FeaturePicker } from "./feature-picker";

interface MonitorBuilderProps {
	tenantId: string;
	/** `null` means "create custom" (blank). */
	template: TmTemplate | null;
	catalog: TmFeature[];
	onCancel: () => void;
	onCreated: (monitor: TmMonitor) => void;
}

function getInitialSelection(
	template: TmTemplate | null,
	catalog: TmFeature[],
): FeatureSelection {
	if (!template) return {};
	const known = new Set(catalog.map((feature) => feature.key));
	const selection: FeatureSelection = {};
	for (const feature of template.features) {
		// A template may reference a key the catalog no longer serves; skip it so
		// the backend doesn't reject the whole create with "Unknown feature key".
		if (known.has(feature.key)) selection[feature.key] = feature.weight;
	}
	return selection;
}

function getInitialForm(template: TmTemplate | null): MonitorFormState {
	if (!template) return EMPTY_MONITOR_FORM;
	return {
		...EMPTY_MONITOR_FORM,
		event: template.event ?? EMPTY_MONITOR_FORM.event,
		region: template.region || EMPTY_MONITOR_FORM.region,
		industry: template.industry || EMPTY_MONITOR_FORM.industry,
	};
}

export function MonitorBuilder({
	tenantId,
	template,
	catalog,
	onCancel,
	onCreated,
}: MonitorBuilderProps) {
	const [form, setForm] = useState<MonitorFormState>(() =>
		getInitialForm(template),
	);
	const [selection, setSelection] = useState<FeatureSelection>(() =>
		getInitialSelection(template, catalog),
	);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);
	const createMutation = useCreateTmMonitorV2Mutation(tenantId);

	const slug = slugifyMonitorName(form.name);
	const dataContract = useMemo(
		() => getDataContract(catalog, selection),
		[catalog, selection],
	);
	const selectedCount = Object.keys(selection).length;
	const isStandardTemplate = template !== null;

	function update<K extends keyof MonitorFormState>(
		field: K,
		value: MonitorFormState[K],
	) {
		setForm((current) => ({ ...current, [field]: value }));
		setFieldErrors((current) => {
			if (!(field in current)) return current;
			const { [field]: _removed, ...rest } = current;
			return rest;
		});
		setSubmitError(null);
	}

	function handleSelectionChange(next: FeatureSelection) {
		setSelection(next);
		setFieldErrors((current) => {
			if (!("features" in current)) return current;
			const { features: _removed, ...rest } = current;
			return rest;
		});
		setSubmitError(null);
	}

	function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		const errors: Record<string, string> = {};
		const parsed = MonitorFormSchema.safeParse(form);
		if (!parsed.success) {
			for (const issue of parsed.error.issues) {
				const field = String(issue.path[0] ?? "form");
				errors[field] ??= issue.message;
			}
		}

		const featuresError = validateFeatureSelection(selection);
		if (featuresError) errors.features = featuresError;

		if (form.alertEnabled && !form.alertEmail.trim()) {
			errors.alertEmail = "Enter an email to receive alerts";
		}

		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			toast.error(Object.values(errors)[0]);
			return;
		}

		createMutation.mutate(
			buildCreateMonitorPayload({
				form,
				selection,
				templateId: template?.id ?? null,
			}),
			{
				onSuccess: (monitor) => {
					toast.success("Monitor created");
					onCreated(monitor);
				},
				onError: (error) => {
					const message = getV2ErrorMessage(
						error,
						"Failed to create monitor. Please try again.",
					);
					setSubmitError(message);
					toast.error(message);
				},
			},
		);
	}

	const isSubmitting = createMutation.isPending;

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
			<div className="flex flex-col gap-3">
				<Button
					type="button"
					variant="ghost"
					className="w-fit px-4"
					onClick={onCancel}
					disabled={isSubmitting}
				>
					<ArrowLeftIcon />
					Back to templates
				</Button>
				<div className="flex flex-col gap-1">
					<h2 className="text-lg font-semibold tracking-tight">
						{template
							? `New monitor from ${template.name}`
							: "Create a custom monitor"}
					</h2>
					<p className="text-sm text-muted-foreground">
						{isStandardTemplate
							? "The template's rules are pre-selected. You can switch rules off or re-weight them before you create; its event and industry are fixed."
							: "Pick the rules you want and how much each one should count towards the risk score."}
					</p>
				</div>
			</div>

			{submitError && (
				<Alert variant="destructive">
					<WarningIcon />
					<AlertDescription>{submitError}</AlertDescription>
				</Alert>
			)}

			<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
				<div className="flex min-w-0 flex-col gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Basics</CardTitle>
							<CardDescription>
								Where this monitor applies and what it&apos;s called.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2 sm:col-span-2">
								<Label htmlFor="tm-name">Monitor name</Label>
								<Input
									id="tm-name"
									value={form.name}
									maxLength={MAX_MONITOR_NAME_LENGTH}
									placeholder="NG Web Transfers"
									aria-invalid={Boolean(fieldErrors.name)}
									onChange={(event) => update("name", event.target.value)}
									disabled={isSubmitting}
								/>
								{fieldErrors.name ? (
									<p className="text-xs text-destructive">{fieldErrors.name}</p>
								) : (
									<p className="text-xs text-muted-foreground">
										Must be unique among your active monitors.
									</p>
								)}
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="tm-event">Event</Label>
								<Select
									value={form.event}
									onValueChange={(value) => update("event", value)}
									disabled={isSubmitting || isStandardTemplate}
								>
									<SelectTrigger id="tm-event" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{TM_EVENT_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="tm-industry">Industry</Label>
								<Select
									value={form.industry}
									onValueChange={(value) => update("industry", value)}
									disabled={isSubmitting || isStandardTemplate}
								>
									<SelectTrigger id="tm-industry" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{TM_INDUSTRY_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="tm-region">Region</Label>
								<Input
									id="tm-region"
									value={form.region}
									maxLength={16}
									aria-invalid={Boolean(fieldErrors.region)}
									onChange={(event) =>
										update("region", event.target.value.toUpperCase())
									}
									disabled={isSubmitting}
								/>
								{fieldErrors.region && (
									<p className="text-xs text-destructive">
										{fieldErrors.region}
									</p>
								)}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Features</CardTitle>
							<CardDescription>
								Each feature is a rule. The slider sets its weight from 0 to 1;
								heavier rules move the risk score more.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							{fieldErrors.features && (
								<p className="text-sm text-destructive">
									{fieldErrors.features}
								</p>
							)}
							{catalog.length === 0 ? (
								<p className="py-6 text-center text-sm text-muted-foreground">
									The feature catalog is empty.
								</p>
							) : (
								<FeaturePicker
									catalog={catalog}
									selection={selection}
									onChange={handleSelectionChange}
									disabled={isSubmitting}
								/>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Cases &amp; alerts</CardTitle>
							<CardDescription>
								Decide when a score should open a case or notify your team.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-6">
							<ThresholdControl
								id="tm-auto-case"
								title="Open a case automatically"
								description="Opens an investigation case when the overall score reaches this value."
								enabled={form.autoCaseEnabled}
								value={form.autoCaseThreshold}
								disabled={isSubmitting}
								onEnabledChange={(value) => update("autoCaseEnabled", value)}
								onValueChange={(value) => update("autoCaseThreshold", value)}
							/>

							<ThresholdControl
								id="tm-alert"
								title="Email an alert"
								description="Sends an email when the overall score reaches this value."
								enabled={form.alertEnabled}
								value={form.alertThreshold}
								disabled={isSubmitting}
								onEnabledChange={(value) => update("alertEnabled", value)}
								onValueChange={(value) => update("alertThreshold", value)}
							>
								<div className="flex flex-col gap-2">
									<Label htmlFor="tm-alert-email">Alert email</Label>
									<Input
										id="tm-alert-email"
										type="email"
										value={form.alertEmail}
										placeholder="compliance@yourcompany.com"
										aria-invalid={Boolean(fieldErrors.alertEmail)}
										onChange={(event) =>
											update("alertEmail", event.target.value)
										}
										disabled={isSubmitting}
									/>
									{fieldErrors.alertEmail && (
										<p className="text-xs text-destructive">
											{fieldErrors.alertEmail}
										</p>
									)}
								</div>
							</ThresholdControl>

							<div className="flex items-start justify-between gap-4 border-t pt-4">
								<div className="flex flex-col gap-1">
									<Label htmlFor="tm-default">Use as default monitor</Label>
									<p className="text-xs text-muted-foreground">
										Used when a score request doesn&apos;t include a monitor ID.
									</p>
								</div>
								<Switch
									id="tm-default"
									checked={form.isDefault}
									onCheckedChange={(value) => update("isDefault", value)}
									disabled={isSubmitting}
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				<aside className="lg:sticky lg:top-4">
					<Card>
						<CardHeader>
							<CardTitle>Summary</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-5">
							<dl className="flex flex-col gap-3 text-sm">
								<div className="flex flex-col gap-1">
									<dt className="text-xs text-muted-foreground">Template</dt>
									<dd className="font-medium">
										{template?.name ?? "Custom (blank)"}
									</dd>
								</div>
								<div className="flex flex-col gap-1">
									<dt className="text-xs text-muted-foreground">
										Function name
									</dt>
									<dd className="font-mono text-xs break-all text-muted-foreground">
										{"{tenant_id}"}_{"{timestamp}"}_{slug || "monitor-name"}
									</dd>
								</div>
								<div className="flex items-center justify-between">
									<dt className="text-xs text-muted-foreground">Features</dt>
									<dd>
										<Badge variant="secondary" className="tabular-nums">
											{selectedCount} selected
										</Badge>
									</dd>
								</div>
							</dl>

							<div className="flex flex-col gap-2">
								<p className="text-xs font-medium">Fields your API must send</p>
								<DataContractList fields={dataContract} />
								<p className="text-xs text-muted-foreground">
									Derived from the features you selected. Send these with every
									score request.
								</p>
							</div>

							<div className="flex flex-col gap-2">
								<Button type="submit" disabled={isSubmitting}>
									<CheckCircleIcon weight="bold" />
									{isSubmitting ? "Creating…" : "Create monitor"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={onCancel}
									disabled={isSubmitting}
								>
									Cancel
								</Button>
							</div>
						</CardContent>
					</Card>
				</aside>
			</div>
		</form>
	);
}

export function ThresholdControl({
	id,
	title,
	description,
	enabled,
	value,
	disabled,
	onEnabledChange,
	onValueChange,
	children,
}: {
	id: string;
	title: string;
	description: string;
	enabled: boolean;
	value: number;
	disabled?: boolean;
	onEnabledChange: (value: boolean) => void;
	onValueChange: (value: number) => void;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col gap-1">
					<Label htmlFor={id}>{title}</Label>
					<p className="text-xs text-muted-foreground">{description}</p>
				</div>
				<Switch
					id={id}
					checked={enabled}
					onCheckedChange={onEnabledChange}
					disabled={disabled}
				/>
			</div>
			{enabled && (
				<>
					<div className="flex items-center gap-3">
						<Slider
							min={0}
							max={100}
							step={1}
							value={[value]}
							disabled={disabled}
							onValueChange={([next]) => onValueChange(next ?? value)}
							aria-label={`${title} threshold`}
						/>
						<span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums">
							{value}
						</span>
					</div>
					{children}
				</>
			)}
		</div>
	);
}
