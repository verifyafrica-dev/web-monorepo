import { PlusIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import type {
	TmMonitor,
	TmTemplate,
} from "@verifyafrica/api-client/http/v2/transaction-monitoring/transaction-monitoring.types";
import { Badge } from "@verifyafrica/ui/components/ui/badge";
import { Button } from "@verifyafrica/ui/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@verifyafrica/ui/components/ui/card";
import { Skeleton } from "@verifyafrica/ui/components/ui/skeleton";
import { createSkeletonKeys } from "@verifyafrica/ui/lib/skeleton-keys";
import { cn } from "@verifyafrica/ui/lib/utils";
import { useMemo, useState } from "react";
import {
	useTmFeaturesV2Query,
	useTmTemplatesV2Query,
} from "#/api/http/v2/transaction-monitoring/transaction-monitoring.hooks";
import { formatEventLabel, formatIndustryLabel } from "../-data";
import { MonitorBuilder } from "./monitor-builder";

type BuilderState = { template: TmTemplate | null } | null;

export function TemplatesTab({
	tenantId,
	onCreated,
}: {
	tenantId: string;
	onCreated: (monitor: TmMonitor) => void;
}) {
	const [builder, setBuilder] = useState<BuilderState>(null);
	const [eventFilter, setEventFilter] = useState<string>("all");
	const templatesQuery = useTmTemplatesV2Query(tenantId);
	const featuresQuery = useTmFeaturesV2Query(tenantId);

	const templates = useMemo(
		() => templatesQuery.data?.templates ?? [],
		[templatesQuery.data?.templates],
	);
	const catalog = useMemo(
		() => featuresQuery.data?.features ?? [],
		[featuresQuery.data?.features],
	);

	const events = useMemo(() => {
		const set = new Set<string>();
		for (const template of templates) {
			if (template.event) set.add(template.event);
		}
		return [...set];
	}, [templates]);

	const visibleTemplates = useMemo(
		() =>
			eventFilter === "all"
				? templates
				: templates.filter((template) => template.event === eventFilter),
		[templates, eventFilter],
	);

	const featureLabelByKey = useMemo(
		() => new Map(catalog.map((feature) => [feature.key, feature.label])),
		[catalog],
	);

	if (builder) {
		return (
			<MonitorBuilder
				key={builder.template?.id ?? "custom"}
				tenantId={tenantId}
				template={builder.template}
				catalog={catalog}
				onCancel={() => setBuilder(null)}
				onCreated={(monitor) => {
					setBuilder(null);
					onCreated(monitor);
				}}
			/>
		);
	}

	const isLoading = templatesQuery.isPending || featuresQuery.isPending;
	const isError = templatesQuery.isError || featuresQuery.isError;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex flex-col gap-1">
					<h2 className="text-lg font-semibold tracking-tight">
						Start from a template
					</h2>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Templates pre-select a sensible set of rules. You can still add,
						remove and re-weight features before creating your monitor.
					</p>
				</div>
				<Button
					onClick={() => setBuilder({ template: null })}
					disabled={isLoading || isError}
				>
					<PlusIcon weight="bold" />
					Create custom monitor
				</Button>
			</div>

			{events.length > 1 && (
				<fieldset
					className="flex flex-wrap gap-2 border-0 p-0"
					aria-label="Filter by event"
				>
					{["all", ...events].map((event) => (
						<Button
							key={event}
							type="button"
							size="sm"
							variant={eventFilter === event ? "default" : "outline"}
							onClick={() => setEventFilter(event)}
						>
							{event === "all" ? "All events" : formatEventLabel(event)}
						</Button>
					))}
				</fieldset>
			)}

			{isLoading ? (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{createSkeletonKeys(6, "tm-template").map((key) => (
						<Skeleton key={key} className="h-56 rounded-xl" />
					))}
				</div>
			) : isError ? (
				<Card>
					<CardContent className="py-12 text-center text-sm text-destructive">
						Unable to load templates. Please refresh and try again.
					</CardContent>
				</Card>
			) : visibleTemplates.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-3 py-12 text-center">
						<p className="text-sm text-muted-foreground">
							{templates.length === 0
								? "No templates are available yet. You can still build a monitor from scratch."
								: "No templates match this event."}
						</p>
						<Button
							variant="outline"
							onClick={() => setBuilder({ template: null })}
						>
							<SlidersHorizontalIcon />
							Create custom monitor
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{visibleTemplates.map((template) => (
						<TemplateCard
							key={template.id}
							template={template}
							featureLabelByKey={featureLabelByKey}
							onUse={() => setBuilder({ template })}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function TemplateCard({
	template,
	featureLabelByKey,
	onUse,
}: {
	template: TmTemplate;
	featureLabelByKey: Map<string, string>;
	onUse: () => void;
}) {
	const preview = template.features.slice(0, 3);
	const remaining = template.features.length - preview.length;

	return (
		<Card className="h-full">
			<CardHeader>
				<div className="flex items-start justify-between gap-3">
					<CardTitle className="text-base">{template.name}</CardTitle>
					<Badge variant="outline" className="shrink-0 tabular-nums">
						{template.features.length} rules
					</Badge>
				</div>
				<div className="flex flex-wrap gap-1.5">
					<Badge variant="secondary" className="font-normal">
						{formatEventLabel(template.event)}
					</Badge>
					<Badge variant="outline" className="font-normal">
						{template.region}
					</Badge>
					<Badge variant="outline" className="font-normal">
						{formatIndustryLabel(template.industry)}
					</Badge>
				</div>
				{template.description && (
					<CardDescription className="line-clamp-3">
						{template.description}
					</CardDescription>
				)}
			</CardHeader>
			<CardContent className="mt-auto flex flex-1 flex-col justify-between gap-4">
				<ul
					className={cn(
						"flex flex-col gap-1 text-sm text-muted-foreground",
						preview.length === 0 && "hidden",
					)}
				>
					{preview.map((feature) => (
						<li key={feature.key} className="line-clamp-1">
							• {featureLabelByKey.get(feature.key) ?? feature.key}
						</li>
					))}
					{remaining > 0 && <li>+ {remaining} more</li>}
				</ul>
				<Button className="w-full" onClick={onUse}>
					<PlusIcon weight="bold" />
					Use this template
				</Button>
			</CardContent>
		</Card>
	);
}
