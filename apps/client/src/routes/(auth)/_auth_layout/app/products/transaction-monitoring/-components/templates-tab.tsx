import { PlusIcon } from "@phosphor-icons/react";
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
import {
	formatAppLabel,
	formatEventLabel,
	formatIndustryLabel,
} from "../-data";
import { MonitorBuilder } from "./monitor-builder";

type BuilderState = { template: TmTemplate } | null;

export function TemplatesTab({
	tenantId,
	onCreated,
}: {
	tenantId: string;
	onCreated: (monitor: TmMonitor) => void;
}) {
	const [builder, setBuilder] = useState<BuilderState>(null);
	const [industryFilter, setIndustryFilter] = useState<string>("all");
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

	const industries = useMemo(() => {
		const set = new Set<string>();
		for (const template of templates) set.add(template.industry);
		return [...set];
	}, [templates]);

	const visibleTemplates = useMemo(
		() =>
			industryFilter === "all"
				? templates
				: templates.filter((template) => template.industry === industryFilter),
		[templates, industryFilter],
	);

	const featureLabelByKey = useMemo(
		() => new Map(catalog.map((feature) => [feature.key, feature.label])),
		[catalog],
	);

	if (builder) {
		// The backend only accepts rules that belong to the chosen template, so the
		// builder's picker is limited to that template's own rule set.
		const templateKeys = new Set(
			builder.template.features.map((feature) => feature.key),
		);
		return (
			<MonitorBuilder
				key={builder.template.id}
				tenantId={tenantId}
				template={builder.template}
				catalog={catalog.filter((feature) => templateKeys.has(feature.key))}
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
			<div className="flex flex-col gap-1">
				<h2 className="text-lg font-semibold tracking-tight">
					Start from a template
				</h2>
				<p className="max-w-2xl text-sm text-muted-foreground">
					These are the industry templates from our monitoring engine. Pick the
					one that matches your product and channel, then switch individual
					rules off or re-weight the rest before you create your monitor.
				</p>
			</div>

			{industries.length > 1 && (
				<fieldset
					className="flex flex-wrap gap-2 border-0 p-0"
					aria-label="Filter by industry"
				>
					{["all", ...industries].map((industry) => (
						<Button
							key={industry}
							type="button"
							size="sm"
							variant={industryFilter === industry ? "default" : "outline"}
							onClick={() => setIndustryFilter(industry)}
						>
							{industry === "all"
								? "All industries"
								: formatIndustryLabel(industry)}
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
					<CardContent className="py-12 text-center text-sm text-muted-foreground">
						No templates are available yet.
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
	const ruleCount = template.rule_count ?? template.features.length;
	const remaining = ruleCount - preview.length;

	return (
		<Card className="h-full">
			<CardHeader>
				<div className="flex items-start justify-between gap-3">
					<CardTitle className="text-base">{template.name}</CardTitle>
					<Badge variant="outline" className="shrink-0 tabular-nums">
						{ruleCount} rules
					</Badge>
				</div>
				<div className="flex flex-wrap gap-1.5">
					<Badge variant="secondary" className="font-normal">
						{formatAppLabel(template.app)} · {formatEventLabel(template.event)}
					</Badge>
					<Badge variant="outline" className="font-normal">
						{template.region}
					</Badge>
					<Badge variant="outline" className="font-normal">
						{template.industry_label ?? formatIndustryLabel(template.industry)}
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
